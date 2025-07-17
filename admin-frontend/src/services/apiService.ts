import axios from 'axios';
import { saveAs } from 'file-saver';
import {
  CreateUserInviteInput,
  IConfigValue,
  User,
  UserInvite,
} from '../types';
import {
  Announcement,
  AnnouncementFilterType,
  AnnouncementFormValue,
  AnnouncementSortType,
  AnnouncementStatus,
  IAnnouncementSearchResult,
} from '../types/announcements';
import {
  EmployerFilterType,
  EmployerMetrics,
  EmployerSortType,
  IEmployerSearchResult,
} from '../types/employers';
import { IReportSearchResult, ReportMetrics } from '../types/reports';
import { ApiRoutes, POWERBI_RESOURCE } from '../utils/constant';
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
  async inviteUser(data: CreateUserInviteInput) {
    try {
      return await apiAxios.post(ApiRoutes.USER_INVITES, data);
    } catch (e) {
      console.log(`Failed to post from Nodejs invite API - ${e}`);
      throw e;
    }
  },
  async getPendingUserInvites() {
    try {
      return await apiAxios.get<UserInvite[]>(ApiRoutes.USER_INVITES);
    } catch (e) {
      console.log(`Failed to get from Nodejs getPendingUserInvites API - ${e}`);
      throw e;
    }
  },
  async deleteUserInvite(id: string) {
    try {
      return await apiAxios.delete(`${ApiRoutes.USER_INVITES}/${id}`);
    } catch (e) {
      console.log(`Failed to delete from Nodejs deleteUserInvite API - ${e}`);
      throw e;
    }
  },
  async resendUserInvite(id: string) {
    try {
      return await apiAxios.patch(`${ApiRoutes.USER_INVITES}/${id}`);
    } catch (e) {
      console.log(`Failed to patch from Nodejs resendUserInvite API - ${e}`);
      throw e;
    }
  },
  async assignUserRole(userId: string, role: string) {
    try {
      return await apiAxios.patch(`${ApiRoutes.USERS}/${userId}`, {
        role,
      });
    } catch (e) {
      console.log(`Failed to patch from Nodejs assignUserRole API - ${e}`);
      throw e;
    }
  },
  async deleteUser(userId: string) {
    try {
      return await apiAxios.delete(`${ApiRoutes.USERS}/${userId}`);
    } catch (e) {
      console.log(`Failed to delete from Nodejs deleteUser API - ${e}`);
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
  async downloadFile(fileId: string) {
    try {
      const { data, headers } = await apiAxios.get(
        `${ApiRoutes.RESOURCES}/${fileId}`,
        {
          responseType: 'blob',
        },
      );
      const name = headers['content-disposition']
        .split('filename="')[1]
        .split('.')[0];
      const extension = headers['content-disposition']
        .split('.')[1]
        .split('"')[0];

      const filename = `${name}.${extension}`;
      if (filename.toLowerCase().includes('pdf')) {
        const file = window.URL.createObjectURL(
          new Blob([data], { type: 'application/pdf' }),
        );
        window.open(file);
        return { mode: 'open', filename };
      }

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      return { mode: 'download', filename };
    } catch (error) {
      console.log(`Failed to get from Nodejs downloadFile API - ${error}`);
      throw error;
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

  async getReportAdminActionHistory(reportId: string): Promise<any> {
    try {
      const resp = await apiAxios.get(
        `${ApiRoutes.REPORTS}/${reportId}/admin-action-history`,
      );
      if (resp?.data) {
        return resp.data;
      }
      throw new Error(
        `Unable to fetch admin action history for report ${reportId}`,
      );
    } catch (e) {
      console.log(`Failed to get admin action history for report - ${e}`);
      throw e;
    }
  },

  async getReportMetrics(): Promise<ReportMetrics> {
    try {
      const resp = await apiAxios.get(ApiRoutes.REPORT_METRICS);
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to fetch report metrics');
    } catch (e) {
      console.log(`Failed to get report metrics from API - ${e}`);
      throw e;
    }
  },

  async getEmployerMetrics(): Promise<EmployerMetrics> {
    try {
      const resp = await apiAxios.get(ApiRoutes.EMPLOYER_METRICS);
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to fetch employer metrics');
    } catch (e) {
      console.log(`Failed to get employer metrics from API - ${e}`);
      throw e;
    }
  },

  async getAnnouncements(
    offset: number = 0,
    limit: number = 20,
    filter: AnnouncementFilterType | null = null,
    sort: AnnouncementSortType | null = null,
  ): Promise<IAnnouncementSearchResult> {
    try {
      if (!filter) {
        filter = [];
      }
      if (!sort) {
        sort = [{ field: 'active_on', order: 'asc' }];
      }
      const params = {
        offset: offset,
        limit: limit,
        filters: filter,
        sort: sort,
      };
      const resp = await apiAxios.get<IAnnouncementSearchResult>(
        ApiRoutes.ANNOUNCEMENTS,
        {
          params: params,
        },
      );
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to get announcements from API');
    } catch (e) {
      console.log(`Failed to get announcements from API - ${e}`);
      throw e;
    }
  },

  async archiveAnnouncements(announcementIds: string[]): Promise<void> {
    try {
      const body = announcementIds?.map((id) => {
        return {
          id: id,
          status: AnnouncementStatus.Archived,
        };
      });
      const resp = await apiAxios.patch(`${ApiRoutes.ANNOUNCEMENTS}`, body);
      if (resp?.status == 201) {
        return;
      }
      throw new Error('Unexpected response from API.');
    } catch (e) {
      console.log(`Failed to delete announcements: ${e}`);
      throw e;
    }
  },

  /*
  Changes the status of an announcement to DRAFT
  */
  async unpublishAnnouncement(announcementId: string): Promise<void> {
    try {
      const body = [
        {
          id: announcementId,
          status: AnnouncementStatus.Draft,
        },
      ];
      const resp = await apiAxios.patch(`${ApiRoutes.ANNOUNCEMENTS}`, body);
      if (resp?.status == 201) {
        return;
      }
      throw new Error('Unexpected response from API.');
    } catch (e) {
      console.log(`Failed to unpublish announcement: ${e}`);
      throw e;
    }
  },

  async getAnnouncement(id: string) {
    try {
      const { data } = await apiAxios.get<
        Announcement & {
          announcement_resource: {
            resource_type: string;
            display_name: string;
            resource_url: string;
            attachment_file_id: string;
          }[];
        }
      >(`${ApiRoutes.ANNOUNCEMENTS}/${id}`);
      return data;
    } catch (e) {
      console.log(`Failed to get announcement from API - ${e}`);
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

  async addAnnouncement(data: AnnouncementFormValue) {
    const formData = buildFormData(data);

    try {
      return await apiAxios.post(ApiRoutes.ANNOUNCEMENTS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (e) {
      console.error(`Failed to post from Nodejs addAnnouncement API - ${e}`);
      throw e;
    }
  },

  async updateAnnouncement(id: string, data: AnnouncementFormValue) {
    const formData = buildFormData(data);
    try {
      return await apiAxios.put(`${ApiRoutes.ANNOUNCEMENTS}/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (e) {
      console.error(`Failed to put from Nodejs addAnnouncement API - ${e}`);
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

  async withdrawReport(reportId: string): Promise<any> {
    try {
      // PATCH endpoint expects { withdrawn: true } as per backend route
      const resp = await apiAxios.patch(`${ApiRoutes.REPORTS}/${reportId}`, {
        is_withdrawn: true,
      });
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unexpected response from API.');
    } catch (e) {
      console.log(`Failed to withdraw report: ${e}`);
      throw e;
    }
  },

  async getPowerBiEmbedAnalytics(resources: POWERBI_RESOURCE[]) {
    type PowerBiEmbedInfo = {
      resources: { name: string; id: string; embedUrl: string }[];
      accessToken: string;
      expiry: string;
    };

    try {
      const resp = await apiAxios.get<PowerBiEmbedInfo>(
        `${ApiRoutes.POWERBI_EMBED_ANALYTICS}?resources[]=${resources.join('&resources[]=')}`,
      );
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to get analytics token from API.');
    } catch (e) {
      console.log(`Failed to get analytics token from API - ${e}`);
      throw e;
    }
  },
  async clamavScanFile(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await apiAxios.post(ApiRoutes.CLAMAV_SCAN, formData);
      return data;
    } catch (error) {
      console.log(`Failed to post from Nodejs clamavScanFile API - ${error}`);
      throw error;
    }
  },
  async getAnnouncementsMetrics() {
    try {
      const { data } = await apiAxios.get(ApiRoutes.ANNOUNCEMENTS_METRICS);
      return data;
    } catch (e) {
      console.log(`Failed to get announcements metrics from API - ${e}`);
      throw e;
    }
  },

  async getEmployers(
    offset: number = 0,
    limit: number = 1000,
    filter: EmployerFilterType = [],
    sort: EmployerSortType = [{ field: 'company_name', order: 'asc' }],
  ): Promise<IEmployerSearchResult> {
    try {
      const params = {
        offset: offset,
        limit: limit,
        filter: filter,
        sort: sort,
      };
      const resp = await apiAxios.get<IEmployerSearchResult>(
        ApiRoutes.EMPLOYER,
        {
          params: params,
        },
      );
      if (resp?.data) {
        return resp.data;
      }
      throw new Error('Unable to get employers from API');
    } catch (e) {
      console.log(`Failed to get employers from API - ${e}`);
      throw e;
    }
  },
};

const buildFormData = (data: AnnouncementFormValue) => {
  const formData = new FormData();
  formData.append('title', data.title.trim());
  formData.append('description', data.description.trim());
  formData.append('status', data.status);
  if (data.active_on) {
    formData.append('active_on', data.active_on);
  }
  if (data.expires_on) {
    formData.append('expires_on', data.expires_on);
  }
  if (data.linkUrl && data.linkDisplayName) {
    formData.append('linkUrl', data.linkUrl.trim());
    formData.append('linkDisplayName', data.linkDisplayName);
  }

  if (data.attachment) {
    formData.append('file', data.attachment);
  }

  if (data.fileDisplayName) {
    formData.append('fileDisplayName', data.fileDisplayName.trim());
  }

  if (data.attachmentId) {
    formData.append('attachmentId', data.attachmentId);
  }
  return formData;
};
