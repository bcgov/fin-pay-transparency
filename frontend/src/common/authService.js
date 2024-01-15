import axios from 'axios';
import { AuthRoutes } from '../utils/constant.js';

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

      if (response && response.data && response.data.error) {
        return { error: response.data.error_description };
      }

      return response.data;
    } catch (e) {
      console.log(`Failed to refresh JWT token - ${e}`); // eslint-disable-line no-console
      throw e;
    }
  },
};
