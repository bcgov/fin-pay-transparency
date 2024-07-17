import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import flatten from 'lodash/flatten';
import omit from 'lodash/omit';
import groupBy from 'lodash/groupBy';
import qs from 'qs';
import {
  EFFECTIVE_ROLES,
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin';
import { RoleType } from '../types/users';
import prisma from '../prisma/prisma-client';
import { logger } from '../../logger';
import { Prisma, PrismaClient, admin_user } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';

const CSS_SSO_BASE_URL = 'https://api.loginproxy.gov.bc.ca/api/v1';
const CSS_SSO_TOKEN_URL =
  'https://loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/token';

type PrismaTransactionalClient = Omit<
  PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

type LoginReponse = {
  access_token: string;
  token_type: string;
};

type GetUserResponse = {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  attributes: {
    display_name: string[];
    idir_user_guid: string[];
    idir_username: string[];
  };
};

type User = { userName: string; displayName: string; role: string };

const ROLE_NAMES = ['PTRT-USER', 'PTRT-ADMIN'];

export class SSO {
  constructor(private readonly client: AxiosInstance) {}

  static async init() {
    const { data } = await axios.post<LoginReponse>(
      CSS_SSO_TOKEN_URL,
      qs.stringify({
        grant_type: 'client_credentials',
      }),
      {
        auth: config.get('cssAppApiIntegration:auth'),
      },
    );

    const { access_token, token_type } = data;
    const client = axios.create({
      baseURL: `${CSS_SSO_BASE_URL}/integrations/${config.get('cssAppApiIntegration:integrationId')}/${config.get('cssAppApiIntegration:environment')}/`,
      headers: {
        Authorization: `${token_type} ${access_token}`,
      },
    });

    return new SSO(client);
  }

  async getUsers(): Promise<
    (Omit<User, 'role'> & { roles: string[]; effectiveRole: string })[]
  > {
    const results = await Promise.all(
      ROLE_NAMES.map(async (roleName) => {
        const { data: results } = await this.client.get<{
          data: GetUserResponse[];
        }>(`/roles/${roleName}/users`);

        return results.data
          .filter((user) => !!user.email)
          .map((item) => ({
            idirUserGuid: item.attributes.idir_user_guid[0],
            userName: item.attributes.idir_username[0],
            preferredUserName: item.username,
            displayName: item.attributes.display_name[0],
            role: roleName,
          }));
      }),
    );

    const users = flatten(results);
    const localUsers = await prisma.admin_user.findMany({
      where: {
        preferred_username: { in: users.map((u) => u.preferredUserName) },
        is_active: true,
      },
    });

    const preferredUsernameToAdminUserId = localUsers.reduce((acc, user) => {
      return { ...acc, [user.preferred_username]: user.admin_user_id };
    }, {});

    const userGroups: { [key: string]: User[] } = groupBy(
      users.filter((u) => preferredUsernameToAdminUserId[u.preferredUserName]),
      (u) => u.userName,
    );

    return Object.keys(userGroups).reduce((acc: User[], key: string) => {
      const users = userGroups[key];
      const roles = users.map((user) => user.role);
      const effectiveRole = roles.includes(PTRT_ADMIN_ROLE_NAME)
        ? PTRT_ADMIN_ROLE_NAME
        : PTRT_USER_ROLE_NAME;
      const user: any = users[0];

      return [
        ...acc,
        {
          ...omit(
            user,
            'role',
            'preferredUserName',
            'idirUserGuid',
            'userName',
          ),
          roles,
          effectiveRole,
          id: preferredUsernameToAdminUserId[user.preferredUserName],
        },
      ];
    }, []);
  }

  /**
   * Returns the roles of admin user, needs the input with guid@azureidir
   *
   * Response body
   * {
   *   "data": [
   *     {
   *       "name": "PTRT-ADMIN",
   *       "composite": false
   *     }
   *   ]
   * },
   * no roles, returns blank array
   * {
   *   "data": []
   * }
   */

  async getRolesByUser(userName: string): Promise<{ name: string }[]> {
    const response = await this.client.get(`/users/${userName}/roles`);
    return response.data?.data;
  }

  /**
   * Add roles to user
   * @param userName the username in format guid@azureidir, which is preferred_username from token
   * @param roles the roles array as sample below.
   * [
   *   {
   *     "name": "client-role"
   *   }
   * ]
   */
  async addRolesToUser(userName: string, roles: { name: string }[]) {
    await this.client.post(`/users/${userName}/roles`, roles);
  }

  /**
   * Assigns a role to a user, removing any other roles that are not in the effective roles
   * - Given PTRT-USER role, it will remove any other roles and assign only PRTT-USER
   * - Given PTRT-ADMIN role, it will assign PTRT-ADMIN and PTRT-USER to the user
   * @param userId
   * @param roleName
   */
  async assignRoleToUser(userId: string, roleName: RoleType) {
    await prisma.$transaction(async (tx) => {
      const localUser = await tx.admin_user.findUniqueOrThrow({
        where: { admin_user_id: userId },
      });

      if (!localUser.preferred_username) {
        throw new Error(
          `User not found with id: ${userId}. User name is missing.`,
        );
      }

      const currentRoles = localUser.assigned_roles.split(
        ',',
      ) as unknown as RoleType[];
      const nextRoles = EFFECTIVE_ROLES[roleName];

      const deleteRoles = currentRoles.filter(
        (role) => !nextRoles.includes(role),
      );
      const addRoles = nextRoles.filter((role) => !currentRoles.includes(role));
      let rolesDeleted = false;

      try {
        if (deleteRoles.length) {
          await Promise.all(
            deleteRoles.map((role) =>
              this.removeRoleFromUser(localUser.preferred_username, role),
            ),
          );
          rolesDeleted = true;
        }

        if (addRoles.length) {
          await this.addRolesToUser(
            localUser.preferred_username,
            addRoles.map((role) => ({ name: role })),
          );
        }
        await tx.admin_user.update({
          where: { admin_user_id: localUser.admin_user_id },
          data: {
            assigned_roles: nextRoles.join(','),
          },
        });
        await this.recordHistory(tx, localUser);
      } catch (error) {
        logger.error(`Failed to assign role to user: ${error.message}`, error);
        if (rolesDeleted) {
          // Rollback the roles if any error occurs
          try {
            await this.addRolesToUser(
              localUser.preferred_username,
              deleteRoles.map((role) => ({ name: role })),
            );
            logger.info('Successfully rolled back the deleted roles');
          } catch (error) {
            logger.error(
              `Failed to rollback the deleted roles: ${error.message}`,
              error,
            );
          }
        }
        throw error;
      }
    });
  }

  /**
   * Delete the user role in keycloak and deactivate the user in the database
   * @param userId
   */
  async deleteUser(userId: string) {
    await prisma.$transaction(async (tx) => {
      const localUser = await tx.admin_user.findUniqueOrThrow({
        where: { admin_user_id: userId },
      });

      if (!localUser.preferred_username) {
        throw new Error(
          `User not found with id: ${userId}. User name is missing.`,
        );
      }

      const roles = localUser.assigned_roles.split(',') as RoleType[];
      await Promise.all(
        roles.map((role) =>
          this.removeRoleFromUser(localUser.preferred_username, role),
        ),
      );
      await tx.admin_user.update({
        where: { admin_user_id: userId },
        data: { is_active: false },
      });
      await this.recordHistory(tx, localUser);
    });
  }

  private async removeRoleFromUser(userName: string, roleName: RoleType) {
    await this.client.delete(`/users/${userName}/roles/${roleName}`);
  }

  private async recordHistory(tx: PrismaTransactionalClient, user: admin_user) {
    await tx.admin_user_history.create({
      data: {
        admin_user_id: user.admin_user_id,
        display_name: user.display_name,
        idir_user_guid: user.idir_user_guid,
        create_user: user.create_user,
        update_user: user.update_user,
        assigned_roles: user.assigned_roles,
        is_active: user.is_active,
        preferred_username: user.preferred_username,
      },
    });
  }
}
