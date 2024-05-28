export const baseURL = process.env.E2E_BASE_URL;

export const PagePaths = {
  LOGIN: `${baseURL}/login`,
  LOGOUT: `${baseURL}/logout`,
  DASHBOARD: `${baseURL}/dashboard`,
  GENERATE_REPORT: `${baseURL}/generate-report-form`,
  VIEW_REPORT: `${baseURL}/published-report`,
  DRAFT_REPORT: `${baseURL}/draft-report`,
};

export const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL;
export const EXTERNAL_CONSUMER_DELETE_REPORTS_API_KEY =process.env.EXTERNAL_CONSUMER_API_KEY;
