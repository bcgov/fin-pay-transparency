import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * This file contains all the PowerBi Types and a wrapper to access the REST API endpoints
 */

// A wrapper for all the REST API endpoints
export class Api {
  private api: AxiosInstance;
  constructor(url: string) {
    this.api = axios.create({ baseURL: url });
  }

  /** https://learn.microsoft.com/en-us/rest/api/power-bi/dashboards/get-dashboard-in-group#dashboard */
  public getDashboardInGroup = (
    url: DashboardInGroup_Url,
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<Dashboard>> =>
    this.api.get<Dashboard>(
      `/v1.0/myorg/groups/${url.workspaceId}/dashboards/${url.dashboardId}`,
      config,
    );

  /** https://learn.microsoft.com/en-us/rest/api/power-bi/reports/get-report-in-group#report */
  public getReportInGroup = (
    url: ReportInGroup_Url,
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<Report>> =>
    this.api.get<Report>(
      `/v1.0/myorg/groups/${url.workspaceId}/reports/${url.reportId}`,
      config,
    );

  /** https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/generate-token */
  public postGenerateToken = (
    body: GenerateToken_Body,
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<EmbedToken>> =>
    this.api.post<EmbedToken, AxiosResponse<EmbedToken>, GenerateToken_Body>(
      `/v1.0/myorg/GenerateToken`,
      body,
      config,
    );

  /** https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/dashboards-generate-token-in-group */
  public postGenerateTokenForDashboardInGroup = (
    url: DashboardInGroup_Url,
    body: GenerateTokenForDashboardInGroup_Body,
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<EmbedToken>> =>
    this.api.post<EmbedToken>(
      `/v1.0/myorg/groups/${url.workspaceId}/dashboards/${url.dashboardId}/GenerateToken`,
      body,
      config,
    );
}

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
  reports: { id: string; allowEdit?: boolean }[];
  datasets: {
    id: string;
    xmlaPermissions?: 'Off' | 'ReadOnly';
  }[];
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
