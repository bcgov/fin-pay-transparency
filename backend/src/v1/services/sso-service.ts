import { admin_user, Prisma, PrismaClient } from '@prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/library';
import axios, { AxiosInstance } from 'axios';
import { difference } from 'lodash';
import qs from 'qs';
import { config } from '../../config';
import {
  EFFECTIVE_ROLES,
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin';
import { logger } from '../../logger';
import prisma from '../prisma/prisma-client';
import { adminAuth, IUserDetails } from '../services/admin-auth-service';
import { RoleType } from '../types/users';
import { convert, ZonedDateTime, ZoneId } from '@js-joda/core';

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

type User = {
  id: string;
  displayName: string;
  effectiveRole: string;
};
type SsoUser = {
  displayName: string;
  idirUserGuid: string;
  preferredUserName: string;
  email: string;
  roles: string[];
  userName: string;
};

export const ROLE_ADMIN_USER = 'PTRT-USER';
export const ROLE_ADMIN_MANAGER = 'PTRT-ADMIN';
const ROLE_NAMES = [ROLE_ADMIN_USER, ROLE_ADMIN_MANAGER];

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

  /** Get simplified user list to pass to frontend */
  async getUsersForDisplay(): Promise<User[]> {
    const users = await this.getUsers();

    const ret = users.map<User>((u) => ({
      displayName: u.display_name,
      id: u.admin_user_id,
      effectiveRole: u.assigned_roles
        .split(',')
        .slice()
        .includes(PTRT_ADMIN_ROLE_NAME)
        ? PTRT_ADMIN_ROLE_NAME
        : PTRT_USER_ROLE_NAME,
    }));

    return ret;
  }

  /**  Get all users from SSO while ensuring DB is up to date. (To ensure our history is accurate) */
  async getUsers(): Promise<admin_user[]> {
    // create dictionary of users from SSO
    const ssoUsers: Record<string, SsoUser> = {};
    for (const roleName of ROLE_NAMES) {
      const { data: results } = await this.client.get<{
        data: GetUserResponse[];
      }>(`/roles/${roleName}/users`);

      for (const user of results.data) {
        if (!user.email) continue; // ignore service accounts
        const prefUser = user.username;
        if (prefUser in ssoUsers)
          // user exists, add role to user
          ssoUsers[prefUser].roles.push(roleName);
        else
          ssoUsers[prefUser] = {
            idirUserGuid: user.attributes.idir_user_guid[0],
            userName: user.attributes.idir_username[0],
            preferredUserName: user.username,
            email: user.email,
            displayName: user.attributes.display_name[0],
            roles: [roleName],
          };
      }
    }

    if (Object.keys(ssoUsers).length < 1) {
      // There should always be at least 1 user.
      // If none were found then there is a problem and the local database should not be modified
      logger.error(`Keycloak did not find any users with any permissions`);
      throw Error('No users found from Keycloak');
    }

    // get the users from the database
    let localUsers = await prisma.admin_user.findMany({
      where: {
        is_active: true,
      },
    });

    // ensure each SSO user is in our database and their details are up to date
    let isDbUpdated = false;
    for (const prefUser in ssoUsers) {
      const match = localUsers.find(
        (localUser) => localUser.preferred_username == prefUser,
      );

      const userDetails: IUserDetails = {
        idirUserGuid: ssoUsers[prefUser].idirUserGuid,
        displayName: ssoUsers[prefUser].displayName,
        preferredUsername: ssoUsers[prefUser].preferredUserName,
        email: ssoUsers[prefUser].email,
        roles: ssoUsers[prefUser].roles,
      };

      const updated = await adminAuth.storeUserInfoWithHistory(
        userDetails,
        undefined,
        match,
        false,
      );

      isDbUpdated = isDbUpdated || updated;
    }

    // remove any users that are in db but not in sso
    const deletedUsers = difference(
      localUsers.map((x) => x.preferred_username),
      Object.keys(ssoUsers),
    );
    for (const prefUser of deletedUsers) {
      const localUser = localUsers.find(
        (localUser) => localUser.preferred_username == prefUser,
      );
      await this.setUserInactiveInDatabase(localUser, 'Keycloak');
    }

    // need new admin_user_id from database
    if (isDbUpdated)
      localUsers = await prisma.admin_user.findMany({
        where: {
          is_active: true,
        },
      });

    return localUsers;
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
   * @param userId - the user to delete
   * @param modifiedByUserId - the user who modified this record
   */
  async deleteUser(userId: string, modifiedByUserId: string) {
    const localUser = await prisma.admin_user.findUniqueOrThrow({
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
    await this.setUserInactiveInDatabase(localUser, modifiedByUserId);
  }

  private async removeRoleFromUser(userName: string, roleName: RoleType) {
    await this.client.delete(`/users/${userName}/roles/${roleName}`);
  }

  private async setUserInactiveInDatabase(
    localUser: admin_user,
    modifiedByUserId: string,
  ) {
    await prisma.$transaction(async (tx) => {
      await tx.admin_user.update({
        where: { admin_user_id: localUser.admin_user_id },
        data: {
          is_active: false,
          update_date: convert(ZonedDateTime.now(ZoneId.UTC)).toDate(),
          update_user: modifiedByUserId,
        },
      });
      await this.recordHistory(tx, localUser);
    });
  }

  private async recordHistory(tx: PrismaTransactionalClient, user: admin_user) {
    await tx.admin_user_history.create({
      data: user,
    });
  }
}
