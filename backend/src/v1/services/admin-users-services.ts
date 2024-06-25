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
        const { data: results } = await this.client.get<{
          data: GetUserResponse[];
        }>(`/roles/${roleName}/users`);

        return results.data
          .filter((user) => !!user.email)
          .map((item) => ({
            userName: item.attributes.idir_username[0],
            displayName: item.attributes.display_name[0],
            role: roleName,
          }));
      }),
    );

    return flatten(results);
  }

  async addNewUser(email: string, roles: string, firstname: string, createdBy: string) {
    let pendingUserRequestCount =  await prisma.admin_user_onboarding.count({ where: { email: email , is_onboarded: false} });
    if(pendingUserRequestCount > 0){
      throw new Error('Add user Request already exists');
    }else {
      prisma.transaction(async (prisma) => {
        await prisma.admin_user_onboarding.create({
          email: email,
          firstname: firstname,
          assigned_roles: roles,
          created_by: createdBy
        });
        await sendUserEmailInvite(email, firstname);
      });
    }
    }

  async sendUserEmailInvite(email: string, firstname: string) {
    const emailContent = emailService.generateHtmlEmail(
      'Pay Transparency Admin Tool Onboarding',
      email,
      'Pay Transparency Admin Tool Onboarding',
      `Hello ${firstname}, <br><br> You have been invited to join the Pay Transparency Reporting Admin Tool as an User. Please click the link below to complete your registration and access the application. <br><br> <a href="${config.get('frontendUrl')}">Click here to complete your registration</a>`,
      'You have been invited to join the Pay Transparency Reporting Tool as an Admin User. Please click the link below to complete your registration and access the application.`<a href="${config.get('adminfrontendurl')}>Click here to complete your registration</a>`'
    );
    await emailService.sendEmailWithRetry(emailContent,3);
  }
}
