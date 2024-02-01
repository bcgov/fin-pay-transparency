import axios from 'axios';
import { ApiRoutes } from '../utils/constant';
import AuthService from './authService';

export enum REPORT_FORMATS {
  HTML = 'html',
  PDF = 'pdf',
  JSON = 'json',
}

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
      return Promise.reject(error);
    }
    axios.interceptors.response.eject(intercept);
    return new Promise((resolve, reject) => {
      AuthService.refreshAuthToken(
        localStorage.getItem('jwtToken'),
        localStorage.getItem('correlationID'),
      )
        .then((response) => {
          if (response.jwtFrontend) {
            localStorage.setItem('jwtToken', response.jwtFrontend);
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
          localStorage.removeItem('jwtToken');
          window.location.href = '/token-expired';
          reject(e);
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
  async postSubmission(formData) {
    try {
      const resp = await apiAxios.post(ApiRoutes.POST_SUBMISSION, formData);
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to post the submission');
    } catch (e) {
      console.log(`Failed topost the submission - ${e}`);
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
      const response = await apiAxios.get(ApiRoutes.CONFIG);
      return response;
    } catch (e) {
      console.log(`Failed to do get from Nodejs getConfig API - ${e}`);
      throw e;
    }
  },
  /**
   * Returns all published or draft reports for the current employer.
   * @param {object} filters an object of this form:
   * {
   *   report_status?: string, //Optional.  If specified must be one of: 'Published' or 'Draft'
   *   report_start_date?: string, //Optional.  If specified must be YYYY-MM format
   *   report_end_date?: string //Optional.  If specified must be YYYY-MM format
   * }
   * @returns {Array.<{report_id: String, report_start_date: Date, report_end_date: Date, revision: Number}>}
   */
  async getReports(filters?: {
    report_status?: string;
    report_start_date?: string;
    report_end_date?: string;
  }) {
    try {
      const resp = await apiAxios.get(ApiRoutes.REPORTS, {
        params: filters,
      });
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to fetch reports from API');
    } catch (e) {
      console.log(`Failed to get reports from API - ${e}`);
      throw e;
    }
  },

  async publishReport(reportId: string) {
    try {
      await apiAxios.put(`ApiRoutes.REPORTS/${reportId}`);
    } catch (e) {
      console.log(`Failed to get reports from API - ${e}`);
      throw e;
    }
  },
};
