import { config } from '../../config';
import { logger } from '../../logger';
import { PowerBiService } from '../../external/services/powerbi-service';

// Embed info for Reports, Dashboards, and other resources
type PowerBiEmbedInfo = {
  id: string;
  accessToken: string;
  embedUrl: string;
  expiry: string;
};

export enum PowerBiResource {
  SubmissionAnalytics = 'SubmissionAnalytics',
  UserBehaviour = 'UserBehaviour',
  DataAnalytics = 'DataAnalytics',
}

/**
 * Generate embed token and embed urls for PowerBi resources
 * @return Details like Embed URL, Access token and Expiry
 */
export async function getEmbedInfo(
  resourceName: string,
): Promise<PowerBiEmbedInfo> {
  // Get report details and embed token
  const powerBi = new PowerBiService(
    config.get('entra:clientId'),
    config.get('entra:clientSecret'),
    config.get('entra:tenantId'),
  );

  let embedParams;
  if (resourceName == PowerBiResource.SubmissionAnalytics) {
    embedParams = await powerBi.getEmbedParamsForReports(
      config.get('powerbi:analytics:workspaceId'),
      config.get('powerbi:analytics:submissionAnalyticsId'),
    );
  } else if (resourceName == PowerBiResource.UserBehaviour) {
    embedParams = await powerBi.getEmbedParamsForReports(
      config.get('powerbi:analytics:workspaceId'),
      config.get('powerbi:analytics:userBehaviourId'),
    );
  } else if (resourceName == PowerBiResource.DataAnalytics) {
    embedParams = await powerBi.getEmbedParamsForReports(
      config.get('powerbi:analytics:workspaceId'),
      config.get('powerbi:analytics:dataAnalyticsId'),
    );
  }

  return {
    id: embedParams.resources[0].id,
    accessToken: embedParams.embedToken.token,
    embedUrl: embedParams.resources[0].embedUrl,
    expiry: embedParams.embedToken.expiration,
  };
}
