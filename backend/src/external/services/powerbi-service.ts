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

type PowerBiResource = {
  id: string;
  name: string;
  embedUrl: string;
};

type EmbedConfig = {
  resources: PowerBiResource[];
  embedToken: PowerBi.EmbedToken;
};

/**
 * Class to authenticate and make use of the PowerBi REST API.
 */
export class PowerBiService {
  constructor(
    private clientId: string,
    private clientSecret: string,
    private tenantId: string,
  ) {}

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
      const result = await PowerBi.Api.getDashboardInGroup(
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
      if (err instanceof AxiosError)
        err.message = JSON.stringify(err.response.data);
    }
  }

  /**
   * Get embed params for a single report for a single workspace
   * https://learn.microsoft.com/en-us/rest/api/power-bi/reports/get-report-in-group
   * @param {string} workspaceId
   * @param {string} reportId
   * @param {string} additionalDatasetId - Optional Parameter
   * @return EmbedConfig object
   */
  public async getEmbedParamsForReports(
    workspaceId: string,
    reportId: string,
  ): Promise<EmbedConfig> {
    try {
      // Get report info by calling the PowerBI REST API
      const result = await PowerBi.Api.getReportInGroup(
        { workspaceId, reportId },
        {
          headers: await this.getEntraAuthorizationHeader(),
        },
      );

      const data = result.data;

      // Add report data for embedding
      const reportDetails: PowerBiResource = {
        id: data.id,
        name: data.name,
        embedUrl: data.embedUrl,
      };

      // Get Embed token multiple resources
      const embedToken = await this.getEmbedTokenForV2Workspace(
        [reportId],
        [data.datasetId],
        [workspaceId],
      );
      return { embedToken: embedToken, resources: [reportDetails] };
    } catch (err) {
      if (err instanceof AxiosError)
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
  ) {
    // Add report id in the request
    const body: PowerBi.GenerateToken_Body = {
      reports: reportIds.map((id) => ({ id, allowEdit: false })),
      datasets: datasetIds.map((id) => ({
        id,
        xmlaPermissions: 'ReadOnly',
      })),
      targetWorkspaces: targetWorkspaceIds.map((id) => ({ id })),
    };

    const result = await PowerBi.Api.postGenerateToken(body, {
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
  ) {
    const result = await PowerBi.Api.postGenerateTokenForDashboardInGroup(
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
