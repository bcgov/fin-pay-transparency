import { config } from '../../config/config.js';
import {
  PowerBiService,
  ReportNameInWorkspace,
} from '../../external/services/powerbi-service.js';

// Embed info for Reports, Dashboards, and other resources
export type PowerBiEmbedInfo = {
  resources: { name: PowerBiResourceName; id: string; embedUrl: string }[];
  accessToken: string;
  expiry: string;
};

export enum PowerBiResourceName {
  Analytics = 'Analytics',
}

const resourceIds: Record<PowerBiResourceName, ReportNameInWorkspace> = {
  Analytics: {
    workspaceId: config.get('powerbi:analytics:workspaceId'),
    reportName: config.get('powerbi:analytics:analyticsId'),
  },
};

export const analyticsService = {
  /**
   * Generate embed token and embed urls for PowerBi resources
   * @return Details like Embed URL, Access token and Expiry
   */
  async getEmbedInfo(
    resourceNames: PowerBiResourceName[],
  ): Promise<PowerBiEmbedInfo> {
    if (
      !Array.isArray(resourceNames) ||
      !resourceNames.every((name) =>
        Object.values(PowerBiResourceName).includes(name),
      )
    ) {
      throw new Error('Invalid resource names');
    }

    const powerBi = new PowerBiService(
      config.get('powerbi:powerBiUrl'),
      config.get('entra:clientId'),
      config.get('entra:clientSecret'),
      config.get('entra:tenantId'),
    );

    const embedParams = await powerBi.getEmbedParamsForReportsByName(
      resourceNames.map((name) => resourceIds[name]),
    );

    const resources = [];
    for (let i = 0; i < resourceNames.length; ++i) {
      resources.push({
        name: resourceNames[i],
        id: embedParams.resources[i].id,
        embedUrl: embedParams.resources[i].embedUrl,
      });
    }

    return {
      resources: resources,
      accessToken: embedParams.embedToken.token,
      expiry: embedParams.embedToken.expiration,
    };
  },
};
