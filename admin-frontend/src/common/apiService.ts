import axios from 'axios';
import { ApiRoutes } from '../utils/constant';
import AuthService from './authService';
import { IConfigValue } from './types';

export const LOCAL_STORAGE_KEY_JWT = 'pay-transparency-admin-jwt';

// Buffer concurrent requests while refresh token is being acquired
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom: any) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
}

// Create new non-global axios instance and intercept strategy
const apiAxios = axios.create();
const intercept = apiAxios.interceptors.response.use(
  (config) => config,
  (error) => {
    const originalRequest = error.config;
    if (error.response.status !== 401) {
      return Promise.reject(new Error('AxiosError', { cause: error }));
    }
    axios.interceptors.response.eject(intercept);
    return new Promise((resolve, reject) => {
      AuthService.refreshAuthToken(
        localStorage.getItem(LOCAL_STORAGE_KEY_JWT),
        localStorage.getItem('correlationID'),
      )
        .then((response) => {
          if (response.jwtFrontend) {
            localStorage.setItem(LOCAL_STORAGE_KEY_JWT, response.jwtFrontend);
            localStorage.setItem('correlationID', response.correlationID);
            apiAxios.defaults.headers.common['Authorization'] =
              `Bearer ${response.jwtFrontend}`;
            originalRequest.headers['Authorization'] =
              `Bearer ${response.jwtFrontend}`;
            apiAxios.defaults.headers.common['x-correlation-id'] =
              response.correlationID;
            originalRequest.headers['x-correlation-id'] =
              response.correlationID;
          }
          processQueue(null, response.jwtFrontend);
          resolve(axios(originalRequest));
        })
        .catch((e) => {
          processQueue(e, null);
          localStorage.removeItem(LOCAL_STORAGE_KEY_JWT);
          window.location.href = '/token-expired';
          reject(new Error('token expired', { cause: e }));
        });
    });
  },
);

export default {
  apiAxios: apiAxios,
  intercept: intercept,
  processQueue,
  failedQueue,

  setAuthHeader(token) {
    if (token) {
      apiAxios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete apiAxios.defaults.headers.common['Authorization'];
    }
  },
  setCorrelationID(correlationID) {
    if (correlationID) {
      apiAxios.defaults.headers.common['x-correlation-id'] = correlationID;
    } else {
      delete apiAxios.defaults.headers.common['x-correlation-id'];
    }
  },
  async getUserInfo() {
    try {
      return await apiAxios.get(ApiRoutes.USER);
    } catch (e) {
      console.log(`Failed to get from Nodejs getUserInfo API - ${e}`);
      throw e;
    }
  },
  async getConfig() {
    try {
      const { data } = await apiAxios.get<IConfigValue>(ApiRoutes.CONFIG);

      return data;
    } catch (e) {
      console.log(`Failed to do get from Nodejs getConfig API - ${e}`);
      throw e;
    }
  },
};
