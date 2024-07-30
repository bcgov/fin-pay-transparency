const baseRoot = '/admin-api';
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
  CONFIG: baseRoot + '/config',
  EMPLOYEE_COUNT_RANGES: baseRoot + '/v1/codes/employee-count-ranges',
  NAICS_CODES: baseRoot + '/v1/codes/naics-codes',
  REPORTS: baseRoot + '/v1/reports',
  ANNOUNCEMENTS: baseRoot + '/v1/announcements',
  USERS: `${baseRoot}/v1/users`,
  USER_INVITES: `${baseRoot}/v1/user-invites`,
});

export const PAGE_TITLES = Object.freeze({
  DASHBOARD: 'Dashboard',
  REPORTS: 'Search Reports',
  ANNOUNCEMENTS: 'Announcements',
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
