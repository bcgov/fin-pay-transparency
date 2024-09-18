<template>
  <div v-if="isAnalyticsAvailable">
    <div
      v-for="[name, details] in resourceDetails"
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
import { EventHandler } from 'powerbi-client-vue-js/dist/types/src/utils/utils';
import { models, IReportEmbedConfiguration, Report } from 'powerbi-client';
import { reactive, CSSProperties } from 'vue';
import ApiService from '../services/apiService';
import { ZonedDateTime, Duration } from '@js-joda/core';
import { POWERBI_RESOURCE } from '../utils/constant';

type PowerBiDetails = {
  config: IReportEmbedConfiguration;
  report?: Report;
  css: CSSProperties;
  eventHandlersMap: Map<string, EventHandler>;
};

const isAnalyticsAvailable =
  (window as any).config?.IS_ADMIN_ANALYTICS_AVAILABLE?.toUpperCase() == 'TRUE';

const resourceDetails = createDefaultPowerBiDetailsMap([
  POWERBI_RESOURCE.SUBMISSIONANALYTICS,
  POWERBI_RESOURCE.USERBEHAVIOUR,
  POWERBI_RESOURCE.DATAANALYTICS,
]);

if (isAnalyticsAvailable) {
  getPowerBiAccessToken(resourceDetails);
}

/** Create a Map containing the details of the resources. */
function createDefaultPowerBiDetailsMap(resourcesToLoad: POWERBI_RESOURCE[]) {
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
      css: { width: '200px', height: '400px' },
      // eventHandlersMap - https://learn.microsoft.com/en-us/javascript/api/overview/powerbi/handle-events#report-events
      eventHandlersMap: new Map([
        [
          'loaded', // The loaded event is raised when the report initializes.
          () => {
            /** Set the css size of the report to be the size of the maximum page of all pages. */
            const setCssSize = async () => {
              const pages = await resourceDetails.get(name)!.report?.getPages();
              if (pages) {
                const sizes = pages.reduce(
                  (prev, current) => ({
                    width: Math.max(prev.width, current.defaultSize.width ?? 0),
                    height: Math.max(
                      prev.height,
                      current.defaultSize.height ?? 0,
                    ),
                  }),
                  { width: 0, height: 0 },
                );
                resourceDetails.get(name)!.css.width = sizes.width + 'px';
                resourceDetails.get(name)!.css.height = sizes.height + 'px';
              }
            };
            setCssSize();
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
async function getPowerBiAccessToken(resourceDetails) {
  const embedInfo = await ApiService.getPowerBiEmbedAnalytics(
    Array.from(resourceDetails.keys()),
  );
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
</script>

<style lang="scss">
iframe {
  border: none;
}
.powerbi-container {
  margin: 10px 0px;
}
</style>
