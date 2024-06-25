import axios from 'axios';
import { saveAs } from 'file-saver';
import {
  AddUserInput,
  IConfigValue,
  IReportSearchResult,
  User,
} from '../types';
import { ApiRoutes } from '../utils/constant';
import AuthService from './authService';

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
  async getUsers() {
    try {
      return await apiAxios.get<User[]>(ApiRoutes.USERS);
    } catch (e) {
      console.log(`Failed to get from Nodejs getUsers API - ${e}`);
      throw e;
    }
  },
  async addUser(data: AddUserInput) {
    try {
      return await apiAxios.post(ApiRoutes.USERS, data);
    } catch (e) {
      console.log(`Failed to get from Nodejs addUser API - ${e}`);
    }
  },
  async assignUserRole(username: string, role: string) {
    try {
      return await apiAxios.patch(`${ApiRoutes.USERS}/roles`, {
        role,
        username,
      });
    } catch (e) {
      console.log(`Failed to get from Nodejs getUsers API - ${e}`);
      throw e;
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
  async getEmployeeCountRanges() {
    try {
      const resp = await apiAxios.get(ApiRoutes.EMPLOYEE_COUNT_RANGES);
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to fetch employee count ranges from API');
    } catch (e) {
      console.log(`Failed to get employee count ranges from API - ${e}`);
      throw e;
    }
  },
  async getNaicsCodes() {
    try {
      const resp = await apiAxios.get(ApiRoutes.NAICS_CODES);
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to fetch NAICS codes from API');
    } catch (e) {
      console.log(`Failed to get NAICS from API - ${e}`);
      throw e;
    }
  },
  async getReports(
    offset: number = 0,
    limit: number = 20,
    filter: any[] | null = null,
    sort: any[] | null = null,
  ): Promise<IReportSearchResult> {
    try {
      if (!filter) {
        filter = [];
      }
      if (!sort) {
        sort = [{ update_date: 'desc' }];
      }
      const params = {
        offset: offset,
        limit: limit,
        filter: JSON.stringify(filter),
        sort: JSON.stringify(sort),
      };
      const resp = await apiAxios.get<IReportSearchResult>(ApiRoutes.REPORTS, {
        params: params,
      });
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to get reports from API');
    } catch (e) {
      console.log(`Failed to get reports from API - ${e}`);
      throw e;
    }
  },

  /**
   * Download a list of reports in csv format.  This method also causes
   * the browser to save the resulting file.
   */
  async downloadReportsCsv(
    filter: any[] | null = null,
    sort: any[] | null = null,
  ) {
    try {
      if (!filter) {
        filter = [];
      }
      if (!sort) {
        sort = [{ update_date: 'desc' }];
      }
      const resp = await apiAxios.get(ApiRoutes.REPORTS, {
        headers: { accept: 'text/csv' },
        params: { filter: JSON.stringify(filter), sort: JSON.stringify(sort) },
      });

      if (resp?.data) {
        //make the browser save the file
        const blob = new Blob([resp.data], {
          type: resp.headers['content-type'],
        });
        saveAs(blob, 'pay-transparency-reports.csv');
      } else {
        throw new Error('Unable to download reports in CSV format');
      }
    } catch (e) {
      console.log(`Failed to get reports in CSV format - ${e}`);
      throw e;
    }
  },

  /**
   * Downloads a PDF of the report with the given id as a blob.
   * Returns the blob.
   * @param {string} reportId
   * @returns a blob with the report's binary data
   */
  async getPdfReportAsBlob(reportId) {
    try {
      const resp = await apiAxios.get(`${ApiRoutes.REPORTS}/${reportId}`, {
        headers: { accept: 'application/pdf' },
        responseType: 'blob',
      });

      if (resp?.data) {
        //return the PDF data as a blob.
        return resp.data;
      } else {
        throw new Error('Unable to get pdf report from API');
      }
    } catch (e) {
      console.log(`Failed to get pdf report from API - ${e}`);
      throw e;
    }
  },

  async lockUnlockReport(
    reportId: string,
    makeUnlocked: boolean,
  ): Promise<boolean> {
    const un = makeUnlocked ? 'un' : '';
    try {
      const resp = await apiAxios.patch(`${ApiRoutes.REPORTS}/${reportId}`, {
        is_unlocked: makeUnlocked,
      });
      if (resp?.data) {
        return resp.data.is_unlocked == makeUnlocked;
      }
      throw new Error('Unexpected response from API.');
    } catch (e) {
      console.log(`Failed to ${un}lock report: ${e}`);
      throw e;
    }
  },
};
