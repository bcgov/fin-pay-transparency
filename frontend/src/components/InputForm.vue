<template>
  <v-container class="d-flex justify-center h-100">
    <v-form ref="inputForm" class="w-100 h-100">
      <v-banner
        sticky
        width=" fit-content"
        border="none"
        bg-color="rgba(255, 255, 255, 0)"
        style="z-index: 190"
      >
        <v-btn to="/">Back</v-btn>
      </v-banner>
      <v-row class="d-flex justify-center w-100">
        <v-col sm="10" md="8" class="w-100">
          <v-row class="mb-4 d-flex justify-center w-100">
            <v-col cols="10" class="w-100">
              <ReportStepper />
            </v-col>
          </v-row>

          <div>
            <v-row class="d-flex justify-start mt-6" dense>
              <v-col cols="12">
                <h2 class="heading text-center mb-4">Employer Details</h2>
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
                  :item-title="(n: any) => `${n.naics_code} - ${n.naics_label}`"
                  item-value="naics_code"
                  label="NAICS Code"
                  required
                ></v-autocomplete>
                <v-icon
                  v-if="!naicsCode"
                  color="#D8292F"
                  icon="mdi-asterisk"
                  size="x-small"
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
                  v-if="!employeeCountRange"
                  color="#D8292F"
                  icon="mdi-asterisk"
                  size="x-small"
                ></v-icon>
              </v-col>

              <v-col cols="12" class="d-flex">
                Select your 12 month report range
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
                  :disabled="reportStatus === 'Published'"
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
                  v-if="!startDate"
                  color="#D8292F"
                  icon="mdi-asterisk"
                  size="x-small"
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
                  :disabled="reportStatus === 'Published'"
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
                  v-if="!endDate"
                  color="#D8292F"
                  icon="mdi-asterisk"
                  size="x-small"
                ></v-icon>
              </v-col>

              <v-col cols="12">
                <h3 class="heading mt-4 mb-2">Contextual Info/Comments</h3>
                <p class="description mb-4">
                  Please share any general information about your employer which
                  will appear at the top of your pay transparency report. This
                  section is optional and you can return to this page to
                  complete it after viewing your draft report.
                </p>
                <v-textarea
                  id="comments"
                  v-model="comments"
                  placeholder="Contextual Info field - Maximum 4,000 characters"
                  maxlength="4000"
                  counter
                  clearable
                >
                </v-textarea>
              </v-col>

              <v-col cols="12">
                <h3 class="heading mb-2">Data Constraints</h3>
                <p class="description mb-4">
                  Please share any information (that is, Limitations,
                  constraints, or dependencies) that may be helpful to explain
                  your payroll data (for example, “Bonus pay not offered by
                  [employer name]”). This will appear at the bottom of your pay
                  transparency report. This section is optional and you can
                  return to this page to complete it after viewing your draft
                  report.
                </p>
                <v-textarea
                  id="dataConstraints"
                  v-model="dataConstraints"
                  placeholder="Data Constraints field - Maximum 3,000 characters"
                  maxlength="3000"
                  counter
                  clearable
                >
                  <template v-slot:details> </template>
                </v-textarea>
              </v-col>

              <v-col cols="12">
                <h3 class="heading mb-2">File Upload</h3>
                <p class="warning mb-4">
                  To proceed, upload your employee data in comma-separated value
                  (CSV) format. Ensure the CSV file follows the provided CSV
                  template (<u>bc-pay-transparency-tool-data-template.csv</u>)
                  for accurate processing.
                </p>

                <v-row v-if="submissionErrors" class="mt-3">
                  <v-col>
                    <v-alert class="bootstrap-error mb-3">
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
                      v-if="!uploadFileValue"
                      color="#D8292F"
                      icon="mdi-asterisk"
                      size="x-small"
                    ></v-icon>
                  </div>

                  <p class="d-flex justify-center">
                    Supported format: CSV. Maximum file size:
                    {{ maxFileUploadSize }}.
                  </p>
                </v-sheet>
              </v-col>
            </v-row>

            <v-row class="mt-6">
              <v-col
                v-if="!areRequiredFieldsComplete"
                cols="12"
                class="text-subtitle-2 d-flex justify-center"
              >
                <v-icon
                  color="#D8292F"
                  icon="mdi-asterisk"
                  size="x-small"
                ></v-icon>
                Please complete all required fields
              </v-col>
              <p class="text-subtitle-2">
                Disclaimer: This tool relies on the employer supplying accurate
                and complete payroll data in order to calculate pay gaps.
              </p>
              <v-col cols="12" class="d-flex justify-center">
                <PrimaryButton
                  id="submitButton"
                  :disabled="!areRequiredFieldsComplete"
                  text="Submit"
                  :click-action="submit"
                />
              </v-col>
            </v-row>

            <v-row class="mt-3">
              <v-col>
                <v-alert v-if="alertMessage" :class="alertType" class="mb-3">
                  {{ alertMessage }}
                </v-alert>
              </v-col>
            </v-row>
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
    <ConfirmationDialog ref="confirmBackDialog">
      <template #message>
        <p class="pb-4">Do you want to go back to the previous screen?</p>
        <p>
          Please note: This draft report will not be saved after going back or
          logging out of the system.
        </p>
      </template>
    </ConfirmationDialog>
  </v-container>
</template>

<script lang="ts">
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import PrimaryButton from './util/PrimaryButton.vue';
import Spinner from './Spinner.vue';
import ReportStepper from './util/ReportStepper.vue';
import ApiService from '../common/apiService';
import { ISubmission } from '../common/apiService';
import { useCodeStore } from '../store/modules/codeStore';
import { authStore } from '../store/modules/auth';
import { mapActions, mapState } from 'pinia';
import {
  useReportStepperStore,
  ReportMode,
} from '../store/modules/reportStepper';
import ConfirmationDialog from './util/ConfirmationDialog.vue';
import { humanFileSize } from '../utils/file';
import { useConfigStore } from '../store/modules/config';
import { NotificationService } from '../common/notificationService';
import {
  CsvService,
  IParseSuccessResponse,
  IParseErrorResponse,
} from '../common/csvService';
import {
  LocalDate,
  ChronoUnit,
  convert,
  TemporalAdjusters,
  DateTimeFormatter,
} from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { IConfigValue } from '../common/types';

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

const REPORT_DATE_FORMAT = 'yyyy-MM-dd';

const dateFormatter = DateTimeFormatter.ofPattern(
  REPORT_DATE_FORMAT,
).withLocale(Locale.CANADA);

export default {
  components: {
    PrimaryButton,
    VueDatePicker,
    Spinner,
    ReportStepper,
    ConfirmationDialog,
  },
  async beforeRouteLeave(to, from, next) {
    if (to.fullPath == this.approvedRoute || this.mode != ReportMode.Edit) {
      next();
      return;
    }

    const response = await (this.$refs as any).confirmBackDialog.open(
      'Please Confirm',
      'Do you want to go back to the dashboard? Note that changes will not be saved after navigating back or logging out of the system.',
      {
        titleBold: true,
        resolveText: 'Yes',
      },
    );
    next(response);
  },
  data: () => ({
    validForm: null,
    requiredRules: [(v) => !!v || 'Required'],
    companyName: '',
    companyAddress: '',
    naicsCode: null as any,
    naicsCodesTruncated: [],
    employeeCountRange: null as any,
    isProcessing: false,
    uploadFileValue: undefined as File[] | undefined,
    maxFileUploadSize: '',
    minStartDate: convert(
      LocalDate.now()
        .minus(2, ChronoUnit.YEARS)
        .with(TemporalAdjusters.firstDayOfMonth()),
    ).toDate(),
    maxStartDate: convert(
      LocalDate.now()
        .minus(1, ChronoUnit.YEARS)
        .with(TemporalAdjusters.lastDayOfMonth()),
    ).toDate(),
    minEndDate: convert(
      LocalDate.now().minusYears(1).minusMonths(1).withDayOfMonth(1),
    ).toDate(),
    maxEndDate: convert(
      LocalDate.now().minusMonths(1).with(TemporalAdjusters.lastDayOfMonth()),
    ).toDate(),
    startDate: LocalDate.now()
      .minusYears(1)
      .with(TemporalAdjusters.lastDayOfMonth())
      .format(dateFormatter),
    endDate: LocalDate.now()
      .minus(1, ChronoUnit.MONTHS)
      .with(TemporalAdjusters.lastDayOfMonth())
      .format(dateFormatter),
    dataConstraints: null,
    comments: null,
    fileAccept: '.csv',
    fileRules: [],
    fileInputError: [],
    alertMessage: null as string | null,
    alertType: null as string | null,
    submissionErrors: null as SubmissionErrors | null,
    draftReport: null,
    approvedRoute: null as string | null,
    reportStatus: null,
  }),
  async beforeMount() {
    this.setStage('UPLOAD');

    try {
      const data = await this.loadConfig();
      this.setMaxFileUploadSize(data as IConfigValue);
    } catch (error) {
      NotificationService.pushNotificationError(
        'Failed to load application settings. Please reload the page.',
      );
    }

    if (this.reportId) {
      this.comments = this.reportData.user_comment;
      this.employeeCountRange = this.reportData.employee_count_range_id;
      this.naicsCode = this.reportData.naics_code;
      this.startDate = this.reportData.report_start_date;
      this.endDate = this.reportData.report_end_date;
      this.dataConstraints = this.reportData.data_constraints;
      this.reportStatus = this.reportData.report_status;
    }
  },
  methods: {
    ...mapActions(useReportStepperStore, [
      'setStage',
      'setReportInfo',
      'reset',
    ]),
    ...mapActions(useConfigStore, ['loadConfig']),
    setSuccessAlert(alertMessage) {
      this.alertMessage = alertMessage;
      this.alertType = 'bootstrap-success';
    },
    setErrorAlert(submissionErrors: SubmissionErrors | null) {
      this.submissionErrors = submissionErrors;
      if (submissionErrors) {
        this.uploadFileValue = undefined;
      }
    },
    nextStage() {
      this.approvedRoute = '/draft-report';
      this.$router.push({ path: this.approvedRoute });
    },
    /* This helper function bridges between different kinds of errors
    that could be generated by the submission process, and the SubmissionErrors
    object that we ultimately display */
    stringToSubmissionErrors(msg: string): SubmissionErrors {
      return {
        bodyErrors: null,
        fileErrors: {
          generalErrors: [],
          lineErrors: null,
        },
        generalErrors: [msg],
      };
    },
    async submit() {
      if (!this.uploadFileValue?.length) {
        throw new Error('Cannot submit without a selected file');
      }

      this.isProcessing = true;
      let submission: ISubmission | null = null;

      try {
        // Parse the csv file, convert it into a json array, and perform
        // preliminary validation.
        const parseResponse: IParseSuccessResponse = await CsvService.parse(
          this.uploadFileValue[0],
        );

        // Preliminary validation of the input file passed, so prepare
        // the submission
        submission = {
          companyName: this.companyName,
          companyAddress: this.companyAddress,
          naicsCode: this.naicsCode,
          employeeCountRangeId: this.employeeCountRange,
          startDate: this.startDate,
          endDate: this.endDate,
          dataConstraints: this.dataConstraints,
          comments: this.comments,
          rows: parseResponse.data,
        };
        if (this.reportId) {
          submission['id'] = this.reportId;
        }
      } catch (error: any) {
        this.onSubmitComplete(this.stringToSubmissionErrors(error.message));
        return;
      }

      try {
        this.draftReport = await ApiService.postSubmission(submission);
        await this.setReportInfo(this.draftReport as any);
        this.onSubmitComplete(null);
      } catch (error: any) {
        this.onSubmitComplete(error.response.data?.errors);
      }
    },
    /* This function should be called either after a submission was
    successful, or after it errors out. */
    onSubmitComplete(submissionErrors: SubmissionErrors | null) {
      if (submissionErrors) {
        console.error(submissionErrors);
        this.setSuccessAlert(null);
        this.setErrorAlert(submissionErrors);
      } else {
        // no errors
        this.nextStage();
        this.setSuccessAlert('Submission received.');
        this.setErrorAlert(null);
      }
      this.isProcessing = false;
    },
    setMaxFileUploadSize(data: IConfigValue) {
      if (data.maxUploadFileSize) {
        this.maxFileUploadSize = humanFileSize(
          data?.maxUploadFileSize || 8000000,
          0,
        );
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
        const endDate = LocalDate.parse(newVal)
          .plusYears(1)
          .minusMonths(1)
          .with(TemporalAdjusters.lastDayOfMonth());
        this.endDate = endDate.format(dateFormatter);
      }
    },
    endDate(newVal) {
      // When the endDate changes, automatically adjust the startDate to be
      // 12 months earlier
      if (newVal) {
        const startDate = LocalDate.parse(newVal).minusYears(1).plusMonths(1);
        this.startDate = startDate.format(dateFormatter);
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
    config(data) {
      this.setMaxFileUploadSize(data);
    },
  },
  computed: {
    ...mapState(useConfigStore, ['config']),
    ...mapState(useCodeStore, ['employeeCountRanges', 'naicsCodes']),
    ...mapState(authStore, ['userInfo']),
    ...mapState(useReportStepperStore, [
      'reportId',
      'reportInfo',
      'reportData',
      'mode',
    ]),
    dataReady() {
      return this.validForm && this.uploadFileValue;
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

textarea::placeholder {
  text-align: right;
  transform: translateY(95px);
}

input {
  font-family: 'BC Sans', 'Noto Sans', Arial, Verdana, sans-serif;
  color: #606060 !important;
  background-color: #f2f2f2 !important;
  size: 16px;
}

h3.heading {
  font-family: 'BC Sans', 'Noto Sans', Arial, Verdana, sans-serif;
  color: #313132 !important;
  size: 16px;
}

p.description {
  font-family: 'BC Sans', 'Noto Sans', Arial, Verdana, sans-serif;
  color: #606060 !important;
  size: 12px;
}

p.warning {
  font-family: 'BC Sans', 'Noto Sans', Arial, Verdana, sans-serif;
  color: #d8292f !important;
  size: 12px;
}

.v-messages__message,
.text-error,
.v-input-error {
  color: #d8292f !important;
}

.BC-Gov-SecondaryButton {
  background: none;
  border-radius: 4px;
  border: 2px solid #003366;
  padding: 10px 30px;
  text-align: center;
  text-decoration: none;
  display: block;
  font-size: 18px;
  font-family: 'BC Sans', 'Noto Sans', Arial, Verdana, sans-serif;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  color: #003366;
}

.BC-Gov-SecondaryButton:hover {
  opacity: 0.8;
  text-decoration: underline;
  background-color: #003366;
  color: #ffffff;
}

.BC-Gov-SecondaryButton:focus {
  outline-offset: 1px;
  outline: 4px solid #3b99fc;
}

.BC-Gov-SecondaryButton:active {
  opacity: 1;
}
</style>
