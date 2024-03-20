<template>
  <v-banner
    sticky
    width=" fit-content"
    border="none"
    bg-color="rgba(255, 255, 255, 0)"
    style="z-index: 190"
  >
    <v-btn to="/">Back</v-btn>
  </v-banner>
  <v-container>
    <v-form ref="inputForm">
      <v-row class="justify-center">
        <v-col cols="10" class="w-100">
          <ReportStepper />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-banner border class="text-grey-darken-1">
            Disclaimer: This tool relies on the employer supplying accurate and
            complete payroll data in order to calculate pay gaps.
          </v-banner>
        </v-col>
      </v-row>
      <v-row class="mt-6" dense>
        <v-col class="font-weight-bold text-h6"> Employer </v-col>
      </v-row>
      <v-row dense>
        <v-col class="font-weight-bold text-h5 d-flex align-center">
          <v-icon icon="fa:fas fa-user" size="small" class="icon-color mr-3" />
          {{ companyName }}
        </v-col>
      </v-row>
      <v-row dense>
        <v-col class="text-h5 d-flex align-center">
          <v-icon
            icon="fa:fas fa-location-dot"
            size="small"
            class="icon-color mr-3"
          />
          {{ companyAddress }}
        </v-col>
      </v-row>
      <v-row class="my-7">
        <v-col>
          <v-divider />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col class="text-subtitle-2">
          Fields marked
          <span class="text-red font-weight-bold text-h6">*</span>
          are required.
        </v-col>
      </v-row>
      <!-- NAICS Code -->
      <v-row>
        <v-col>
          <div class="text-body-1 font-weight-bold">
            <label for="naicsCode" :class="{ 'text-red': naicsCodeError }">
              NAICS Code
            </label>
            <span class="text-red font-weight-bold text-h6">*</span>
            <v-tooltip
              text="The North American Industry Classification System (NAICS) code represents a sector; select the one that best represents your employer. If your employer comprises of multiple sectors, select the code that covers the majority of employees"
              :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  class="icon-color"
                />
              </template>
            </v-tooltip>
          </div>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <v-autocomplete
            id="naicsCode"
            ref="naicsCode"
            v-model="naicsCode"
            :rules="requiredRules"
            :items="naicsCodes"
            :item-title="(n: any) => `${n.naics_code} - ${n.naics_label}`"
            item-value="naics_code"
            label="Select"
            required
          >
          </v-autocomplete>
        </v-col>
      </v-row>
      <!-- Employee Count Range -->
      <v-row>
        <v-col>
          <div class="text-body-1 font-weight-bold">
            <label
              for="employeeCountRange"
              :class="{ 'text-red': employeeCountRangeError }"
            >
              Employee Count Range
            </label>
            <span class="text-red font-weight-bold text-h6">*</span>
            <v-tooltip
              text="Select the range that is closest to the number of employees who were employed as of January 1 of the year your report is being prepared for"
              :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  class="icon-color"
                />
              </template>
            </v-tooltip>
          </div>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <v-radio-group
            id="employeeCountRange"
            ref="employeeCountRange"
            v-model="employeeCountRange"
            :rules="requiredRules"
            inline
            required
          >
            <v-radio
              v-for="range in employeeCountRanges"
              :key="range.employee_count_range_id"
              :label="range.employee_count_range"
              :value="range.employee_count_range_id"
            ></v-radio>
          </v-radio-group>
        </v-col>
      </v-row>
      <!-- Time Period -->
      <v-row>
        <v-col>
          <div class="text-body-1 font-weight-bold">
            <label :class="{ 'text-red': timePeroidError }">
              Time Period
            </label>
            <span class="text-red font-weight-bold text-h6">*</span>
            <v-tooltip
              text="The 12-month reporting period can be either the preceding calendar year, or the most recently completed financial year"
              :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  class="icon-color"
                />
              </template>
            </v-tooltip>
          </div>
        </v-col>
      </v-row>
      <v-row dense align="end">
        <!-- startMonth, startYear -->
        <v-col lg="4" sm="6" cols="12">
          <v-row dense align="end">
            <!-- startMonth -->
            <v-col>
              <span class="text-grey-darken-1">From</span>
              <v-combobox
                id="startMonth"
                ref="startMonth"
                v-model="startMonth"
                label="Month"
                :items="months"
                item-title="name"
                item-value="value"
              />
            </v-col>
            <!-- startYear -->
            <v-col>
              <v-combobox
                id="startYear"
                ref="startYear"
                v-model="startYear"
                label="Year"
                :items="selectYears"
              />
            </v-col>
          </v-row>
        </v-col>
        <!-- endMonth, endYear -->
        <v-col lg="4" sm="6" cols="12">
          <v-row dense align="end">
            <v-col
              v-if="!$vuetify.display.xs"
              cols="1"
              class="d-flex justify-center text-h3 text-grey-darken-1"
              align-self="center"
            >
              -
            </v-col>
            <!-- endMonth -->
            <v-col>
              <span class="text-grey-darken-1">To</span>
              <v-combobox
                id="endMonth"
                ref="endMonth"
                v-model="endMonth"
                label="Month"
                :items="months"
                item-title="name"
                item-value="value"
              />
            </v-col>
            <!-- endYear -->
            <v-col>
              <v-combobox
                id="endYear"
                ref="endYear"
                v-model="endYear"
                label="Year"
                :items="selectYears"
              />
            </v-col>
          </v-row>
        </v-col>
        <!-- reportYear -->
        <v-col lg="4" sm="6" cols="12">
          <v-row dense>
            <v-col class="d-flex">
              <div class="mt-2 mx-3">
                <label for="reportYear"> Reporting Year: </label>
                <span class="text-red font-weight-bold text-h6">*</span>
                <v-tooltip
                  text="testest"
                  :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
                >
                  <template #activator="{ props }">
                    <v-icon
                      v-bind="props"
                      icon="fa:fas fa-circle-info"
                      size="x-small"
                      class="icon-color"
                    />
                  </template>
                </v-tooltip>
              </div>
              <v-combobox
                id="reportYear"
                ref="reportYear"
                v-model="reportYear"
                label="Year"
                :items="selectYears"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <!-- Employer Statement -->
      <v-row>
        <v-col>
          <div class="text-body-1 font-weight-bold">
            <label for="comments"> Employer Statement </label>
            <v-tooltip
              text="Please share any general information about your employer"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  class="icon-color"
                />
              </template>
            </v-tooltip>
            <span class="text-subtitle-2 text-grey"
              >(Optional: you can return to this page to complete it after
              viewing your draft report.)</span
            >
          </div>
          <div class="text-subtitle-2 text-grey-darken-1">
            This will appear at the top of your pay transparency report.
          </div>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <v-textarea
            id="comments"
            v-model="comments"
            placeholder="Maximum 4,000 characters"
            maxlength="4000"
            counter
          />
        </v-col>
      </v-row>
      <!-- Data Constraints -->
      <v-row>
        <v-col>
          <div class="text-body-1 font-weight-bold">
            <label for="dataConstraints"> Data Constraints </label>
            <v-tooltip
              text='Please share any information (e.g. Limitations, constraints, or dependencies) that may be helpful to explain your payroll data (e.g. "Bonus pay not offered by [employer name]")'
              :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  class="icon-color"
                />
              </template>
            </v-tooltip>
            <span class="text-subtitle-2 text-grey"
              >(Optional: you can return to this page to complete it after
              viewing your draft report.)</span
            >
          </div>
          <div class="text-subtitle-2 text-grey-darken-1">
            This will appear at the bottom of your pay transparency report.
          </div>
        </v-col>
      </v-row>
      <v-row dense>
        <v-col>
          <v-textarea
            id="dataConstraints"
            v-model="dataConstraints"
            placeholder="Maximum 3,000 characters"
            maxlength="3000"
            counter
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <div class="text-body-1 font-weight-bold">
            <label for="naicsCode" :class="{ 'text-red': fileUploadError }">
              File Upload
            </label>
            <span class="text-red font-weight-bold text-h6">*</span>
            <div class="text-subtitle-2 text-grey-darken-1">
              To proceed, upload your employee data in comma-separated value
              (CSV) format. Ensure the CSV file follows the provided CSV
              template () for accurate processing.
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row
        dense
        class="pa-5 d-flex align-center"
        style="
          border-style: dashed;
          border: 3px dashed #666666;
          border-radius: 10px;
          min-height: 7em;
        "
        :class="{ 'file-success': !!uploadFileValue }"
      >
        <v-col>
          <div
            v-if="!uploadFileValue"
            class="d-flex justify-center align-center"
          >
            <p class="text-subtitle-2 text-grey-darken-1">
              Supported format: CSV. Maximum file size:
              {{ maxFileUploadSize }}.
            </p>
            <PrimaryButton
              text="Upload file"
              :click-action="
                () => {
                  ($refs.uploadFile as VFileInput).click();
                }
              "
            />
            <v-file-input
              v-show="false"
              id="csvFile"
              ref="uploadFile"
              v-model="uploadFileValue"
              color="#003366"
              :accept="fileAccept"
              hint="Select a CSV file"
              :error-messages="fileInputError"
              placeholder="Select a CSV file"
              :rules="requiredRules"
            />
          </div>
          <div v-if="uploadFileValue" class="d-flex align-center">
            <div class="d-flex justify-center" style="flex: 1">
              {{ uploadFileValue[0].name }} ({{ uploadFileValue[0].size }})
            </div>
            <div>
              <v-btn
                variant="text"
                icon="fa:fas fa-xmark"
                @click="uploadFileValue = undefined"
              />
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row v-if="submissionErrors" class="mt-3">
        <v-col>
          <v-alert class="bootstrap-error mb-3">
            <h4 class="mb-3">
              The submission contains errors which must be corrected.
            </h4>

            <!-- general errors related to the submission (either with the 
                          form fields or with the file itself) -->
            <v-table v-if="submissionErrors?.generalErrors" density="compact">
              <tbody>
                <tr
                  v-for="generalError in submissionErrors.generalErrors"
                  :key="generalError"
                >
                  <td class="text-left">
                    {{ generalError }}
                  </td>
                </tr>
              </tbody>
            </v-table>

            <!-- errors related to the content of specific lines in the file -->
            <div v-if="submissionErrors?.rowErrors">
              <h4 class="mb-3">
                Please review the following lines from the uploaded file:
              </h4>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th id="line-num-header" class="text-left">Line</th>
                    <th id="problem-desc-header" class="text-left">
                      Problem(s)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="rowError in submissionErrors.rowErrors"
                    :key="rowError.rowNum"
                  >
                    <td class="text-left">{{ rowError.rowNum }}</td>
                    <td class="text-left">
                      <span v-for="errMsg in rowError.errorMsgs" class="mr-2">
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

      <v-row class="mt-6">
        <v-col cols="12" class="d-flex justify-center">
          <PrimaryButton
            id="submitButton"
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
import ReportStepper from './util/ReportStepper/Stepper.vue';
import ApiService, { ISubmission } from '../common/apiService';
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
import { CsvService, IParseSuccessResponse } from '../common/csvService';
import {
  LocalDate,
  ChronoUnit,
  convert,
  TemporalAdjusters,
  DateTimeFormatter,
} from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { IConfigValue } from '../common/types';
import axios from 'axios';
import { VFileInput } from 'vuetify/components';

interface RowError {
  rowNum: number;
  errorMsgs: string[];
}

export interface ISubmissionError {
  bodyErrors: string[] | null;
  rowErrors: RowError[] | null;
  generalErrors: string[];
}

const REPORT_DATE_FORMAT = 'yyyy-MM-dd';

const dateFormatter = DateTimeFormatter.ofPattern(
  REPORT_DATE_FORMAT,
).withLocale(Locale.CANADA);

export default {
  components: {
    PrimaryButton,
    VFileInput,
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
    requiredRules: [(v: string) => !!v || 'Complete this field.'],
    companyName: '',
    companyAddress: '',
    naicsCode: null as any,
    naicsCodeError: false as boolean,
    naicsCodesTruncated: [],
    employeeCountRange: null as any,
    employeeCountRangeError: false as boolean,
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
    // startMonth: null as number,
    // startYear: null as number,
    // endMonth: null as number,
    // endYear: null as number,
    // reportYear: null as number,
    months: [
      { name: 'January', value: 1 },
      { name: 'February', value: 2 },
      { name: 'March', value: 3 },
      { name: 'April', value: 4 },
      { name: 'May', value: 5 },
      { name: 'June', value: 6 },
      { name: 'July', value: 7 },
      { name: 'August', value: 8 },
      { name: 'September', value: 9 },
      { name: 'October', value: 10 },
      { name: 'November', value: 11 },
      { name: 'December', value: 12 },
    ],
    selectYears: [2023, 2024],
    dataConstraints: null,
    comments: null,
    fileAccept: '.csv',
    fileRules: [],
    fileInputError: [],
    alertMessage: null as string | null,
    alertType: null as string | null,
    submissionErrors: null as ISubmissionError | null,
    draftReport: null,
    approvedRoute: null as string | null,
    reportStatus: null,
  }),
  beforeMount() {
    this.setStage('UPLOAD');
    this.loadConfig()
      .then((data) => {
        this.setMaxFileUploadSize(data as IConfigValue);
      })
      .catch((error) => {
        NotificationService.pushNotificationError(
          'Failed to load application settings. Please reload the page.',
        );
      });

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
    setErrorAlert(submissionErrors: ISubmissionError | null) {
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
    toISubmissionError(
      error: string | { message: string } | ISubmissionError,
    ): ISubmissionError {
      if (typeof error == 'string') {
        // The input error parameter is a string.
        return {
          bodyErrors: null,
          rowErrors: null,
          generalErrors: [error],
        };
      } else if (axios.isAxiosError(error)) {
        return this.toISubmissionError(error?.response?.data?.error);
      } else if (error.hasOwnProperty('message')) {
        // The input error parameter is an object with a "message" property
        const errorWithMessage = error as { message: string };
        return {
          bodyErrors: null,
          rowErrors: null,
          generalErrors: [errorWithMessage.message],
        };
      } else if (this.isISubmissionError(error)) {
        // The input error object is already a SubmissionError
        return error as ISubmissionError;
      }

      // The input error object isn't of a known format.  Return a general
      // error message instead.
      return {
        bodyErrors: null,
        rowErrors: null,
        generalErrors: ['Something went wrong.'],
      };
    },
    isISubmissionError(obj) {
      return (
        obj?.hasOwnProperty('bodyErrors') &&
        obj?.hasOwnProperty('rowErrors') &&
        obj?.hasOwnProperty('generalErrors')
      );
    },
    async submit() {
      if (!this.uploadFileValue?.length) {
        throw new Error('Cannot submit without a selected file');
      }

      this.employeeCountRangeError = !this.employeeCountRange;
      this.naicsCodeError = !this.naicsCode;
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
        this.onSubmitComplete(this.toISubmissionError(error));
        return;
      }

      try {
        this.draftReport = await ApiService.postSubmission(submission);
        await this.setReportInfo(this.draftReport as any);
        this.onSubmitComplete(null);
      } catch (error: any) {
        console.log(error);
        // Handle different kinds of error objects by converting them
        // into a SubmissionError
        this.onSubmitComplete(this.toISubmissionError(error));
      }
    },
    /* This function should be called either after a submission was
    successful, or after it errors out. */
    onSubmitComplete(submissionErrors: ISubmissionError | null) {
      if (submissionErrors) {
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
      if (data?.maxUploadFileSize) {
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
    naicsCode() {
      this.naicsCodeError = false;
    },
    employeeCountRange() {
      this.employeeCountRangeError = false;
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
    timePeroidError() {
      return (
        this.startMonth &&
        this.startYear &&
        this.endMonth &&
        this.endYear &&
        this.reportYear
      );
    },
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
.file-success {
  background-color: #d9e7d8;
}

.icon-color {
  color: #003366;
}

textarea::placeholder {
  text-align: right;
  transform: translateY(95px);
}

.hide-date-picker-controls {
  .v-date-picker-controls {
    display: none;
  }
}

// remove label from text-field component
// .remove-label-textfield .v-field .v-field__field {
//   .v-field__input {
//     padding-top: 4px;
//   }
//   .v-field-label--floating {
//     opacity: 0;
//   }
// }

.text-error,
.v-input-error {
  color: #d8292f !important;
}
</style>
