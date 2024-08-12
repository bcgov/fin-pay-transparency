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

/**
 * Generate embed token and embed urls for PowerBi resources
 * @return Details like Embed URL, Access token and Expiry
 */
export async function getEmbedInfo(): Promise<PowerBiEmbedInfo> {
  // Get the Report Embed details
  try {
    // Get report details and embed token
    const powerBi = new PowerBiService(
      config.get('entra:clientId'),
      config.get('entra:clientSecret'),
      config.get('entra:tenantId'),
    );
    const embedParams = await powerBi.getEmbedParamsForDashboard(
      config.get('powerbi:analytics:workspaceId'),
      config.get('powerbi:analytics:dashboardId'),
    );

    return {
      id: embedParams.resources[0].id,
      accessToken: embedParams.embedToken.token,
      embedUrl: embedParams.resources[0].embedUrl,
      expiry: embedParams.embedToken.expiration,
    };
  } catch (e) {
    logger.error('getEmbedInfo for PowerBI failed', e);
    throw e;
  }
}
