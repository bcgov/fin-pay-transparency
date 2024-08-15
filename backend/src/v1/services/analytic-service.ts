import { config } from '../../config';
import {
  PowerBiService,
  ReportInWorkspace,
} from '../../external/services/powerbi-service';

// Embed info for Reports, Dashboards, and other resources
export type PowerBiEmbedInfo = {
  resources: { name: PowerBiResourceName; id: string; embedUrl: string }[];
  accessToken: string;
  expiry: string;
};

export enum PowerBiResourceName {
  SubmissionAnalytics = 'SubmissionAnalytics',
  UserBehaviour = 'UserBehaviour',
  DataAnalytics = 'DataAnalytics',
}

const resourceIds: Record<PowerBiResourceName, ReportInWorkspace> = {
  SubmissionAnalytics: {
    workspaceId: config.get('powerbi:analytics:workspaceId'),
    reportId: config.get('powerbi:analytics:submissionAnalyticsId'),
  },
  UserBehaviour: {
    workspaceId: config.get('powerbi:analytics:workspaceId'),
    reportId: config.get('powerbi:analytics:userBehaviourId'),
  },
  DataAnalytics: {
    workspaceId: config.get('powerbi:analytics:workspaceId'),
    reportId: config.get('powerbi:analytics:dataAnalyticsId'),
  },
};

/**
 * Generate embed token and embed urls for PowerBi resources
 * @return Details like Embed URL, Access token and Expiry
 */
export async function getEmbedInfo(
  resourceNames: PowerBiResourceName[],
): Promise<PowerBiEmbedInfo> {
  const powerBi = new PowerBiService(
    config.get('entra:clientId'),
    config.get('entra:clientSecret'),
    config.get('entra:tenantId'),
  );

  const embedParams = await powerBi.getEmbedParamsForReports(
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
}
