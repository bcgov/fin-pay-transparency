<template>
  <v-container class="d-flex justify-center">

    <v-form ref="inputForm">
      <v-row class=" d-flex justify-center">
        <v-col xs="12" sm="10" md="8">

          <v-row class="pt-7">
            <v-col cols="12">
              <v-btn to="/">Back</v-btn>
            </v-col>
          </v-row>

          <!-- timeline -->
          <v-row class="pt-7 mb-4 d-flex justify-center">
            <v-col cols="10">

              <v-row>
                <v-col class="d-flex-col justify-center align-center">
                  <div class="circle">1</div>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <div class="dash disabled"></div>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <div class="circle disabled">2</div>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <div class="dash disabled"></div>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <div class="circle disabled">3</div>
                </v-col>
              </v-row>

              <v-row>
                <v-col class="d-flex-col justify-center align-center">
                  <h5>Upload</h5>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <h5>Review</h5>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <h5>Generate</h5>
                </v-col>
              </v-row>

            </v-col>
          </v-row>

          <v-row class="d-flex justify-start mt-12" dense>
            <v-col cols="12">
              <h2 class="text-center">Your Company Information</h2>
            </v-col>

            <v-col cols="12">
              <v-text-field id="companyName" ref="companyName" v-model="companyName" label="Company Name"
                :rules="requiredRules" required disabled></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field id="companyAddress" ref="companyAddress" v-model="companyAddress" :rules="requiredRules"
                label="Company Address" required disabled></v-text-field>
            </v-col>

            <v-col cols="12" class="d-flex">
              <v-autocomplete id="naicsCode" ref="naicsCode" v-model="naicsCode" :rules="requiredRules"
                :items="naicsCodes" :item-title="n => `${n.naics_code} - ${n.naics_label}`" label="NAICS Code"
                required></v-autocomplete>
              <v-icon color="error" icon="mdi-asterisk" size="x-small" v-if="!naicsCode"></v-icon>
            </v-col>

            <v-col cols="12" class="d-flex">
              <v-select id="employeeCountRange" ref="employeeCountRange" v-model="employeeCountRange"
                :rules="requiredRules" label="Employee Count Range" :items="employeeCountRanges"
                item-title="employee_count_range" required></v-select>
              <v-icon color="error" icon="mdi-asterisk" size="x-small" v-if="!employeeCountRange"></v-icon>
            </v-col>

            <v-col cols="6" class="d-flex">
              <VueDatePicker id="startDate" ref="startDate" v-model="startDate" model-type="yyyy-MM" month-picker
                auto-apply format="MMMM yyyy" placeholder="Start Date" input-class-name="datepicker-input"
                :min-date="minStartDate" :max-date="maxStartDate" prevent-min-max-navigation
                :action-row="{ showSelect: false, showCancel: false, showNow: false, showPreview: false }" />
              <v-icon color="error" icon="mdi-asterisk" size="x-small" v-if="!startDate"></v-icon>
            </v-col>

            <v-col cols="6" class="d-flex">
              <VueDatePicker id="endDate" ref="endDate" v-model="endDate" model-type="yyyy-MM" month-picker auto-apply
                format="MMMM yyyy" placeholder="End Date" input-class-name="datepicker-input" :min-date="minEndDate"
                :max-date="maxEndDate" prevent-min-max-navigation
                :action-row="{ showSelect: false, showCancel: false, showNow: false, showPreview: false }" />
              <v-icon color="error" icon="mdi-asterisk" size="x-small" v-if="!endDate"></v-icon>
            </v-col>

            <v-col cols="12" class="mt-6">
              <p class="text-subtitle-2">Please note any limitations, dependencies, or constraints with the payroll data
                which
                will appear at the
                bottom of the report</p>
              <v-textarea id="dataConstraints" v-model="dataConstraints" label="Data Constraints" maxlength="3000"
                clearable>
                <template v-slot:details>
                </template>
              </v-textarea>
            </v-col>

            <v-col cols="12" class="">
              <p class="text-subtitle-2">Other comments</p>
              <v-textarea id="comments" v-model="comments" label="Contextual Info/Comments" clearable>
              </v-textarea>
            </v-col>

            <v-col cols="12">
              <h3 class="mb-2">File Upload</h3>
              <p class="mb-4">
                To proceed, upload your employee data in comma-separated value (CSV) format. Ensure the CSV file follows
                the provided CSV template
                (<u>bc-pay-transparency-tool-data-template.csv</u>) for accurate processing.
              </p>
              <v-sheet class="pa-5" style="border-style: dashed; border: 3px dashed #666666; border-radius: 10px;">
                <div class="d-flex">
                  <v-file-input id="csvFile" v-model="uploadFileValue" color="#003366" :accept="fileAccept"
                    hint="Select a CSV file" :error-messages="fileInputError" placeholder="Select a CSV file"
                    :rules="requiredRules" />
                  <v-icon color="error" icon="mdi-asterisk" size="x-small" v-if="!uploadFileValue"></v-icon>
                </div>

                <p class="d-flex justify-center">
                  Supported format: CSV. Maximum file size: 8MB.
                </p>
              </v-sheet>
            </v-col>

          </v-row>

          <v-row class="mt-6">
            <v-col cols="12" class="d-flex justify-center" v-if="!areRequiredFieldsComplete">
              <v-icon color="error" icon="mdi-asterisk" size="x-small"></v-icon>
              Please complete all required fields
            </v-col>
            <v-col cols="12" class="d-flex justify-center">

              <primary-button id="submitButton" :disabled="!areRequiredFieldsComplete" :loading="isProcessing"
                text="Submit" :click-action="submit" />
            </v-col>
          </v-row>

          <v-row class="mt-3">
            <v-col>
              <v-alert v-if="alertMessage" dense outlined dismissible :class="alertType" class="mb-3">
                {{ alertMessage }}
              </v-alert>
            </v-col>
          </v-row>

          <v-row class="mt-3" v-if="submissionErrors">
            <v-col>
              <v-alert dense outlined dismissible class="bootstrap-error mb-3">
                <h4 class="mb-3">The submission contains errors which must be corrected.</h4>

                <!-- general errors related to the submission (either with the 
                  form fields or with the file itself) -->
                <v-table v-if="submissionErrors?.generalErrors" density="compact">
                  <tbody>
                    <tr v-for="generalError in submissionErrors.generalErrors">
                      <td class="text-left">
                        {{ generalError }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <!-- general errors related to contents of the file -->
                <v-table v-if="submissionErrors?.fileErrors?.generalErrors" density="compact">
                  <tbody>
                    <tr v-for="generalError in submissionErrors.fileErrors.generalErrors">
                      <td class="text-left">
                        {{ generalError }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <!-- errors related to the content of specific lines in the file -->
                <div v-if="submissionErrors?.fileErrors?.lineErrors">
                  <h4 class="mb-3">Please review the following lines from the uploaded file:
                  </h4>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th class="text-left">
                          Line
                        </th>
                        <th class="text-left">
                          Problem(s)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="lineError in submissionErrors.fileErrors.lineErrors" :key="lineError.lineNum">
                        <td class="text-left">{{ lineError.lineNum }}</td>
                        <td class="text-left ">
                          <span v-for="errMsg in lineError.errors" class="mr-2">
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

        </v-col>
      </v-row>

    </v-form>

  </v-container>
</template>
<script lang="ts">

import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import PrimaryButton from './util/PrimaryButton.vue';
import ApiService from '../common/apiService';
import { useCodeStore } from '../store/modules/codeStore';
import { authStore } from '../store/modules/auth';
import { mapState, } from 'pinia';
import moment from 'moment';

interface LineErrors {
  lineNum: number,
  errors: string[]
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

export default {
  components: {
    PrimaryButton,
    VueDatePicker
  },
  data: () => ({
    validForm: null,
    requiredRules: [v => !!v || 'Required'],
    companyName: '',
    companyAddress: '',
    naicsCode: null,
    naicsCodesTruncated: [],
    employeeCountRange: null,
    isProcessing: false,
    uploadFileValue: null,
    minStartDate: moment().subtract(2, "years").startOf("month").toDate(),
    maxStartDate: moment().subtract(1, "years").endOf("month").toDate(),
    minEndDate: moment().subtract(1, "years").subtract(1, "months").startOf("month").toDate(),
    maxEndDate: moment().subtract(1, "month").endOf("month").toDate(),
    startDate: moment().subtract(1, "years").format("yyyy-MM"),
    endDate: moment().subtract(1, "month").format("yyyy-MM"),
    dataConstraints: null,
    comments: null,
    fileAccept: '.csv',
    fileRules: [],
    fileInputError: [],
    alertMessage: null,
    alertType: null,
    submissionErrors: null as SubmissionErrors | null
  }),
  methods: {
    setSuccessAlert(alertMessage) {
      this.alertMessage = alertMessage;
      this.alertType = 'bootstrap-success';
    },
    setErrorAlert(submissionErrors: SubmissionErrors | null) {
      this.submissionErrors = submissionErrors;
    },
    async submit() {
      this.isProcessing = true;
      console.log('generate report');
      try {
        const formData = new FormData();
        formData.append('companyName', this.companyName);
        formData.append('companyAddress', this.companyAddress);
        formData.append('naicsCode', this.naicsCode);
        formData.append('employeeCountRange', this.employeeCountRange);
        formData.append('startDate', this.startDate);
        formData.append('endDate', this.endDate);
        formData.append('dataConstraints', this.dataConstraints);
        formData.append('comments', this.comments);
        formData.append('file', this.uploadFileValue[0]);
        const oldBody = {
          companyName: this.companyName,
          companyAddress: this.companyAddress,
          employeeCount: this.employeeCount,
          file: this.uploadFileValue[0],
        }
        const response = await ApiService.postSubmission(formData);
        console.log(response);
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
        try {
          if (this.uploadFileValue[0].name && this.uploadFileValue[0].name.match('^[\\u0080-\\uFFFF\\w,\\s-_]+\\.[A-Za-z]{3,4}$')) {
            this.active = true;
            const reader = new FileReader();
            reader.onload = this.uploadFile;
            reader.onabort = this.handleFileReadErr;
            reader.onerror = this.handleFileReadErr;
            reader.readAsBinaryString(this.uploadFileValue[0]);
          } else {
            this.active = false;
            this.setErrorAlert({
              general_errors: ["Please remove spaces and special characters from file name and try uploading again."]
            });
          }
        } catch (e) {

          throw e;
        }
      }
    },
  },
  watch: {
    naicsCodes(val) {
      this.naicsCodesTruncated = val?.length > 25 ? val.slice(0, 25) : val
    },
    startDate(newVal) {
      // When the startDate changes, automatically adjust the endDate to be
      // 12 months later
      if (newVal) {
        const startDate = moment(newVal)
        const endDate = moment(newVal).add(1, 'years').subtract(1, 'months')
        this.endDate = endDate.format("yyyy-MM");
      }
    },
    endDate(newVal) {
      // When the endDate changes, automatically adjust the startDate to be
      // 12 months earlier
      if (newVal) {
        const endDate = moment(newVal)
        const startDate = moment(newVal).subtract(1, 'years').add(1, 'months')
        this.startDate = startDate.format("yyyy-MM");
      }
    },
    userInfo: {
      // Watch for changes to userInfo (from the authStore).  Copy company name
      // and address from that object into state variables in this component.
      immediate: true,
      handler(userInfo) {
        this.companyName = userInfo?.legalName;
        const address = `${userInfo?.addressLine1 ? userInfo?.addressLine1 : ""} ${userInfo?.addressLine2 ? userInfo?.addressLine2 : ""}`.trim();
        this.companyAddress = address;
      }
    },
  },
  computed: {
    ...mapState(useCodeStore, [
      'employeeCountRanges',
      'naicsCodes'
    ]),
    ...mapState(authStore, ['userInfo']),
    dataReady() {
      return this.validForm && this.uploadFileValue;
    },
    fromDateDisp() {
      return this.fromDateVal;
    },
    areRequiredFieldsComplete() {
      return !!this.companyName &&
        !!this.companyAddress &&
        !!this.naicsCode &&
        !!this.employeeCountRange &&
        !!this.startDate &&
        !!this.endDate &&
        !!this.uploadFileValue
    }
  }
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

.circle {
  height: 60px;
  width: 60px;
  background-color: #003366;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  &.disabled {
    background-color: #aaaaaa;
  }
}

.dash {
  height: 1px;
  width: 100%;
  background-color: #003366;
  padding-left: 5px;
  padding-right: 5px;

  &.disabled {
    background-color: #aaaaaa;
  }
}
</style>