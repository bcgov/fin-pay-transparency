<template>
  <div>
    <v-row class="mt-3">
      <v-col>
        <h2 data-testid="legal-name">Welcome, {{ userInfo?.legalName }}.</h2>
        <v-divider class="mt-2"></v-divider>
      </v-col>
    </v-row>
    <v-row class="mb-4">
      <v-col class="d-flex flex-column">
        <div class="mb-12">
          <p class="mt-4 mb-4">
            This tool will help you generate a Pay Transparency report in
            compliance with the
            <a
              target="_blank"
              rel="noopener noreferrer"
              :href="sanitizeUrl(frontendConfig.PAY_TRANSPARENCY_ACT_URL)"
              >Pay Transparency Act (gov.bc.ca)</a
            >
            and the
            <a
              target="_blank"
              rel="noopener noreferrer"
              :href="
                sanitizeUrl(frontendConfig.PAY_TRANSPARENCY_REGULATION_URL)
              "
              >Pay Transparency Regulation (gov.bc.ca)</a
            >. The report can be saved for posting on your webpage or in your
            workplace.
          </p>
          <p class="mb-6">
            Once your CSV file is ready, click on the button below to upload the
            file and generate a report.
          </p>
          <p class="mb-6">
            Need an example? Click <a href="SampleCsv.csv" download>here</a> to
            view a sample CSV file.
          </p>
          <v-btn class="mb-4 btn-primary" to="generate-report-form">
            Upload your CSV here
          </v-btn>
          <p class="text-caption">
            This application does not collect, record or publish personal
            information.
          </p>
        </div>

        <v-card class="rounded-lg flex-grow-1" min-height="230px">
          <v-toolbar color="tab">
            <v-toolbar-title>Submitted Reports</v-toolbar-title>
          </v-toolbar>
          <ReportsTable />
        </v-card>
      </v-col>
      <v-col md="4" cols="12" class="d-flex flex-column right-column">
        <AnnouncementPager
          :announcements="announcements"
          :pageSize="2"
          :isLoading="areAnnouncementLoading"
          class="h-100"
        ></AnnouncementPager>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import ReportsTable from './util/ReportsTable.vue';
import AnnouncementPager from './announcements/AnnouncementPager.vue';
import { mapActions, mapState } from 'pinia';
import { authStore } from '../store/modules/auth';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { useCodeStore } from '../store/modules/codeStore';
import { REPORT_STATUS } from '../utils/constant';
import ApiService from '../common/apiService';
import {
  useReportStepperStore,
  ReportMode,
} from '../store/modules/reportStepper';
import { IReport } from '../common/types';
import { Announcement } from '../types/announcements';
import { useConfigStore } from '../store/modules/config';

type DashboardData = {
  reports: IReport[];
  announcements: Announcement[];
  userInfo?: any;
  frontendConfig: any;
  areAnnouncementLoading: boolean;
};

export default {
  components: { ReportsTable, AnnouncementPager },
  data: (): DashboardData => ({
    reports: [],
    frontendConfig: (globalThis as any).config,
    announcements: [],
    areAnnouncementLoading: false,
  }),
  computed: {
    ...mapState(useReportStepperStore, ['reportId']),
    ...mapState(authStore, ['userInfo']),
    ...mapState(useCodeStore, ['naicsCodes']),
    ...mapState(useConfigStore, ['config']),
  },
  async beforeMount() {
    this.reset();
    this.loadConfig();
    this.getReports();
    this.getAnnouncements();
  },
  methods: {
    sanitizeUrl: sanitizeUrl,
    ...mapActions(useReportStepperStore, ['setReportInfo', 'reset', 'setMode']),
    ...mapActions(useConfigStore, ['loadConfig']),
    async getReports() {
      this.reports = await ApiService.getReports({
        report_status: REPORT_STATUS.PUBLISHED,
      });
    },
    async getAnnouncements() {
      this.areAnnouncementLoading = true;
      try {
        this.announcements = await ApiService.getPublishedAnnouncements();
      } catch {
        //unable to load announcements. fail silently.
      } finally {
        this.areAnnouncementLoading = false;
      }
    },
    async viewReport(report: IReport) {
      this.setMode(ReportMode.View);
      await this.setReportInfo(report);
    },
    async editReport(report: IReport) {
      this.setMode(ReportMode.Edit);
      await this.setReportInfo(report);
      await this.$router.push({ path: 'generate-report-form' });
    },
  },
};
</script>

<style>
.v-card-text.generate-report {
  display: flex;
  justify-content: center;
  align-items: center;
  background: aliceblue;
}

.v-card--variant-elevated.no-box-shadow {
  box-shadow: none;
}
.right-column {
  height: 535px;
}
</style>
