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
    <v-form ref="inputForm" @submit.prevent="submit">
      <v-row class="justify-center">
        <v-col cols="10" class="w-100">
          <ReportStepper />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-banner border class="text-grey-darken-1 justify-center">
            Disclaimer: This tool relies on the employer supplying accurate and
            complete payroll data in order to calculate pay gaps.
          </v-banner>
        </v-col>
      </v-row>
      <v-row class="mt-6" dense>
        <v-col class="text-body-1 font-weight-bold"> Employer </v-col>
      </v-row>
      <v-row dense>
        <v-col
          id="companyName"
          class="font-weight-bold text-h5 d-flex align-center"
        >
          <v-icon
            icon="fa:fas fa-user"
            size="small"
            color="primary"
            class="mr-3"
          />
          {{ companyName }}
        </v-col>
      </v-row>
      <v-row dense>
        <v-col id="companyAddress" class="text-h5 d-flex align-center">
          <v-icon
            icon="fa:fas fa-location-dot"
            color="primary"
            size="small"
            class="mr-3"
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
          <span class="text-error font-weight-bold text-h6">*</span>
          are required.
        </v-col>
      </v-row>
      <!-- NAICS Code -->
      <v-row>
        <v-col>
          <div class="text-body-1 font-weight-bold">
            <label
              for="naicsCode"
              color="error"
              :class="{ 'text-error': isSubmit && !naicsCode }"
            >
              NAICS Code
            </label>
            <span class="text-error font-weight-bold text-h6">*</span>
            <v-tooltip
              text="The North American Industry Classification System (NAICS) code represents a sector; select the one that best represents your employer. If your employer comprises of multiple sectors, select the code that covers the majority of employees."
              :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  color="primary"
                  class="ml-1"
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
              :class="{ 'text-error': isSubmit && !employeeCountRange }"
            >
              Employee Count Range
            </label>
            <span class="text-error font-weight-bold text-h6">*</span>
            <v-tooltip
              text="Select the range that is closest to the number of employees who were employed as of January 1 of the year your report is being prepared for."
              :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  color="primary"
                  class="ml-1"
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
            <label
              :class="{
                'text-error':
                  isSubmit &&
                  (!startMonth ||
                    !startYear ||
                    !endMonth ||
                    !endYear ||
                    !reportYear),
              }"
            >
              Time Period
            </label>
            <span class="text-error font-weight-bold text-h6">*</span>
            <v-tooltip
              text="The 12-month reporting period can be either the preceding calendar year, or the most recently completed financial year."
              :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  color="primary"
                  class="ml-1"
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
                v-model="startMonth"
                label="Month"
                :items="startMonthList"
                :return-object="false"
                :rules="requiredRules"
              />
            </v-col>
            <!-- startYear -->
            <v-col>
              <v-combobox
                id="startYear"
                ref="startYear"
                v-model="startYear"
                label="Year"
                :items="startYearList"
                :rules="requiredRules"
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
                :items="endMonthList"
                :return-object="false"
                :rules="requiredRules"
              />
            </v-col>
            <!-- endYear -->
            <v-col>
              <v-combobox
                id="endYear"
                ref="endYear"
                v-model="endYear"
                label="Year"
                :items="endYearList"
                :rules="requiredRules"
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
                <span class="text-error font-weight-bold text-h6">*</span>
                <v-tooltip
                  text="Employers must submit pay transparency reports by November 1 of each year. Select the year you are submitting a report for."
                  :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
                >
                  <template #activator="{ props }">
                    <v-icon
                      v-bind="props"
                      icon="fa:fas fa-circle-info"
                      size="x-small"
                      color="primary"
                      class="ml-1"
                    />
                  </template>
                </v-tooltip>
              </div>
              <v-combobox
                id="reportYear"
                ref="reportYear"
                v-model="reportYear"
                label="Year"
                :items="reportYearList"
                :rules="requiredRules"
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
              text="Please share any general information about your employer."
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  color="primary"
                  class="mr-1"
                />
              </template>
            </v-tooltip>
            <span class="text-subtitle-2 text-grey">
              (Optional: you can return to this page to complete it after
              viewing your draft report.)
            </span>
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
              text='Please share any information (e.g. Limitations, constraints, or dependencies) that may be helpful to explain your payroll data (e.g. "Bonus pay not offered by [employer name]").'
              :width="$vuetify.display.xs ? $vuetify.display.width : '50%'"
            >
              <template #activator="{ props }">
                <v-icon
                  v-bind="props"
                  icon="fa:fas fa-circle-info"
                  size="x-small"
                  color="primary"
                  class="mr-1"
                />
              </template>
            </v-tooltip>
            <span class="text-subtitle-2 text-grey">
              (Optional: you can return to this page to complete it after
              viewing your draft report.)
            </span>
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
      <!-- File Upload -->
      <v-row>
        <v-col>
          <div class="text-body-1 font-weight-bold">
            <label
              for="naicsCode"
              :class="{ 'text-error': isSubmit && !uploadFileValue }"
            >
              File Upload
            </label>
            <span class="text-error font-weight-bold text-h6">*</span>
            <div class="text-subtitle-2 text-grey-darken-1">
              To proceed, upload your employee data in comma-separated value
              (CSV) format. Ensure the CSV file follows the provided
              <a href="SampleCsv.csv" download>CSV Sample</a>
              for accurate processing.
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
            <v-btn
              color="primary"
              type="button"
              @click="($refs.uploadFile as VFileInput).click()"
            >
              Upload file
            </v-btn>
            <v-file-input
              v-show="false"
              id="csvFile"
              ref="uploadFile"
              v-model="uploadFileValue"
              :accept="fileAccept"
              :error-messages="fileInputError"
              :rules="requiredRules"
            />
          </div>
          <div v-if="uploadFileValue" class="d-flex align-center">
            <div class="d-flex justify-center" style="flex: 1">
              {{ uploadFileValue[0].name }} ({{ uploadFileSize }})
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
      <!-- Submission Errors -->
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
                      <span
                        v-for="errMsg in rowError.errorMsgs"
                        :key="errMsg"
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

      <v-row class="mt-6">
        <v-col class="d-flex justify-center">
          <v-btn
            id="submitButton"
            color="primary"
            type="submit"
            :append-icon="isSubmit && !formReady ? 'fa:fas fa-xmark' : ''"
          >
            Submit
          </v-btn>
        </v-col>
      </v-row>
      <v-row v-if="isSubmit && !formReady" dense>
        <v-col class="text-error d-flex justify-center">
          Please check the form and correct all errors before submitting.
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
import { LocalDate, TemporalAdjusters, DateTimeFormatter } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { IConfigValue } from '../common/types';
import axios from 'axios';
import { VFileInput } from 'vuetify/components';
import _ from 'lodash';

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
    requiredRules: [(v: string) => !!v || 'Complete this field.'],
    companyName: '',
    companyAddress: '',
    //fields
    naicsCode: null as any,
    employeeCountRange: null as any,
    startMonth: LocalDate.now().minusYears(1).monthValue() || undefined,
    startYear: LocalDate.now().minusYears(1).year(),
    endMonth: LocalDate.now().minusMonths(1).monthValue() || undefined,
    endYear: LocalDate.now().minusMonths(1).year(),
    reportYear: null,
    isSubmit: false, //whether or not the submit button has been pressed
    isProcessing: false,
    uploadFileValue: undefined as File[] | undefined,
    maxFileUploadSize: '',
    minStartDate: LocalDate.now()
      .minusYears(2)
      .with(TemporalAdjusters.firstDayOfMonth()),
    maxStartDate: LocalDate.now()
      .minusYears(1)
      .with(TemporalAdjusters.lastDayOfMonth()),
    minEndDate: LocalDate.now().minusYears(1).minusMonths(1).withDayOfMonth(1),
    maxEndDate: LocalDate.now()
      .minusMonths(1)
      .with(TemporalAdjusters.lastDayOfMonth()),
    months: [
      { title: 'January', value: 1 },
      { title: 'February', value: 2 },
      { title: 'March', value: 3 },
      { title: 'April', value: 4 },
      { title: 'May', value: 5 },
      { title: 'June', value: 6 },
      { title: 'July', value: 7 },
      { title: 'August', value: 8 },
      { title: 'September', value: 9 },
      { title: 'October', value: 10 },
      { title: 'November', value: 11 },
      { title: 'December', value: 12 },
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
    approvedRoute: null as string | null,
    reportStatus: null,
  }),
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
    formReady() {
      return (
        !!this.companyName &&
        !!this.companyAddress &&
        !!this.naicsCode &&
        !!this.employeeCountRange &&
        !!this.startMonth &&
        !!this.startYear &&
        !!this.endMonth &&
        !!this.endYear &&
        !!this.reportYear &&
        !!this.uploadFileValue &&
        this.uploadFileValue.length == 1
      );
    },
    uploadFileSize() {
      if (this.uploadFileValue?.length)
        return humanFileSize(this.uploadFileValue[0].size);
      return '';
    },
    startDate() {
      if (!this.startMonth) return;
      return LocalDate.of(this.startYear, this.startMonth, 1).format(
        dateFormatter,
      );
    },
    endDate() {
      if (!this.endMonth) return;
      return LocalDate.of(this.endYear, this.endMonth, 1)
        .with(TemporalAdjusters.lastDayOfMonth())
        .format(dateFormatter);
    },
    reportYearList() {
      return [LocalDate.now().year(), LocalDate.now().minusYears(1).year()];
    },
    startMonthList() {
      return this.months.map((month) => {
        const selected = LocalDate.of(this.startYear, month.value, 1);
        const disabled =
          selected.isBefore(this.minStartDate as LocalDate) ||
          selected.isAfter(this.maxStartDate as LocalDate);
        return { ...month, props: { disabled } };
      });
    },
    startYearList() {
      return _.range(this.minStartDate.year(), this.maxStartDate.year() + 1);
    },
    endMonthList() {
      return this.months.map((month) => {
        const selected = LocalDate.of(this.endYear, month.value, 1);
        const disabled =
          selected.isBefore(this.minEndDate as LocalDate) ||
          selected.isAfter(this.maxEndDate as LocalDate);
        return { ...month, props: { disabled } };
      });
    },
    endYearList() {
      return _.range(this.minEndDate.year(), this.maxEndDate.year() + 1);
    },
  },
  watch: {
    startMonth() {
      //automatically update the endMonth and endYear to be one year later
      if (!this.startDate) return;
      const end = LocalDate.parse(this.startDate).plusMonths(11);
      this.endMonth = end.monthValue();
    },
    startYear() {
      //automatically update the endMonth and endYear to be one year later
      if (!this.startDate) return;
      const end = LocalDate.parse(this.startDate).plusMonths(11);
      this.endMonth = end.monthValue();
      this.endYear = end.year();
      //if the selected endMonth is disabled, clear the field
      if (
        this.endMonthList.find((month) => month.value === this.endMonth)?.props
          .disabled
      )
        this.endMonth = undefined;
    },
    endMonth() {
      //automatically update the startMonth and startYear to be one year earlier
      if (!this.endDate) return;
      const start = LocalDate.parse(this.endDate).minusMonths(11);
      this.startMonth = start.monthValue();
    },
    endYear() {
      //automatically update the startMonth and startYear to be one year earlier
      if (!this.endDate) return;
      const start = LocalDate.parse(this.endDate).minusMonths(11);
      this.startMonth = start.monthValue();
      this.startYear = start.year();
      //if the selected startMonth is disabled, clear the field
      if (
        this.startMonthList.find((month) => month.value === this.startMonth)
          ?.props.disabled
      )
        this.startMonth = undefined;
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
    formReady(newVal) {
      if (newVal) this.isSubmit = false;
    },
  },
  beforeMount() {
    this.setStage('UPLOAD');
    this.loadConfig()
      ?.then((data) => {
        this.setMaxFileUploadSize(data as IConfigValue);
      })
      .catch(() => {
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
      this.isSubmit = true;
      if (!this.formReady) {
        throw 'form not ready';
      }
      this.isProcessing = true;
      let submission: ISubmission | null = null;

      try {
        // Parse the csv file, convert it into a json array, and perform
        // preliminary validation.
        const parseResponse: IParseSuccessResponse = await CsvService.parse(
          this.uploadFileValue![0],
        );

        // Preliminary validation of the input file passed, so prepare
        // the submission
        submission = {
          companyName: this.companyName,
          companyAddress: this.companyAddress,
          naicsCode: this.naicsCode,
          employeeCountRangeId: this.employeeCountRange,
          startDate: this.startDate!,
          endDate: this.endDate!,
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
        const draftReport = await ApiService.postSubmission(submission);
        await this.setReportInfo(draftReport as any);
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
};
</script>

<style lang="scss">
textarea::placeholder {
  text-align: right;
  transform: translateY(95px);
}

.file-success {
  background-color: #d9e7d8;
}
</style>
