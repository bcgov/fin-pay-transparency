import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import flatten from 'lodash/flatten';
import qs from 'qs';
import emailService from '../../external/services/ches';
import prisma from '../prisma/prisma-client';

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
  constructor(private readonly client: AxiosInstance) {
  }

  static async init() {
    const { data } = await axios.post<LoginReponse>(
      CSS_SSO_TOKEN_URL,
      qs.stringify({
        grant_type: 'client_credentials'
      }),
      {
        auth: config.get('cssAppApiIntegration:auth')
      }
    );

    const { access_token, token_type } = data;
    const client = axios.create({
      baseURL: `${CSS_SSO_BASE_URL}/integrations/${config.get('cssAppApiIntegration:integrationId')}/${config.get('cssAppApiIntegration:environment')}/`,
      headers: {
        Authorization: `${token_type} ${access_token}`
      }
    });

    return new SSO(client);
  }

  async getUsers(): Promise<User[]> {
    const results = await Promise.all(
      ROLE_NAMES.map(async (roleName) => {
        const { data: results } = await this.client.get<{
          data: GetUserResponse[];
        }>(`/roles/${roleName}/users`);

        return results.data
          .filter((user) => !!user.email)
          .map((item) => ({
            userName: item.attributes.idir_username[0],
            displayName: item.attributes.display_name[0],
            role: roleName
          }));
      })
    );

    return flatten(results);
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


}
//TODO move the above SSO, to a separate service class, which could be reused from AdminUserService and other service layers.
export class AdminUserService {
  async addNewUser(email: string, roles: string, firstname: string, createdBy: string) {
    let pendingUserRequestCount = await prisma.admin_user_onboarding.count({
      where: {
        email: email
      }
    });
    if (pendingUserRequestCount > 0) {
      throw new Error('Add user Request already exists');
    } else {
      await prisma.admin_user_onboarding.create({
        data:{
          email: email,
          first_name: firstname,
          assigned_roles: roles,
          is_onboarded: false,
          created_by: createdBy,
          expiry_date: new Date(new Date().getTime() + 72 * 60 * 60 * 1000) //TODO make expiry configurable
        }

      });
      await this.sendUserEmailInvite(email, firstname);
    }
  }

  async sendUserEmailInvite(email: string, firstname: string) {
    const htmlEmail = emailService.generateHtmlEmail(
      'Pay Transparency Admin Tool Onboarding',
      [email],
      'Pay Transparency Admin Tool Onboarding',
      `Hello ${firstname}, <br><br> You have been invited to join the Pay Transparency Reporting Admin Tool as an User. Please click the link below to complete your registration and access the application. <br><br> <a href="${config.get('frontendUrl')}">Click here to complete your registration</a>`,
      `You have been invited to join the Pay Transparency Reporting Tool as an Admin User. Please click the link below to complete your registration and access the application.<a href="${config.get('adminfrontendurl')}">Click here to complete your registration</a>`
    );
    await emailService.sendEmailWithRetry(htmlEmail, 3);
  }
}
