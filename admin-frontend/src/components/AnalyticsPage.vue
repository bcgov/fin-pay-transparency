<template>
  <PowerBIReportEmbed
    v-if="isDashboardLoaded"
    :embed-config="configSubmissionAnalytics"
    :css-class-name="powerBiCssClass"
  ></PowerBIReportEmbed>
  <!-- <PowerBIReportEmbed
    v-if="isDashboardLoaded"
    :embed-config="configUserBehaviour"
    :css-class-name="powerBiCssClass"
  ></PowerBIReportEmbed>
  <PowerBIReportEmbed
    v-if="isDashboardLoaded"
    :embed-config="configDataAnalytics"
    :css-class-name="powerBiCssClass"
  ></PowerBIReportEmbed> -->
</template>

<script setup lang="ts">
import { PowerBIReportEmbed } from 'powerbi-client-vue-js';
import { models, IReportEmbedConfiguration } from 'powerbi-client';
import { ref } from 'vue';
import ApiService from '../services/apiService';
import { ZonedDateTime, Duration } from '@js-joda/core';
import { POWERBI_RESOURCE } from '../utils/constant';

const isDashboardLoaded = ref<boolean>(false);
const powerBiCssClass = 'powerbi-container';

// Bootstrap Dashboard by leaving some details undefined
const configSubmissionAnalytics = ref<IReportEmbedConfiguration>({
  type: 'report',
  id: undefined,
  embedUrl: undefined,
  accessToken: undefined,
  tokenType: models.TokenType.Embed,
  hostname: 'https://app.powerbi.com',
});
const configUserBehaviour = ref<IReportEmbedConfiguration>({
  type: 'report',
  id: undefined,
  embedUrl: undefined,
  accessToken: undefined,
  tokenType: models.TokenType.Embed,
  hostname: 'https://app.powerbi.com',
});
const configDataAnalytics = ref<IReportEmbedConfiguration>({
  type: 'report',
  id: undefined,
  embedUrl: undefined,
  accessToken: undefined,
  tokenType: models.TokenType.Embed,
  hostname: 'https://app.powerbi.com',
});

type PowerBiEmbedInfo = {
  id: string;
  accessToken: string;
  embedUrl: string;
  expiry: string;
};

// Get the embed config from the service and set the reportConfigResponse
async function getAccessToken(resourceName, config) {
  const embedInfo: PowerBiEmbedInfo =
    await ApiService.getPowerBiEmbedAnalytics(resourceName);
  config.value.id = embedInfo.id;
  config.value.embedUrl = embedInfo.embedUrl;
  config.value.accessToken = embedInfo.accessToken;
  isDashboardLoaded.value = true;

  const expiry = ZonedDateTime.parse(embedInfo.expiry);
  const now = ZonedDateTime.now();
  const msToExpiry = Duration.between(now, expiry).minusMinutes(1).toMillis();
  setTimeout(() => getAccessToken(resourceName, config), msToExpiry);
}

getAccessToken(POWERBI_RESOURCE.SUBMISSIONANALYTICS, configSubmissionAnalytics);
// getAccessToken(POWERBI_RESOURCE.USERBEHAVIOUR, configUserBehaviour);
// getAccessToken(POWERBI_RESOURCE.DATAANALYTICS, configDataAnalytics);
</script>

<style lang="scss">
iframe {
  border: none;
}
.powerbi-container {
  height: 720px;
  width: 1280px;
}
</style>
