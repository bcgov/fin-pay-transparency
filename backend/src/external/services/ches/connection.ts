import axios from 'axios';
import oauth from 'axios-oauth-client';
import tokenProvider from 'axios-token-interceptor';

class ClientConnection {
  private readonly tokenUrl: string;
  private readonly axios: any;
  private readonly clientCreds: any;

  constructor({ tokenUrl, clientId, clientSecret, axiosInstance = null }) {
    if (!axiosInstance) {
      this.tokenUrl = tokenUrl;
      this.axios = axios.create();
      this.clientCreds = oauth.clientCredentials(
        axios.create(),
        this.tokenUrl,
        clientId,
        clientSecret
      );
      this.axios.interceptors.request.use(
        tokenProvider({
          getToken: async () => {
            const data = await this.clientCreds('');
            return data.access_token;
          }
        })
      );
    } else {
      this.axios = axiosInstance;
    }

  }

  getAxios() {
    return this.axios;
  }
}

export default ClientConnection;
