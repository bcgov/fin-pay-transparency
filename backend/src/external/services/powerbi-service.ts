// ----------------------------------------------------------------------------
// This file incorporates work covered by the following copyright and
// permission notice:
//
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

import msal from '@azure/msal-node';
import * as PowerBi from './powerbi-api';
import { AxiosError } from 'axios';
import { uniq } from 'lodash';

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
   * Get embed params for a single report for a single workspace
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
