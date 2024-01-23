<template>
  <v-container class="d-flex justify-center fill-height" fluid>
    <v-row class="mt-3 w-100">
      <v-col>

        <h2>
          Welcome, {{ userInfo?.legalName }}.
        </h2>
        <v-divider class="mt-2"></v-divider>

      </v-col>
    </v-row>
    <v-row>
      <v-col>

        <v-card min-height="70%" class="no-box-shadow">
          <v-card-text class="justify-center generate-report">
            <p class="mt-4 mb-2">
              The tool will help you generate a pay transparency report for you company.
            </p>
            <p class="mb-2">
              To begin, organize your pay transparency data into a comma-separated value (CSV) file as described
              <u>here</u>.
            </p>
            <p class="mb-6">
              Then click the button below to access a submission
              form, where you'll be asked to enter information about your organization and upload your CSV file.
            </p>
            <v-btn class="mb-4" color="primary" to="InputForm">Generate Pay Transparency Report</v-btn>
          </v-card-text>
        </v-card>

      </v-col>    
    </v-row>
    <v-row class="mt-12">
      <v-col>

        <v-card min-height="100%">
          <v-toolbar color='primary'>
            <v-toolbar-title>View Generated Reports</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <div v-if="!localreports.length">
              No generated reports yet.
            </div>     
            <div v-if="localreports.length">  
              <v-row>
                <v-col cols="6">Filename</v-col>
                <v-col>Generated On</v-col>
                <v-col>Action</v-col>
              </v-row>
              <hr class="mt-6 mb-6">
              <template v-for="report in localreports">
                <v-row>
                  <v-col cols="6">Revision {{ report.revision }}</v-col>
                  <v-col>{{ report.report_start_date }}</v-col>
                  <v-col>
                    <a class="pr-6" href="">
                      <v-icon
                        color="#1976d2"
                        icon="mdi-eye-outline"
                      ></v-icon> View 
                    </a>
                    <a href="">
                      <v-icon
                        color="#1976d2"
                        icon="mdi-delete-forever"
                      ></v-icon> Delete
                    </a>
                  </v-col>
                </v-row>
                <hr class="mt-6 mb-6">
              </template>              
            </div>
          </v-card-text>
        </v-card>

      </v-col>
      <v-col cols="3">
        <v-row>
          <v-col>

            <v-card>
              <v-toolbar color='primary'>
                <v-toolbar-title>Sample CSV</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <p class="mb-4">
                  View a sample comma-separated value (CSV) file showing the required format for pay transparency data
                  uploads.
                </p>
                <v-btn color="tertiary">Download sample CSV</v-btn>
              </v-card-text>
            </v-card>

          </v-col>
        </v-row>
        <v-row>
          <v-col>

            <v-card>
              <v-toolbar color='primary'>
                <v-toolbar-title>Updates</v-toolbar-title>
              </v-toolbar>
              <v-card-text>
                <p class="mb-4">
                  There are no updates at this time
                </p>
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
import ApiService from '../common/apiService';

export default {
  data: () => ({
    localreports: []
  }),  
  watch: {
    reports(val) {
      //this.localreports = val;
      //date(report.report_start_date).format('dddd MMMM D, YYYY')
    }, 
  },      
  computed: {
    ...mapState(authStore, ['userInfo']),
    ...mapState(useCodeStore, ['naicsCodes', 'reports']),
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