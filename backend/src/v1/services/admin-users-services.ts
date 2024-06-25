import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import flatten from 'lodash/flatten';
import sortBy from 'lodash/sortBy';
import qs from 'qs';
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

  async getUsers(): Promise<User[]> {
    const results = await Promise.all(
      ROLE_NAMES.map(async (roleName) => {
        const data = await this.getRoleUsers(roleName);

        return data
          .filter((user) => !!user.email)
          .map((item) => ({
            userName: item.username,
            displayName: item.attributes.display_name[0],
            role: roleName,
          }));
      }),
    );

    return sortBy(flatten(results), (x) => x.displayName);
  }

  async assignRole(userName: string, newRoleName: string) {
    const userRoles = await this.getUserRoles(userName);

    const currentRole = userRoles?.[0].name;
    if (currentRole === newRoleName) {
      return;
    }

    const rollback = async () => {
      return this.addUserRole(userName, currentRole);
    };

    let currentRoleDeleted: boolean = false;
    try {
      // Delete current user role
      if (currentRole) {
        await this.deleteUserRole(userName, currentRole);
        currentRoleDeleted = true;
      }
      await this.addUserRole(userName, newRoleName);
      return { error: false };
    } catch (error) {
      if (currentRoleDeleted) {
        try {
          await rollback();
          logger.info(
            `Rollback role assignment for ${userName} to ${currentRole}`,
          );
        } catch (error) {
          logger.error(
            `Failed to rollback role assignment for ${userName} to ${currentRole}`,
          );
          logger.error(error);
        }
      }

      return { error: true };
    }
  }

  async getRoleUsers(roleName: string) {
    const { data: results } = await this.client.get<{
      data: GetUserResponse[];
    }>(`/roles/${roleName}/users`);

    return results.data;
  }

  async getUserRoles(userName: string) {
    const { data: results } = await this.client.get<{
      data: { name: string }[];
    }>(`/users/${userName}/roles`);

    return results.data;
  }

  async addUserRole(userName: string, roleName: string) {
    return this.client.post(`/users/${userName}/roles`, [
      {
        name: roleName,
      },
    ]);
  }

  async deleteUserRole(userName: string, roleName: string) {
    return this.client.delete(`/users/${userName}/roles/${roleName}`);
  }
}
