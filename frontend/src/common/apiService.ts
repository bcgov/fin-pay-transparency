import axios from 'axios';
import { saveAs } from 'file-saver';
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
      const resp = await apiAxios.get(ApiRoutes.REPORT, {
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

  /**
   * Get the form details of an existing report
   * @param {string} reportId
   * @returns {report_id, user_comment, employee_count_range_id, naics_code, report_start_date, report_end_date, report_status, revision, data_constraints}
   */
  async getReport(reportId) {
    try {
      const resp = await apiAxios.get(ApiRoutes.REPORT + reportId);
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to fetch report from API');
    } catch (e) {
      console.log(`Failed to get report from API - ${e}`);
      throw e;
    }
  },

  /**
   * Get the report as HTML
   * @param {string} reportId
   * @returns {string} HTML version of the report
   */
  async getHtmlReport(reportId) {
    try {
      const resp = await apiAxios.get(ApiRoutes.REPORT + reportId, {
        headers: { accept: 'text/html' },
        responseType: 'text',
      });
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to fetch html report from API');
    } catch (e) {
      console.log(`Failed to get html report from API - ${e}`);
      throw e;
    }
  },

  /**
   * Download the report in a PDF format.
   * @param {string} reportId
   */
  async getPdfReport(reportId) {
    try {
      const resp = await apiAxios.get(ApiRoutes.REPORT + reportId, {
        headers: { accept: 'application/pdf' },
        responseType: 'blob',
      });

      if (resp?.data) {
        //get/create filename
        let fileName = '';
        if (resp?.headers['content-disposition']) {
          const startFileNameIndex =
            resp.headers['content-disposition'].indexOf('filename=') + 9;
          const endFileNameIndex =
            resp.headers['content-disposition'].lastIndexOf('.pdf') + 4;
          fileName = resp.headers['content-disposition'].substring(
            startFileNameIndex,
            endFileNameIndex,
          );
        }
        if (!fileName) fileName = 'pay_transparency_report.pdf';

        //make the browser save the file
        saveAs(resp.data, fileName, { type: 'application/pdf' } as any);
      } else {
        throw new Error('Unable to fetch pdf report from API');
      }
    } catch (e) {
      console.log(`Failed to get pdf report from API - ${e}`);
      throw e;
    }
  },

  /**
   * Change the status of an existing report from Draft to Published.
   * @param {string} reportId  The id of a Draft report that should be Published
   */
  async publishReport(reportId: string): Promise<string> {
    try {
      const resp = await apiAxios.put(`${ApiRoutes.REPORT}/${reportId}`);
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unexpected response from publishReport API');
    } catch (e) {
      console.log(`Failed to get reports from API - ${e}`);
      throw e;
    }
  },
};
