<template>
  <v-container class="d-flex justify-center h-100">
    <v-form ref="inputForm" class="w-100 h-100">
      <v-row class="d-flex justify-center w-100">
        <v-col xs="12" sm="10" md="8" class="w-100">
          <v-row class="pt-7">
            <v-col cols="12">
              <v-btn to="/">Back</v-btn>
            </v-col>
          </v-row>

          <v-row class="pt-7 mb-4 d-flex justify-center w-100">
            <v-col cols="10" class="w-100">
              <ReportStepper />
            </v-col>
          </v-row>

          <div v-if="stage == 'UPLOAD'">
            <v-row class="d-flex justify-start mt-12" dense>
              <v-col cols="12">
                <h2 class="text-center">Employer Details</h2>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  id="companyName"
                  ref="companyName"
                  v-model="companyName"
                  label="Employer Name"
                  :rules="requiredRules"
                  required
                  disabled
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  id="companyAddress"
                  ref="companyAddress"
                  v-model="companyAddress"
                  :rules="requiredRules"
                  label="Employer Address"
                  required
                  disabled
                ></v-text-field>
              </v-col>

              <v-col cols="12" class="d-flex">
                <v-autocomplete
                  id="naicsCode"
                  ref="naicsCode"
                  v-model="naicsCode"
                  :rules="requiredRules"
                  :items="naicsCodes"
                  :item-title="(n) => `${n.naics_code} - ${n.naics_label}`"
                  item-value="naics_code"
                  label="NAICS Code"
                  required
                ></v-autocomplete>
                <v-icon
                  color="error"
                  icon="mdi-asterisk"
                  size="x-small"
                  v-if="!naicsCode"
                ></v-icon>
              </v-col>

              <v-col cols="12" class="d-flex">
                <v-select
                  id="employeeCountRange"
                  ref="employeeCountRange"
                  v-model="employeeCountRange"
                  :rules="requiredRules"
                  label="Employee Count Range"
                  :items="employeeCountRanges"
                  item-title="employee_count_range"
                  item-value="employee_count_range_id"
                  required
                ></v-select>
                <v-icon
                  color="error"
                  icon="mdi-asterisk"
                  size="x-small"
                  v-if="!employeeCountRange"
                ></v-icon>
              </v-col>

              <v-col cols="6" class="d-flex">
                <VueDatePicker
                  id="startDate"
                  ref="startDate"
                  v-model="startDate"
                  model-type="yyyy-MM-dd"
                  month-picker
                  auto-apply
                  format="MMMM yyyy"
                  placeholder="Start Date"
                  input-class-name="datepicker-input"
                  :min-date="minStartDate"
                  :max-date="maxStartDate"
                  prevent-min-max-navigation
                  :action-row="{
                    showSelect: false,
                    showCancel: false,
                    showNow: false,
                    showPreview: false,
                  }"
                />
                <v-icon
                  color="error"
                  icon="mdi-asterisk"
                  size="x-small"
                  v-if="!startDate"
                ></v-icon>
              </v-col>

              <v-col cols="6" class="d-flex">
                <VueDatePicker
                  id="endDate"
                  ref="endDate"
                  v-model="endDate"
                  model-type="yyyy-MM-dd"
                  month-picker
                  auto-apply
                  format="MMMM yyyy"
                  placeholder="End Date"
                  input-class-name="datepicker-input"
                  :min-date="minEndDate"
                  :max-date="maxEndDate"
                  prevent-min-max-navigation
                  :action-row="{
                    showSelect: false,
                    showCancel: false,
                    showNow: false,
                    showPreview: false,
                  }"
                />
                <v-icon
                  color="error"
                  icon="mdi-asterisk"
                  size="x-small"
                  v-if="!endDate"
                ></v-icon>
              </v-col>

              <v-col cols="12" class="mt-6">
                <p class="text-subtitle-2">
                  Please note any limitations, dependencies, or constraints with
                  the payroll data which will appear at the bottom of the report
                </p>
                <v-textarea
                  id="dataConstraints"
                  v-model="dataConstraints"
                  label="Data Constraints"
                  maxlength="3000"
                  clearable
                >
                  <template v-slot:details> </template>
                </v-textarea>
              </v-col>

              <v-col cols="12" class="">
                <p class="text-subtitle-2">Other comments</p>
                <v-textarea
                  id="comments"
                  v-model="comments"
                  label="Contextual Info/Comments"
                  clearable
                >
                </v-textarea>
              </v-col>

              <v-col cols="12">
                <h3 class="mb-2">File Upload</h3>
                <p class="mb-4">
                  To proceed, upload your employee data in comma-separated value
                  (CSV) format. Ensure the CSV file follows the provided CSV
                  template (<u>bc-pay-transparency-tool-data-template.csv</u>)
                  for accurate processing.
                </p>

                <v-row class="mt-3" v-if="submissionErrors">
                  <v-col>
                    <v-alert
                      dense
                      outlined
                      dismissible
                      class="bootstrap-error mb-3"
                    >
                      <h4 class="mb-3">
                        The submission contains errors which must be corrected.
                      </h4>

                      <!-- general errors related to the submission (either with the 
                          form fields or with the file itself) -->
                      <v-table
                        v-if="submissionErrors?.generalErrors"
                        density="compact"
                      >
                        <tbody>
                          <tr
                            v-for="generalError in submissionErrors.generalErrors"
                          >
                            <td class="text-left">
                              {{ generalError }}
                            </td>
                          </tr>
                        </tbody>
                      </v-table>

                      <!-- general errors related to contents of the file -->
                      <v-table
                        v-if="submissionErrors?.fileErrors?.generalErrors"
                        density="compact"
                      >
                        <tbody>
                          <tr
                            v-for="generalError in submissionErrors.fileErrors
                              .generalErrors"
                          >
                            <td class="text-left">
                              {{ generalError }}
                            </td>
                          </tr>
                        </tbody>
                      </v-table>

                      <!-- errors related to the content of specific lines in the file -->
                      <div v-if="submissionErrors?.fileErrors?.lineErrors">
                        <h4 class="mb-3">
                          Please review the following lines from the uploaded
                          file:
                        </h4>
                        <v-table density="compact">
                          <thead>
                            <tr>
                              <th id="line-num-header" class="text-left">
                                Line
                              </th>
                              <th id="problem-desc-header" class="text-left">
                                Problem(s)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="lineError in submissionErrors.fileErrors
                                .lineErrors"
                              :key="lineError.lineNum"
                            >
                              <td class="text-left">{{ lineError.lineNum }}</td>
                              <td class="text-left">
                                <span
                                  v-for="errMsg in lineError.errors"
                                  class="mr-2"
                                >
                                  {{ errMsg }}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </v-table>
                      </div>
                    </v-alert>
                  </v-col>
                </v-row>

                <v-sheet
                  class="pa-5"
                  style="
                    border-style: dashed;
                    border: 3px dashed #666666;
                    border-radius: 10px;
                  "
                >
                  <div class="d-flex">
                    <v-file-input
                      id="csvFile"
                      v-model="uploadFileValue"
                      color="#003366"
                      :accept="fileAccept"
                      hint="Select a CSV file"
                      :error-messages="fileInputError"
                      placeholder="Select a CSV file"
                      :rules="requiredRules"
                    />
                    <v-icon
                      color="error"
                      icon="mdi-asterisk"
                      size="x-small"
                      v-if="!uploadFileValue"
                    ></v-icon>
                  </div>

                  <p class="d-flex justify-center">
                    Supported format: CSV. Maximum file size: 8MB.
                  </p>
                </v-sheet>
              </v-col>
            </v-row>

            <v-row class="mt-6">
              <v-col
                cols="12"
                class="d-flex justify-center"
                v-if="!areRequiredFieldsComplete"
              >
                <v-icon
                  color="error"
                  icon="mdi-asterisk"
                  size="x-small"
                ></v-icon>
                Please complete all required fields
              </v-col>
              <v-col cols="12" class="d-flex justify-center">
                <primary-button
                  id="submitButton"
                  :disabled="!areRequiredFieldsComplete"
                  text="Submit"
                  :click-action="submit"
                />
              </v-col>
            </v-row>

            <v-row class="mt-3">
              <v-col>
                <v-alert
                  v-if="alertMessage"
                  dense
                  outlined
                  dismissible
                  :class="alertType"
                  class="mb-3"
                >
                  {{ alertMessage }}
                </v-alert>
              </v-col>
            </v-row>
          </div>
          <div v-if="stage == 'REVIEW'" class="mb-8">
            <div v-html="draftReportHtml"></div>

            <hr class="mt-8 mb-8" />

            <div>
              <v-checkbox
                v-model="isReadyToGenerate"
                label="I am ready to create a final report that will be shared with the B.C. Government and can be shared publicly by my employer. Please note, this draft report will not be saved after closing this window or logging out of the system"
              ></v-checkbox>

              <div class="d-flex justify-center w-100 mt-4">
                <v-btn id="backButton" text="Back" color="primary" class="mr-2">
                  Back
                  <v-dialog
                    v-model="confirmBackDialogVisible"
                    activator="parent"
                    width="auto"
                    max-width="400"
                  >
                    <v-card>
                      <v-card-text>
                        Do you want to go back to the form screen? Note that
                        this draft report will not be saved after navigating
                        back or logging out of the system.
                      </v-card-text>
                      <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn
                          color="red-darken-1"
                          @click="confirmBackDialogVisible = false"
                        >
                          No
                        </v-btn>
                        <v-btn
                          color="primary"
                          @click="
                            confirmBackDialogVisible = false;
                            showStage('UPLOAD');
                          "
                        >
                          Yes
                        </v-btn>
                        <v-spacer></v-spacer>
                      </v-card-actions>
                    </v-card>
                  </v-dialog>
                </v-btn>

                <v-btn
                  id="gdownloadPdfButton"
                  text="Download PDF"
                  color="primary"
                  class="mr-2"
                  @click="downloadPdf(draftReport.report_id)"
                >
                  Download PDF
                </v-btn>

                <v-btn
                  id="generateReportButton"
                  text="Generate Report"
                  color="primary"
                  class="mr-2"
                  :disabled="!isReadyToGenerate"
                  @click="tryGenerateReport()"
                >
                  Generate Report
                </v-btn>
              </div>
            </div>
          </div>
          <div v-if="stage == 'FINAL'" class="mb-8">
            <div v-html="finalReportHtml"></div>
          </div>
        </v-col>
      </v-row>
      <v-overlay
        :persistent="true"
        :model-value="isProcessing"
        class="align-center justify-center"
      >
        <spinner />
      </v-overlay>
    </v-form>

    <!-- dialogs -->

    <v-dialog
      v-model="confirmOverrideReportDialogVisible"
      width="auto"
      max-width="400"
    >
      <v-card>
        <v-card-text>
          There is an existing report for the same time period. Do you want to
          replace it?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="red-darken-1"
            @click="confirmOverrideReportDialogVisible = false"
          >
            No
          </v-btn>
          <v-btn
            color="primary"
            @click="
              confirmOverrideReportDialogVisible = false;
              generateReport();
            "
          >
            Yes
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import PrimaryButton from './util/PrimaryButton.vue';
import Spinner from './Spinner.vue';
import ReportStepper from './util/ReportStepper.vue';
import ApiService from '../common/apiService';
import { useCodeStore } from '../store/modules/codeStore';
import { authStore } from '../store/modules/auth';
import { mapActions, mapWritableState, mapState } from 'pinia';
import {
  useReportStepperStore,
  ReportStage,
} from '../store/modules/reportStepper';
import moment from 'moment';
import { sanitizeUrl } from '@braintree/sanitize-url';

interface LineErrors {
  lineNum: number;
  errors: string[];
}

interface FileErrors {
  generalErrors: string[] | null;
  lineErrors: LineErrors[] | null;
}

interface SubmissionErrors {
  bodyErrors: string[] | null;
  fileErrors: FileErrors | null;
  generalErrors: string[];
}

const REPORT_DATE_FORMAT = 'yyyy-MM-DD';

export default {
  components: {
    PrimaryButton,
    VueDatePicker,
    Spinner,
    ReportStepper,
  },
  data: () => ({
    validForm: null,
    requiredRules: [(v) => !!v || 'Required'],
    companyName: '',
    companyAddress: '',
    naicsCode: null,
    naicsCodesTruncated: [],
    employeeCountRange: null,
    isProcessing: false,
    uploadFileValue: null,
    minStartDate: moment().subtract(2, 'years').startOf('month').toDate(),
    maxStartDate: moment().subtract(1, 'years').endOf('month').toDate(),
    minEndDate: moment()
      .subtract(1, 'years')
      .subtract(1, 'months')
      .startOf('month')
      .toDate(),
    maxEndDate: moment().subtract(1, 'month').endOf('month').toDate(),
    startDate: moment()
      .subtract(1, 'years')
      .endOf('month')
      .format(REPORT_DATE_FORMAT),
    endDate: moment()
      .subtract(1, 'month')
      .endOf('month')
      .format(REPORT_DATE_FORMAT),
    dataConstraints: null,
    comments: null,
    fileAccept: '.csv',
    fileRules: [],
    fileInputError: [],
    alertMessage: null,
    alertType: null,
    submissionErrors: null as SubmissionErrors | null,
    draftReport: null as any,
    draftReportHtml: null,
    finalReportHtml: null,
    isReadyToGenerate: false,
    confirmBackDialogVisible: false,
    confirmOverrideReportDialogVisible: false,
  }),
  methods: {
    ...mapActions(useReportStepperStore, ['setStage']),
    setSuccessAlert(alertMessage) {
      this.alertMessage = alertMessage;
      this.alertType = 'bootstrap-success';
    },
    setErrorAlert(submissionErrors: SubmissionErrors | null) {
      this.submissionErrors = submissionErrors;
      if (submissionErrors) {
        this.uploadFileValue = null;
      }
    },
    showStage(stageName: ReportStage) {
      this.setStage(stageName);
      this.setSuccessAlert(null);
      this.isReadyToGenerate = false;

      // Wait a short time for the stage's HTML to render, then
      // scroll to the top of the screen
      setTimeout(() => {
        window.scrollTo(0, 0); //scroll to top of screen
      }, 100);
    },
    async fetchReportHtml(reportId: string) {
      console.log(`fetch report ${reportId}`);
      const unsanitisedHtml = await ApiService.getHtmlReport(reportId);
      this.draftReportHtml = sanitizeUrl(unsanitisedHtml);
    },
    async downloadPdf(reportId: string) {
      await ApiService.getPdfReport(reportId);
    },
    async tryGenerateReport() {
      const existingPublished = await ApiService.getReports({
        report_start_date: this.draftReport.report_start_date,
        report_end_date: this.draftReport.report_end_date,
        report_status: 'Published',
      });
      const reportAlreadyExists = existingPublished.length;
      if (reportAlreadyExists) {
        //show a dialog to confirm override
        this.confirmOverrideReportDialogVisible = true;
      } else {
        this.generateReport();
      }
    },
    async generateReport() {
      this.isProcessing = true;
      try {
        const unsanitisedHtml = await ApiService.publishReport(
          this.draftReport?.report_id,
        );
        this.finalReportHtml = sanitizeUrl(unsanitisedHtml);
        this.showStage('FINAL');
      } catch (e) {
        console.log(e);
        //Todo: show error to user via the notification service.
      }
      this.isProcessing = false;
    },
    async submit() {
      this.isProcessing = true;
      try {
        const formData = new FormData();
        formData.append('companyName', this.companyName);
        formData.append('companyAddress', this.companyAddress);
        formData.append('naicsCode', this.naicsCode);
        formData.append('employeeCountRangeId', this.employeeCountRange);
        formData.append('startDate', this.startDate);
        formData.append('endDate', this.endDate);
        formData.append(
          'dataConstraints',
          this.dataConstraints ? this.dataConstraints : '',
        );
        formData.append('comments', this.comments ? this.comments : '');
        formData.append('file', this.uploadFileValue[0]);
        this.draftReport = await ApiService.postSubmission(formData);
        await this.fetchReportHtml(this.draftReport.report_id);
        this.showStage('REVIEW');
        this.setSuccessAlert('Submission received.');
        this.setErrorAlert(null);
        this.isProcessing = false;
      } catch (error) {
        console.error(error);
        this.isProcessing = false;
        this.setSuccessAlert(null);
        this.setErrorAlert(error.response.data?.errors);
      }
    },
    submitRequest() {
      if (this.dataReady) {
        if (
          this.uploadFileValue[0].name?.match(
            '^[\\u0080-\\uFFFF\\w,\\s-_]+\\.[A-Za-z]{3,4}$',
          )
        ) {
          this.active = true;
          const reader = new FileReader();
          reader.onload = this.uploadFile;
          reader.onabort = this.handleFileReadErr;
          reader.onerror = this.handleFileReadErr;
          reader.readAsBinaryString(this.uploadFileValue[0]);
        } else {
          this.active = false;
          this.setErrorAlert({
            general_errors: [
              'Please remove spaces and special characters from file name and try uploading again.',
            ],
          });
        }
      }
    },
  },
  watch: {
    naicsCodes(val) {
      this.naicsCodesTruncated = val?.length > 25 ? val.slice(0, 25) : val;
    },
    startDate(newVal) {
      // When the startDate changes, automatically adjust the endDate to be
      // 12 months later
      if (newVal) {
        const endDate = moment(newVal).add(1, 'years').subtract(1, 'months');
        this.endDate = endDate.format(REPORT_DATE_FORMAT);
      }
    },
    endDate(newVal) {
      // When the endDate changes, automatically adjust the startDate to be
      // 12 months earlier
      if (newVal) {
        const startDate = moment(newVal).subtract(1, 'years').add(1, 'months');
        this.startDate = startDate.format(REPORT_DATE_FORMAT);
      }
    },
    userInfo: {
      // Watch for changes to userInfo (from the authStore).  Copy company name
      // and address from that object into state variables in this component.
      immediate: true,
      handler(userInfo) {
        this.companyName = userInfo?.legalName;
        const address = `${
          userInfo?.addressLine1 ? userInfo?.addressLine1 : ''
        } ${userInfo?.addressLine2 ? userInfo?.addressLine2 : ''} ${userInfo?.city ? userInfo?.city : ''} ${userInfo?.province ? userInfo?.province : ''} ${userInfo?.postal ? userInfo?.postal : ''}`.trim();
        this.companyAddress = address;
      },
    },
  },
  computed: {
    ...mapState(useCodeStore, ['employeeCountRanges', 'naicsCodes']),
    ...mapState(authStore, ['userInfo']),
    ...mapWritableState(useReportStepperStore, ['stage']),
    dataReady() {
      return this.validForm && this.uploadFileValue;
    },
    fromDateDisp() {
      return this.fromDateVal;
    },
    areRequiredFieldsComplete() {
      return (
        !!this.companyName &&
        !!this.companyAddress &&
        !!this.naicsCode &&
        !!this.employeeCountRange &&
        !!this.startDate &&
        !!this.endDate &&
        !!this.uploadFileValue
      );
    },
  },
};
</script>

<style lang="scss">
/* The vue-datepicker component is not from the vuetify library, and its default
 look and feel doesn't match the other vuetify components used here.  
 The following css class is used to style the vue-datepicker components to closely 
 match the Vuetify components. */
.datepicker-input {
  border-top: none;
  border-left: none;
  border-right: none;
  border-bottom: 1px solid #888888;
  border-bottom-left-radius: 0px;
  border-bottom-right-radius: 0px;
  background-color: #f6f6f6 !important;
  padding: 15px 5px 15px 35px;
}
</style>
