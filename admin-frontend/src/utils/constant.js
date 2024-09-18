const baseRoot = '/admin-api';
const clamavBaseRoot = '/clamav-api';
const authRoot = baseRoot + '/auth';
const fileUploadRoot = baseRoot + '/file-upload';
let object;

object = {
  LOGIN: authRoot + '/login',
  DASHBOARD: '/',
  LOGIN_AZUREIDIR: authRoot + '/logout?loginAzureIdir=true',
  LOGOUT: authRoot + '/logout',
  SESSION_EXPIRED: authRoot + '/logout?sessionExpired=true',
  LOGIN_FAILED: authRoot + '/logout?loginError=true',
  REFRESH: authRoot + '/refresh',
  TOKEN: authRoot + '/token',
  FILE_UPLOAD: baseRoot + '/file-upload',
};

export const AuthRoutes = Object.freeze(object);

export const ApiRoutes = Object.freeze({
  USER: baseRoot + '/user',
  CONFIG: `${baseRoot}/v1/config`,
  EMPLOYEE_COUNT_RANGES: baseRoot + '/v1/codes/employee-count-ranges',
  NAICS_CODES: baseRoot + '/v1/codes/naics-codes',
  REPORTS: baseRoot + '/v1/reports',
  POWERBI_EMBED_ANALYTICS: baseRoot + '/v1/analytics/embed',
  USERS: `${baseRoot}/v1/users`,
  USER_INVITES: `${baseRoot}/v1/user-invites`,
  ANNOUNCEMENTS: `${baseRoot}/v1/announcements`,
  CLAMAV_SCAN: `${clamavBaseRoot}/`,
  RESOURCES: `${baseRoot}/v1/resources`,
});

export const PAGE_TITLES = Object.freeze({
  DASHBOARD: 'Dashboard',
  REPORTS: 'Search Reports',
  ANNOUNCEMENTS: 'Announcements',
  ADD_ANNOUNCEMENT: 'Add Announcement',
  EDIT_ANNOUNCEMENT: 'Edit Announcement',
  USER_MANAGEMENT: 'User Management',
  ANALYTICS: 'Analytics',
  LOGIN: 'Login',
  TOKEN_EXPIRED: 'Token Expired',
  INVITATION_EXPIRED: 'Invitation Expired',
  UNAUTHORIZED: 'Unauthorized',
});

export const MINISTRY_NAME = 'Ministry of Finance';

export const REPORT_STATUS = Object.freeze({
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
});

export const POWERBI_RESOURCE = Object.freeze({
  SUBMISSIONANALYTICS: 'SubmissionAnalytics',
  USERBEHAVIOUR: 'UserBehaviour',
  DATAANALYTICS: 'DataAnalytics',
});
