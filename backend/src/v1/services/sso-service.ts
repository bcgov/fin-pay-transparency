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

const CSS_SSO_BASE_URL = 'https://api.loginproxy.gov.bc.ca/api/v1';
const CSS_SSO_TOKEN_URL =
  'https://loginproxy.gov.bc.ca/auth/realms/standard/protocol/openid-connect/token';

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
            displayName: item.attributes.display_name[0],
            role: roleName,
          }));
      }),
    );

    const userGroups: { [key: string]: User[] } = groupBy(
      flatten(results),
      (u) => u.userName,
    );

    return Object.keys(userGroups).reduce((acc: User[], key: string) => {
      const users = userGroups[key];
      const roles = users.map((user) => user.role);
      const effectiveRole = roles.includes(PTRT_ADMIN_ROLE_NAME)
        ? PTRT_ADMIN_ROLE_NAME
        : PTRT_USER_ROLE_NAME;
      const user = users[0];

      return [...acc, { ...omit(user, 'role'), roles, effectiveRole }];
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

  async getRolesByUser(userName: string): Promise<string[]> {
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

  async assignRoleToUser(userId: string, roleName: RoleType) {
    const localUser = await prisma.admin_user.findUniqueOrThrow({
      where: { admin_user_id: userId },
    });

    if (!localUser.username) {
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
            this.removeRoleFromUser(localUser.username, role),
          ),
        );
        rolesDeleted = true;
      }

      if (addRoles.length) {
        await this.addRolesToUser(
          localUser.username,
          addRoles.map((role) => ({ name: role })),
        );
      }
      await prisma.admin_user.update({
        where: { admin_user_id: localUser.admin_user_id },
        data: {
          assigned_roles: nextRoles.join(','),
        },
      });
    } catch (error) {
      logger.error(`Failed to assign role to user: ${error.message}`, error);
      if (rolesDeleted) {
        // Rollback the roles if any error occurs
        try {
          await this.addRolesToUser(
            localUser.username,
            deleteRoles.map((role) => ({ name: role })),
          );
        } catch (error) {
          logger.error(
            `Failed to rollback the deleted roles: ${error.message}`,
            error,
          );
        }
      }
      throw error;
    }
  }

  async removeRoleFromUser(userName: string, roleName: RoleType) {
    await this.client.delete(`/users/${userName}/roles/${roleName}`);
  }

  async deleteUser(userId: string) {
    const localUser = await prisma.admin_user.findUniqueOrThrow({
      where: { admin_user_id: userId },
    });

    if (!localUser.username) {
      throw new Error(
        `User not found with id: ${userId}. User name is missing.`,
      );
    }

    const roles = localUser.assigned_roles.split(',') as RoleType[];

    await Promise.all(
      roles.map((role) => this.removeRoleFromUser(localUser.username, role)),
    );
    await prisma.admin_user.update({
      where: { admin_user_id: userId },
      data: { is_active: false },
    });
  }
}
