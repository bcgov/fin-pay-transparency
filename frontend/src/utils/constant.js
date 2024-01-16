const baseRoot = '/api';
const authRoot = baseRoot + '/auth';
const fileUploadRoot = baseRoot + '/file-upload';
let object;

object = {
  LOGIN: authRoot + '/login',
  DASHBOARD: '/',
  LOGIN_BCEID: authRoot + '/logout?loginBceid=true',
  LOGOUT: authRoot + '/logout',
  SESSION_EXPIRED: authRoot + '/logout?sessionExpired=true',
  LOGIN_FAILED: authRoot + '/logout?loginError=true',
  REFRESH: authRoot + '/refresh',
  TOKEN: authRoot + '/token',
  SESSION_REMAINING_TIME: authRoot + '/user-session-remaining-time',
  FILE_UPLOAD: baseRoot + '/file-upload',
};

export const AuthRoutes = Object.freeze(object);

export const ApiRoutes = Object.freeze({
  USER: baseRoot + '/user',
  CONFIG: baseRoot + '/config',
  fileUpload: {
    BASE_URL: fileUploadRoot,
  },
  EMPLOYEE_COUNT_RANGES: baseRoot + '/v1/codes/employee-count-ranges',
  NAICS_CODES: baseRoot + '/v1/codes/naics-codes',
  POST_SUBMISSION: baseRoot + '/v1/file-upload',
  REPORTS: baseRoot + '/v1/report/',
});

export const PAGE_TITLES = Object.freeze({
  ADMINISTRATION: 'Administration',
  DASHBOARD: 'Dashboard',
  LOGIN: 'Login',
  REPORT: 'Generated Report',
  TOKEN_EXPIRED: 'Token Expired',
});

export const MINISTRY_NAME = 'Ministry of Finance';

export const REPORT_STATUS = Object.freeze({
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
});
