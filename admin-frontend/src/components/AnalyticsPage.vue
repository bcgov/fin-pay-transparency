<template>
  <v-btn
    v-tooltip:bottom-end="'Only authorized users can access this data'"
    append-icon="mdi-open-in-new"
    class="ml-auto btn-primary"
    style="margin-top: -40px"
    rel="noopener"
    target="_blank"
    :href="sanitizeUrl(snowplowUrl)"
    >Web Traffic Analytics</v-btn
  >

  <div class="w-100 overflow-x-auto">
    <div
      v-for="[name, details] in powerBiDetailsPerResource"
      :key="name"
      class="powerbi-container"
    >
      <PowerBIReportEmbed
        v-if="details.config.embedUrl"
        :style="details.css"
        :embed-config="details.config"
        :event-handlers="details.eventHandlersMap"
        @report-obj="(report) => (details.report = report)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { PowerBIReportEmbed } from 'powerbi-client-vue-js';
import type { EventHandler } from 'powerbi-client-vue-js/dist/types/src/utils/utils';
import { models, IReportEmbedConfiguration, Report } from 'powerbi-client';
import { reactive, CSSProperties, Reactive } from 'vue';
import ApiService from '../services/apiService';
import { ZonedDateTime, Duration } from '@js-joda/core';
import { POWERBI_RESOURCE } from '../utils/constant';
import { NotificationService } from '../services/notificationService';
import { sanitizeUrl } from '@braintree/sanitize-url';

type PowerBiDetails = {
  config: IReportEmbedConfiguration;
  report?: Report;
  css: CSSProperties;
  eventHandlersMap: Map<string, EventHandler>;
};

const snowplowUrl = globalThis.config?.SNOWPLOW_URL;

const powerBiDetailsPerResource = createDefaultPowerBiDetailsMap([
  POWERBI_RESOURCE.ANALYTICS,
]);

await getPowerBiAccessToken(powerBiDetailsPerResource);

/** Create a Map containing the details of the resources. */
function createDefaultPowerBiDetailsMap(
  resourcesToLoad: POWERBI_RESOURCE[],
): Reactive<Map<POWERBI_RESOURCE, PowerBiDetails>> {
  const resourceDetails = reactive(new Map<POWERBI_RESOURCE, PowerBiDetails>());

  for (const name of resourcesToLoad) {
    resourceDetails.set(name, {
      // Bootstrap Dashboard by leaving some details undefined
      config: {
        type: 'report',
        id: undefined,
        embedUrl: undefined,
        accessToken: undefined,
        tokenType: models.TokenType.Embed,
      },
      css: { width: '1280px', height: '720px' },
      // eventHandlersMap - https://learn.microsoft.com/en-us/javascript/api/overview/powerbi/handle-events#report-events
      eventHandlersMap: new Map([
        [
          'loaded', // The loaded event is raised when the report initializes.
          () => {
            setCssSize(name);
          },
        ],
      ]),
    });
  }

  return resourceDetails;
}

/**
 * Get the embed config from the service.
 * Auto refresh the token before it expires.
 */
async function getPowerBiAccessToken(
  resourceDetails: Reactive<Map<POWERBI_RESOURCE, PowerBiDetails>>,
) {
  let embedInfo;
  try {
    embedInfo = await ApiService.getPowerBiEmbedAnalytics(
      Array.from(resourceDetails.keys()),
    );
  } catch {
    NotificationService.pushNotificationError(
      'Analytics failed to load. Please try again later or contact the helpdesk.',
      undefined,
      1000 * 60 * 3,
    );
  }
  for (let resource of embedInfo.resources) {
    const ref = resourceDetails.get(resource.name);
    if (!ref) continue;
    ref.config.id = resource.id;
    ref.config.accessToken = embedInfo.accessToken;
    ref.config.embedUrl = resource.embedUrl;
  }

  const expiry = ZonedDateTime.parse(embedInfo.expiry);
  const now = ZonedDateTime.now();
  const msToExpiry = Duration.between(now, expiry).minusMinutes(1).toMillis();
  setTimeout(getPowerBiAccessToken, msToExpiry);
}

/**
 * Set the css size of the report to be the size of the maximum page of all pages.
 * Warning: The navigation pane is not redrawn when increasing the display size which
 * leaves a gray area where there should be the navigation pane. You can manually refresh
 * the iframe by right clicking on the gray area and selecting 'refresh frame'.
 * @param name
 * @param refresh Reloads the iframe. Loading takes longer, but the navigation pane will be drawn correctly
 */
async function setCssSize(name: POWERBI_RESOURCE, refresh: boolean = false) {
  const details = powerBiDetailsPerResource.get(name)!;
  if (!details.report) return;
  const pages = await details.report.getPages();
  if (pages) {
    const sizes = pages.reduce(
      (prev, current) => ({
        width: Math.max(prev.width, current.defaultSize.width ?? 0),
        height: Math.max(prev.height, current.defaultSize.height ?? 0),
      }),
      { width: 0, height: 0 },
    );

    if (
      details.css.width != sizes.width + 'px' ||
      details.css.height != sizes.height + 'px'
    ) {
      details.css.width = sizes.width + 'px';
      details.css.height = sizes.height + 'px';
      if (refresh) details.report.iframe.src += ''; // Allegedly, this is how to refresh an iframe
    }
  }
}
</script>

<style lang="scss">
iframe {
  border: none;
}
.powerbi-container {
  margin: 10px 0px;
}
</style>
