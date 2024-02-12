<template>
  <v-container class="d-flex justify-center fill-height" fluid>
    <v-row class="mt-3 w-100">
      <v-col>
        <h2>Welcome, {{ userInfo?.legalName }}.</h2>
        <v-divider class="mt-2"></v-divider>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card min-height="70%" class="no-box-shadow">
          <v-card-text class="justify-center generate-report">
            <p class="mt-4 mb-2">
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
              workplace. For more information on Pay Transparency reporting,
              please visit
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://www2.gov.bc.ca/gov/content/gender-equity/preparing-pay-transparency-reports"
                >Guidance for preparing pay transparency reports - Province of
                British Columbia (gov.bc.ca)</a
              >.
            </p>
            <p class="mb-6">
              Once your CSV file is ready, click on the button below to upload
              the file and generate a report.
            </p>
            <p class="text-caption">
              This application does not collect, record or publish personal
              information.
            </p>
            <v-btn class="mb-4" color="primary" to="InputForm"
              >Generate Pay Transparency Report</v-btn
            >
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="mt-12">
      <v-col>
        <v-card min-height="100%">
          <v-toolbar color="primary">
            <v-toolbar-title>View Generated Reports</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <div v-if="!reports.length">No generated reports yet.</div>
            <div v-if="reports.length">
              <v-row>
                <v-col class="font-weight-bold">Start Date</v-col>
                <v-col class="font-weight-bold">End Date</v-col>
                <v-col class="font-weight-bold" cols="3">Action</v-col>
              </v-row>
              <hr class="mt-4 mb-4" />
              <template v-for="report in reports">
                <v-row>
                  <v-col>{{ formatDate(report.report_start_date) }}</v-col>
                  <v-col>{{ formatDate(report.report_end_date) }}</v-col>
                  <v-col cols="3">
                    <a class="pr-5" href="#">
                      <v-icon color="#1976d2" icon="mdi-eye-outline"></v-icon>
                      View
                    </a>
                    <a href="#">
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
      <v-col cols="3">
        <v-row>
          <v-col>
            <v-card>
              <v-toolbar color="primary">
                <v-toolbar-title>Sample CSV</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <p class="mb-4">
                  View a sample comma-separated value (CSV) file showing the
                  required format for pay transparency data uploads.
                </p>
                <v-btn color="tertiary">Download sample CSV</v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card>
              <v-toolbar color="primary">
                <v-toolbar-title>Updates</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <p class="mb-4">There are no updates at this time</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapState } from 'pinia';
import { authStore } from '../store/modules/auth';
import { useCodeStore } from '../store/modules/codeStore';
import { REPORT_STATUS } from '../utils/constant';
import ApiService from '../common/apiService';
import moment from 'moment';

export default {
  data: () => ({
    reports: [],
  }),
  watch: {},
  computed: {
    ...mapState(authStore, ['userInfo']),
    ...mapState(useCodeStore, ['naicsCodes']),
  },
  methods: {
    formatDate(value) {
      return moment(value).format('MMMM D, YYYY');
    },
    async getReports() {
      this.reports = await ApiService.getReports({
        report_status: REPORT_STATUS.PUBLISHED,
      });
    },
  },
  beforeMount() {
    this.reports = this.getReports();
  },
};
</script>

<style>
.v-card-text.generate-report {
  text-align: center;
  background: aliceblue;
}

.v-card--variant-elevated.no-box-shadow {
  box-shadow: none;
}
</style>