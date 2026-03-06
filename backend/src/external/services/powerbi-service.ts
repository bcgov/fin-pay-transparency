// ----------------------------------------------------------------------------
// This file incorporates work covered by the following copyright and
// permission notice:
//
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

import * as msal from '@azure/msal-node';
import * as PowerBi from './powerbi-api.js';
import { AxiosError } from 'axios';
import uniq from 'lodash/uniq.js';

type PowerBiResource = {
  id: string;
  name: string;
  embedUrl: string;
};

type EmbedConfig = {
  resources: PowerBiResource[];
  embedToken: PowerBi.EmbedToken;
};

export type ReportInWorkspace = { workspaceId: string; reportId: string };
export type ReportNameInWorkspace = { workspaceId: string; reportName: string };

/**
 * Class to authenticate and make use of the PowerBi REST API.
 */
export class PowerBiService {
  private powerBiApi: PowerBi.Api;

  constructor(
    powerBiUrl: string,
    private clientId: string,
    private clientSecret: string,
    private tenantId: string,
  ) {
    this.powerBiApi = new PowerBi.Api(powerBiUrl);
  }

  /**
   * Get embed params for multiple report in multiple workspace. Search reports by name
   * https://learn.microsoft.com/en-us/rest/api/power-bi/reports/get-report-in-group
   * @return EmbedConfig object
   */
  public async getEmbedParamsForReportsByName(
    reportNameInWorkspace: ReportNameInWorkspace[],
  ): Promise<EmbedConfig> {
    try {
      const header = await this.getEntraAuthorizationHeader();

      const workspaces = uniq(reportNameInWorkspace.map((x) => x.workspaceId));

      const reportsPerWorkspace: Record<string, PowerBi.Report[]> = {};

      // Get all the reports in each workspace by calling the PowerBI REST API
      await Promise.all(
        workspaces.map(async (id) => {
          const reports = await this.powerBiApi.getReports(
            { workspaceId: id },
            {
              headers: header,
            },
          );
          reportsPerWorkspace[id] = reports.data.value;
        }),
      );

      // Limit the found reports to only the ones requested and filter out null/undefined
      const reports = reportNameInWorkspace
        .map((res) =>
          reportsPerWorkspace[res.workspaceId].find(
            (x) => x.name == res.reportName,
          ),
        )
        .filter((report) => report != null);

      // Throw if no valid reports found
      if (reports.length === 0) {
        throw new Error(
          'No matching Power BI reports found for the given names.',
        );
      }

      // Get Embed token multiple resources
      const embedToken = await this.getEmbedTokenForV2Workspace(
        uniq(reports.map((report) => report.id)),
        uniq(reports.map((report) => report.datasetId)),
        uniq(reportNameInWorkspace.map((res) => res.workspaceId)),
      );

      // Add report data for embedding
      const reportDetails: PowerBiResource[] = reports.map((report) => ({
        id: report.id,
        name: report.name,
        embedUrl: report.embedUrl,
      }));

      return { embedToken: embedToken, resources: reportDetails };
    } catch (err) {
      if (err instanceof AxiosError && err?.response?.data)
        err.message = JSON.stringify(err.response.data);
      throw err;
    }
  }

  /**
   * https://learn.microsoft.com/en-us/rest/api/power-bi/dashboards/get-dashboard-in-group
   */
  public async getEmbedParamsForDashboard(
    workspaceId: string,
    dashboardId: string,
  ): Promise<EmbedConfig> {
    let data;
    try {
      // Get dashboard info by calling the PowerBI REST API
      const result = await this.powerBiApi.getDashboardInGroup(
        { workspaceId, dashboardId },
        {
          headers: await this.getEntraAuthorizationHeader(),
        },
      );

      data = result.data;

      const reportDetails: PowerBiResource = {
        id: data.id,
        name: data.name,
        embedUrl: data.embedUrl,
      };

      // Get Embed token multiple resources
      const embedToken = await this.getEmbedTokenForDashboard(
        dashboardId,
        workspaceId,
      );
      return { embedToken: embedToken, resources: [reportDetails] };
    } catch (err) {
      if (err instanceof AxiosError && err?.response?.data)
        err.message = JSON.stringify(err.response.data);
    }
  }

  /**
   * Get embed params for multiple reports in multiple workspace
   * https://learn.microsoft.com/en-us/rest/api/power-bi/reports/get-report-in-group
   * @return EmbedConfig object
   */
  public async getEmbedParamsForReports(
    reportInWorkspace: ReportInWorkspace[],
  ): Promise<EmbedConfig> {
    try {
      const header = await this.getEntraAuthorizationHeader();

      // Get report info by calling the PowerBI REST API
      const result = await Promise.all(
        reportInWorkspace.map((res) =>
          this.powerBiApi.getReportInGroup(
            { workspaceId: res.workspaceId, reportId: res.reportId },
            {
              headers: header,
            },
          ),
        ),
      );

      // Add report data for embedding
      const reportDetails: PowerBiResource[] = result.map((res) => ({
        id: res.data.id,
        name: res.data.name,
        embedUrl: res.data.embedUrl,
      }));

      // Get Embed token multiple resources
      const embedToken = await this.getEmbedTokenForV2Workspace(
        uniq(reportInWorkspace.map((res) => res.reportId)),
        uniq(result.map((res) => res.data.datasetId)),
        uniq(reportInWorkspace.map((res) => res.workspaceId)),
      );
      return { embedToken: embedToken, resources: reportDetails };
    } catch (err) {
      if (err instanceof AxiosError && err?.response?.data)
        err.message = JSON.stringify(err.response.data);
      throw err;
    }
  }

  /**
   * Get Embed token for multiple reports, multiple datasets, and optional target workspaces.
   *
   * Works for both reports and semantic models, and single or multiple items. It's preferred over the legacy version 1 APIs.
   * Doesn't work for Dashboards or Tiles
   * https://learn.microsoft.com/en-us/power-bi/developer/embedded/generate-embed-token
   * https://learn.microsoft.com/en-us/rest/api/power-bi/embed-token/generate-token
   * @param reportIds
   * @param datasetIds
   * @param targetWorkspaceIds - Optional Parameter
   * @return EmbedToken
   */
  private async getEmbedTokenForV2Workspace(
    reportIds: string[],
    datasetIds: string[],
    targetWorkspaceIds: string[],
  ): Promise<PowerBi.EmbedToken> {
    // Add report id in the request
    const body: PowerBi.GenerateToken_Body = {
      reports: reportIds.map((id) => ({ id, allowEdit: false })),
      datasets: datasetIds.map((id) => ({
        id,
        xmlaPermissions: 'ReadOnly',
      })),
      targetWorkspaces: targetWorkspaceIds.map((id) => ({ id })),
    };

    const result = await this.powerBiApi.postGenerateToken(body, {
      headers: await this.getEntraAuthorizationHeader(),
    });

    return result.data;
  }

  /**
   * https://learn.microsoft.com/en-us/power-bi/developer/embedded/generate-embed-token#dashboards-and-tiles
   */
  private async getEmbedTokenForDashboard(
    dashboardId: string,
    workspaceId: string,
  ): Promise<PowerBi.EmbedToken> {
    const result = await this.powerBiApi.postGenerateTokenForDashboardInGroup(
      {
        workspaceId,
        dashboardId,
      },
      {
        accessLevel: 'View',
      },
      {
        headers: await this.getEntraAuthorizationHeader(),
      },
    );

    return result.data;
  }

  /**
   * @returns An access token for usage in the PowerBi REST API
   */
  private async getEntraAccessToken(): Promise<msal.AuthenticationResult> {
    const msalConfig = {
      auth: {
        clientId: this.clientId,
        authority: 'https://login.microsoftonline.com/' + this.tenantId,
        clientSecret: this.clientSecret,
      },
    };

    const clientApplication = new msal.ConfidentialClientApplication(
      msalConfig,
    );

    const clientCredentialRequest = {
      scopes: ['https://analysis.windows.net/powerbi/api/.default'],
    };

    return clientApplication.acquireTokenByClientCredential(
      clientCredentialRequest,
    );
  }

  /**
   * @returns A formatted header object for usage in the PowerBi REST API
   */
  private async getEntraAuthorizationHeader() {
    // Get the response from the authentication request
    const authenticationResult = await this.getEntraAccessToken();

    return {
      'Content-Type': 'application/json',
      Authorization: 'Bearer '.concat(authenticationResult.accessToken),
    };
  }
}
