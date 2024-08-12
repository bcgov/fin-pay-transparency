<template>
  <PowerBIDashboardEmbed
    v-if="isDashboardLoaded"
    :embed-config="dashConfig"
    :css-class-name="powerBiCssClass"
  ></PowerBIDashboardEmbed>
</template>

<script setup lang="ts">
import { PowerBIDashboardEmbed } from 'powerbi-client-vue-js';
import { models, IDashboardEmbedConfiguration } from 'powerbi-client';
import { ref } from 'vue';
import ApiService from '../services/apiService';
import { ZonedDateTime, Duration } from '@js-joda/core';

const isDashboardLoaded = ref<boolean>(false);
const powerBiCssClass = 'powerbi-container';

// Bootstrap Dashboard by leaving some details undefined
const dashConfig = ref<IDashboardEmbedConfiguration>({
  type: 'dashboard',
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
async function getAccessToken() {
  const embedInfo: PowerBiEmbedInfo =
    await ApiService.getPowerBiEmbedAnalytics();
  dashConfig.value.id = embedInfo.id;
  dashConfig.value.embedUrl = embedInfo.embedUrl;
  dashConfig.value.accessToken = embedInfo.accessToken;
  isDashboardLoaded.value = true;

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
  height: 420px;
  width: 910px;
}
</style>
