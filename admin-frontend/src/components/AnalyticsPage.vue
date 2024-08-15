<template>
  <PowerBIReportEmbed
    v-if="configSubmissionAnalytics.embedUrl"
    :embed-config="configSubmissionAnalytics"
    :css-class-name="powerBiCssClass"
  />
  <PowerBIReportEmbed
    v-if="configUserBehaviour.embedUrl"
    :embed-config="configUserBehaviour"
    :css-class-name="powerBiCssClass"
  />
  <PowerBIReportEmbed
    v-if="configDataAnalytics.embedUrl"
    :embed-config="configDataAnalytics"
    :css-class-name="powerBiCssClass"
  />
</template>

<script setup lang="ts">
import { PowerBIReportEmbed } from 'powerbi-client-vue-js';
import { models, IReportEmbedConfiguration } from 'powerbi-client';
import { Ref, ref } from 'vue';
import ApiService from '../services/apiService';
import { ZonedDateTime, Duration } from '@js-joda/core';
import { POWERBI_RESOURCE } from '../utils/constant';

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

const config = new Map<POWERBI_RESOURCE, Ref<IReportEmbedConfiguration>>([
  [POWERBI_RESOURCE.SUBMISSIONANALYTICS, configSubmissionAnalytics],
  [POWERBI_RESOURCE.USERBEHAVIOUR, configUserBehaviour],
  [POWERBI_RESOURCE.DATAANALYTICS, configDataAnalytics],
]);

type PowerBiEmbedInfo = {
  resources: { name: string; id: string; embedUrl: string }[];
  accessToken: string;
  expiry: string;
};

// Get the embed config from the service
async function getAccessToken() {
  const embedInfo: PowerBiEmbedInfo = await ApiService.getPowerBiEmbedAnalytics(
    Array.from(config.keys()),
  );
  for (let resource of embedInfo.resources) {
    const ref = config.get(resource.name);
    if (!ref) continue;
    ref.value.id = resource.id;
    ref.value.accessToken = embedInfo.accessToken;
    ref.value.embedUrl = resource.embedUrl;
  }

  const expiry = ZonedDateTime.parse(embedInfo.expiry);
  const now = ZonedDateTime.now();
  const msToExpiry = Duration.between(now, expiry).minusMinutes(1).toMillis();
  setTimeout(getAccessToken, msToExpiry);
}

getAccessToken();
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
