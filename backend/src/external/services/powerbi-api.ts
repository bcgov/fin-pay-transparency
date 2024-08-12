import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * This file contains all the PowerBi Types and a wrapper to access the REST API endpoints
 */

// A wrapper for all the REST API endpoints
export const Api = {
  /** https://learn.microsoft.com/en-us/rest/api/power-bi/dashboards/get-dashboard-in-group#dashboard */
  getDashboardInGroup: (
    url: DashboardInGroup_Url,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Dashboard>> =>
    axios.get<Dashboard>(
      `https://api.powerbi.com/v1.0/myorg/groups/${url.workspaceId}/dashboards/${url.dashboardId}`,
      config,
    ),

  /** https://learn.microsoft.com/en-us/rest/api/power-bi/reports/get-report-in-group#report */
  getReportInGroup: (
    url: ReportInGroup_Url,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<Report>> =>
    axios.get<Report>(
      `https://api.powerbi.com/v1.0/myorg/groups/${url.workspaceId}/reports/${url.reportId}`,
      config,
    ),

  /** https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/generate-token */
  postGenerateToken: (
    body: GenerateToken_Body,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<EmbedToken>> =>
    axios.post<EmbedToken, AxiosResponse<EmbedToken>, GenerateToken_Body>(
      'https://api.powerbi.com/v1.0/myorg/GenerateToken',
      body,
      config,
    ),

  /** https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/dashboards-generate-token-in-group */
  postGenerateTokenForDashboardInGroup: (
    url: DashboardInGroup_Url,
    body: GenerateTokenForDashboardInGroup_Body,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<EmbedToken>> =>
    axios.post<EmbedToken>(
      `https://api.powerbi.com/v1.0/myorg/groups/${url.workspaceId}/dashboards/${url.dashboardId}/GenerateToken`,
      body,
      config,
    ),
};

type DashboardInGroup_Url = { workspaceId: string; dashboardId: string };
type ReportInGroup_Url = { workspaceId: string; reportId: string };

/** https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/dashboards-generate-token-in-group#request-body */
export type GenerateTokenForDashboardInGroup_Body = {
  accessLevel?: 'View' | 'Edit' | 'Create';
  allowSaveAs?: boolean;
  datasetId?: string;
  identities?: [];
  lifetimeInMinutes?: number;
};

/** https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/generate-token#request-body */
export type GenerateToken_Body = {
  reports: { id: string }[];
  datasets: { id: string }[];
  targetWorkspaces?: { id: string }[];
  datasourceIdentities?: [];
  identities?: [];
  lifetimeInMinutes?: number;
};

/** https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/generate-token#embedtoken */
export type EmbedToken = {
  '@odata.context': string;
  token: string;
  tokenId: string;
  expiration: string;
};

/** https://learn.microsoft.com/en-us/rest/api/power-bi/reports/get-report-in-group#report */
export type Report = {
  '@odata.context': string;
  id: string;
  reportType: string;
  name: string;
  webUrl: string;
  embedUrl: string;
  isFromPbix: boolean;
  isOwnedByMe: boolean;
  datasetId: string;
  datasetWorkspaceId: string;
  users: [];
  subscriptions: [];
};

/** https://learn.microsoft.com/en-us/rest/api/power-bi/dashboards/get-dashboard-in-group#dashboard */
export type Dashboard = {
  '@odata.context': string;
  id: string;
  displayName: string;
  isReadOnly: boolean;
  webUrl: string;
  embedUrl: string;
  users: [];
  subscriptions: [];
};
