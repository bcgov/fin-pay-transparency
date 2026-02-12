import axios from 'axios';
import { AuthRoutes } from '../utils/constant.js';

function parseJwt(token) {
  if (!token) return {};
  const base64Url = token.split('.')[1];
  if (!base64Url) return {};
  const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
  const jsonPayload = decodeURIComponent(
    globalThis
      .atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.codePointAt(0).toString(16)).slice(-2);
      })
      .join(''),
  );

  return JSON.parse(jsonPayload);
}

export default {
  //Retrieves an auth token from the API endpoint
  async getAuthToken() {
    try {
      const response = await axios.get(AuthRoutes.TOKEN);
      return response.data;
    } catch (e) {
      console.log(`Failed to acquire JWT token - ${e}`); // eslint-disable-line no-console
      throw e;
    }
  },

  //Refreshes the users auth token
  async refreshAuthToken(token, correlationID) {
    try {
      const response = await axios.post(
        AuthRoutes.REFRESH,
        {
          refreshToken: token,
        },
        {
          headers: {
            'x-correlation-id': correlationID,
          },
        },
      );

      if (response?.data?.error) {
        return { error: response.data.error_description };
      }

      return { ...response.data, ...parseJwt(response.data.jwtFrontend) };
    } catch (e) {
      console.log(`Failed to refresh JWT token - ${e}`);
      throw e;
    }
  },
};
