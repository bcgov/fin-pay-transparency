<template>
  <v-container class="d-flex justify-center fill-height" fluid>

    <v-row class="h-100">
      <v-col>

        <v-card min-height="70%">
          <v-card-text>
            <p class="mb-2">
              The tool will help you generate a pay transparency report for you company.
            </p>
            <p class="mb-2">
              To begin, organize your pay transparency data into a comma-separated value (CSV) file as described
              <u>here</u>.
            </p>
            <p class="mb-4">
              Then click the button below to access a submission
              form, where you'll be asked to enter information about your company and upload your CSV file.
            </p>
            <v-btn color="primary" to="InputForm">Generate Pay Transparency Report</v-btn>
          </v-card-text>
        </v-card>

      </v-col>
      <v-col>
        <v-card min-height="70%">
          <v-toolbar color='primary'>
            <v-toolbar-title>View Generated Reports</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            No generated reports yet.
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
                <v-btn color="primary">Download sample CSV</v-btn>
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