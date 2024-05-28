export const baseURL = process.env.E2E_ADMIN_BASE_URL;

export const PagePaths = {
  LOGIN: `${baseURL}/login`,
  LOGOUT: `${baseURL}/logout`,
  DASHBOARD: `${baseURL}/dashboard`,
  GENERATE_REPORT: `${baseURL}/generate-report-form`,
  VIEW_REPORT: `${baseURL}/published-report`,
  DRAFT_REPORT: `${baseURL}/draft-report`,
};
