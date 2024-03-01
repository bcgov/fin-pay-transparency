<template>
  <ReportSelectionManager />
  <v-container class="d-flex justify-center fill-height" fluid>
    <v-row class="mt-3">
      <v-col>
        <h2 data-testid="legal-name">Welcome, {{ userInfo?.legalName }}.</h2>
        <v-divider class="mt-2"></v-divider>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <p class="mt-4 mb-4">
          This tool will help you generate a Pay Transparency report in
          compliance with the
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/23018"
            >Pay Transparency Act (gov.bc.ca)</a
          >
          and the
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/225_2023"
            >Pay Transparency Regulation (gov.bc.ca)</a
          >. The report can be saved for posting on your webpage or in your
          workplace.
        </p>
        <p class="mb-6">
          Once your CSV file is ready, click on the button below to upload the
          file and generate a report.
        </p>
        <p class="text-caption mb-2">
          This application does not collect, record or publish personal
          information.
        </p>
        <v-btn class="mb-4" color="primary" to="generate-report-form"
          >Generate Pay Transparency Report</v-btn
        >
      </v-col>
      <v-col cols="4">
        <v-card min-height="70%" class="no-box-shadow">
          <v-card-text class="generate-report pl-8 pr-8 pt-12 pb-12">
            <div class="text-left bluebox-width">
              <strong
                >For more information on Pay Transparency reporting, please
                visit
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://www2.gov.bc.ca/gov/content/gender-equity/preparing-pay-transparency-reports"
                  >Guidance for preparing pay transparency reports - Province of
                  British Columbia (gov.bc.ca)</a
                >.</strong
              >
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="mt-8 mb-8">
      <v-col>
        <v-card class="rounded-lg" min-height="100%">
          <v-toolbar color="primary">
            <v-toolbar-title>View Generated Reports</v-toolbar-title>
          </v-toolbar>
          <v-card-text class="mt-4 mb-4">
            <div v-if="!reports.length">No generated reports yet.</div>
            <div v-if="reports.length">
              <v-row>
                <v-col class="font-weight-bold">Start Date</v-col>
                <v-col class="font-weight-bold">End Date</v-col>
                <v-col class="font-weight-bold" cols="4">Action</v-col>
              </v-row>
              <hr class="mt-4 mb-4" />
              <template v-for="report in reports">
                <v-row>
                  <v-col
                    :data-testid="'report_start_date-' + report.report_id"
                    >{{ formatDate(report.report_start_date) }}</v-col
                  >
                  <v-col :data-testid="'report_end_date-' + report.report_id">{{
                    formatDate(report.report_end_date)
                  }}</v-col>
                  <v-col cols="4">
                    <a
                      :data-testid="'view-report-' + report.report_id"
                      class="pr-5"
                      href="#"
                      @click="viewReport(report)"
                    >
                      <v-icon color="#1976d2" icon="mdi-eye-outline"></v-icon>
                      View
                    </a>
                    <a href="#" v-if="isEditable(report)">
                      <v-icon color="#1976d2" icon="mdi-table-edit"></v-icon>
                      Edit
                    </a>
                  </v-col>
                </v-row>
                <hr class="mt-4 mb-4" />
              </template>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="4">
        <v-row>
          <v-col>
            <v-card class="rounded-lg">
              <v-toolbar color="primary">
                <v-toolbar-title>Sample CSV</v-toolbar-title>
              </v-toolbar>
              <v-card-text class="mt-4 mb-4">
                <p class="mb-4">
                  View a sample comma-separated value (CSV) file showing the
                  required format for pay transparency data uploads.
                </p>
                <v-btn color="tertiary" href="SampleCsv.csv" download>
                  Download sample CSV
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card class="rounded-lg">
              <v-toolbar color="primary">
                <v-toolbar-title>Updates</v-toolbar-title>
              </v-toolbar>
              <v-card-text class="mt-4 mb-4">
                <p>There are no updates at this time</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import ReportSelectionManager from './util/DasboardReportManager.vue';
import { mapActions, mapState } from 'pinia';
import { authStore } from '../store/modules/auth';
import { useCodeStore } from '../store/modules/codeStore';
import { REPORT_STATUS } from '../utils/constant';
import ApiService from '../common/apiService';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import {
  useReportStepperStore,
  ReportMode,
} from '../store/modules/reportStepper';
import { IReport } from '../common/types';
import { isReportEditable } from '../common/helpers';

type DashboardData = {
  reports: IReport[];
  userInfo?: any;
};

export default {
  components: { ReportSelectionManager },
  data: (): DashboardData => ({
    reports: [],
  }),
  watch: {},
  computed: {
    ...mapState(useReportStepperStore, ['reportId']),
    ...mapState(authStore, ['userInfo']),
    ...mapState(useCodeStore, ['naicsCodes']),
  },
  methods: {
    ...mapActions(useReportStepperStore, ['setReportInfo', 'reset', 'setMode']),
    formatDate(value) {
      const formatter = DateTimeFormatter.ofPattern('MMMM d, YYYY').withLocale(
        Locale.CANADA,
      );
      return LocalDate.parse(value).format(formatter);
    },
    isEditable: isReportEditable,
    async getReports() {
      this.reports = await ApiService.getReports({
        report_status: REPORT_STATUS.PUBLISHED,
      });
    },
    async viewReport(report: IReport) {
      this.setMode(ReportMode.View);
      await this.setReportInfo(report);
    },
  },
  async beforeMount() {
    this.reset();
    this.getReports();
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

.bluebox-width {
  max-width: 260px;
}

.text-left {
  text-align: left;
}
</style>
