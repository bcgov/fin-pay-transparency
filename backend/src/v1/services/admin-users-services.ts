import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import flatten from 'lodash/flatten';
import qs from 'qs';

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

    const client = axios.create({
      baseURL: `${CSS_SSO_BASE_URL}/integrations/${config.get('cssAppApiIntegration:integrationId')}/${config.get('cssAppApiIntegration:environment')}/`,
    });

    const { access_token, token_type } = data;
    client.interceptors.request.use((config) => {
      config.headers.Authorization = `${token_type} ${access_token}`;
      return config;
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
}
