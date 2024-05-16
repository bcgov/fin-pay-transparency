<template>
  <ReportSelectionManager />
  <v-row class="mt-3">
    <v-col>
      <h2 data-testid="legal-name">Welcome, {{ userInfo?.legalName }}.</h2>
      <v-divider class="mt-2"></v-divider>
    </v-col>
  </v-row>
  <v-row>
    <v-col>
      <p class="mt-4 mb-4">
        This tool will help you generate a Pay Transparency report in compliance
        with the
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
          :href="sanitizeUrl(frontendConfig.PAY_TRANSPARENCY_REGULATION_URL)"
          >Pay Transparency Regulation (gov.bc.ca)</a
        >. The report can be saved for posting on your webpage or in your
        workplace.
      </p>
      <p class="mb-6">
        Once your CSV file is ready, click on the button below to upload the
        file and generate a report.
      </p>
      <v-btn class="mb-4 btn-primary" to="generate-report-form">
        Upload your CSV here
      </v-btn>
      <p class="text-caption mb-2">
        This application does not collect, record or publish personal
        information.
      </p>
    </v-col>
    <v-col md="4" cols="12">
      <v-card class="rounded-lg">
        <v-toolbar color="tab">
          <v-toolbar-title>Updates</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="mt-4 mb-4">
          <div class="text-left bluebox-width">
            <strong>
              For more information on Pay Transparency reporting, please visit
              <a
                target="_blank"
                rel="noopener noreferrer"
                :href="
                  sanitizeUrl(frontendConfig.GUIDANCE_FOR_REPORTING_WEB_URL)
                "
              >
                Guidance for preparing pay transparency reports - Province of
                British Columbia (gov.bc.ca)</a
              >.
            </strong>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
  <v-row class="mt-8 mb-8">
    <v-col>
      <v-card class="rounded-lg" min-height="100%">
        <v-toolbar color="tab">
          <v-toolbar-title>Submitted Reports</v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <div v-if="!reports.length">No generated reports yet.</div>
          <div v-if="reports.length">
            <v-table>
              <thead>
                <tr>
                  <th scope="col" class="font-weight-bold">Reporting Year</th>
                  <th scope="col" class="font-weight-bold">Submission Date</th>
                  <th scope="col" class="font-weight-bold text-right pr-8">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in reports" :key="report.report_id">
                  <td :data-testid="'reporting_year-' + report.report_id">
                    {{ report.reporting_year }}
                  </td>
                  <td
                    :data-testid="'report_published_date-' + report.report_id"
                  >
                    {{ formatDateTime(report.create_date) }}
                  </td>
                  <td class="text-right">
                    <v-btn
                      :data-testid="'view-report-' + report.report_id"
                      prepend-icon="mdi-eye-outline"
                      variant="text"
                      color="link"
                      @click="viewReport(report)"
                    >
                      View
                    </v-btn>
                    <v-btn
                      v-if="report.is_unlocked"
                      :data-testid="'edit-report-' + report.report_id"
                      prepend-icon="mdi-eye-outline"
                      variant="text"
                      color="link"
                      @click="editReport(report)"
                    >
                      Edit
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col md="4" cols="12">
      <v-card class="rounded-lg">
        <v-toolbar color="tab">
          <v-toolbar-title>Sample CSV</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="mt-4 mb-4">
          <p class="mb-4">
            View a sample comma-separated value (CSV) file showing the required
            format for pay transparency data uploads.
          </p>
          <v-btn class="btn-secondary" href="SampleCsv.csv" download>
            Download sample CSV
          </v-btn>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import ReportSelectionManager from './util/DasboardReportManager.vue';
import { mapActions, mapState } from 'pinia';
import { authStore } from '../store/modules/auth';
import { sanitizeUrl } from '@braintree/sanitize-url';
import { useCodeStore } from '../store/modules/codeStore';
import { REPORT_STATUS } from '../utils/constant';
import ApiService from '../common/apiService';
import { DateTimeFormatter, LocalDate, ZonedDateTime } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import {
  useReportStepperStore,
  ReportMode,
} from '../store/modules/reportStepper';
import { IReport } from '../common/types';
import { useConfigStore } from '../store/modules/config';

type DashboardData = {
  reports: IReport[];
  userInfo?: any;
  frontendConfig: any;
};

export default {
  components: { ReportSelectionManager },
  data: (): DashboardData => ({
    reports: [],
    frontendConfig: (window as any).config,
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
  },
  methods: {
    sanitizeUrl: sanitizeUrl,
    ...mapActions(useReportStepperStore, ['setReportInfo', 'reset', 'setMode']),
    ...mapActions(useConfigStore, ['loadConfig']),
    formatDate(value, format = 'MMMM d, YYYY') {
      const formatter = DateTimeFormatter.ofPattern(format).withLocale(
        Locale.ENGLISH,
      );
      return LocalDate.parse(value).format(formatter);
    },
    formatDateTime(value, format = 'MMMM d, YYYY') {
      const formatter = DateTimeFormatter.ofPattern(format).withLocale(
        Locale.ENGLISH,
      );
      return ZonedDateTime.parse(value).format(formatter);
    },
    async getReports() {
      this.reports = await ApiService.getReports({
        report_status: REPORT_STATUS.PUBLISHED,
      });
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
</style>
