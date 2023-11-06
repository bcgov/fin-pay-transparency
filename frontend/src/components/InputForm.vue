<template>
  <v-container class="d-flex justify-center">
    <v-alert v-model="alert" dense outlined dismissible :class="alertType" class="mb-3">
      {{ alertMessage }}
    </v-alert>
    <v-form ref="generateReportForm" v-model="validForm">

      <v-row class="d-flex justify-center">
        <v-col xs="12" sm="10" md="8">

          <v-row class="pt-7">
            <v-col cols="12">
              <v-btn to="/">Back</v-btn>
            </v-col>
          </v-row>

          <!-- timeline -->
          <v-row class="pt-7 mb-4">
            <v-col cols="12">

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

          <v-row class="d-flex justify-start" dense>
            <v-col cols="12">
              <h2 class="text-center">Your Company Information</h2>
            </v-col>

            <v-col cols="12">
              <v-text-field id="companyName" v-model="companyName" label="Company Name" :rules="requiredRules"
                required></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-text-field id="companyAddress" v-model="companyAddress" :rules="requiredRules" label="Company Address"
                required></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-autocomplete id="naicsCode" v-model="naicsCode" :items="naicsCodeList"
                label="NAICS Code"></v-autocomplete>
            </v-col>

            <v-col cols="12">
              <v-select id="employeeCount" v-model="employeeCount" :rules="requiredRules" label="Employee Range Count"
                :items="['50-299', '300-999', '1000+',]" required></v-select>
            </v-col>

            <v-col cols="6">
              <VueDatePicker id="startDate" ref="startDate" v-model="startDate" model-type="yyyy-MM" month-picker
                auto-apply format="MMMM yyyy" placeholder="Start Date" input-class-name="datepicker-input"
                :min-date="minStartDate" :max-date="maxStartDate" prevent-min-max-navigation
                :action-row="{ showSelect: false, showCancel: false, showNow: false, showPreview: false }" />
            </v-col>

            <v-col cols="6">
              <VueDatePicker id="endDate" ref="endDate" v-model="endDate" model-type="yyyy-MM" month-picker auto-apply
                format="MMMM yyyy" placeholder="End Date" input-class-name="datepicker-input" :min-date="minEndDate"
                :max-date="maxEndDate" prevent-min-max-navigation
                :action-row="{ showSelect: false, showCancel: false, showNow: false, showPreview: false }" />
            </v-col>

            <v-col cols="12" class="mt-6">
              <v-textarea id="comments" v-model="comments" label="Contextual Info/Comments" clearable></v-textarea>
            </v-col>

            <v-col cols="12">
              <h3 class="mb-2">File Upload</h3>
              <p class="mb-4">
                To proceed, upload your employee data in comma-separated value (CSV) format. Ensure the CSV file follows
                the provided CSV template
                (<u>bc-pay-transparency-tool-data-template.csv</u>) for accurate processing.
              </p>
              <v-sheet class="pa-5" style="border-style: dashed; border: 3px dashed #666666; border-radius: 10px;">
                <v-file-input id="csvFile" v-model="uploadFileValue" color="#003366" :accept="fileAccept"
                  hint="CSV File supported" :error-messages="fileInputError" placeholder="Select your file"
                  :rules="fileRules" />

                <p class="d-flex justify-center">
                  Supported format: CSV. Maximum file size: xxMB.
                </p>
              </v-sheet>
            </v-col>

          </v-row>

          <v-row>
            <v-col cols="12" class="d-flex justify-center">
              <primary-button id="submitButton" :disabled="!validForm" :loading="isProcessing" text="Submit"
                :click-action="submit" />
            </v-col>
          </v-row>

        </v-col>
      </v-row>

    </v-form>

  </v-container>
</template>
<script>

import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import PrimaryButton from './util/PrimaryButton.vue';
import ApiService from '../common/apiService';
import moment from 'moment';

export default {
  components: {
    PrimaryButton,
    VueDatePicker
  },
  data: () => ({
    validForm: false,
    requiredRules: [v => !!v || 'Required'],
    companyName: '',
    companyAddress: '',
    naicsCode: null,
    naicsCodeList: ["2342"],
    employeeCount: null,
    isProcessing: false,
    uploadFileValue: null,
    minStartDate: moment().subtract(2, "years").format("yyyy-MM"),
    maxStartDate: moment().subtract(1, "years").format("yyyy-MM"),
    minEndDate: moment().subtract(1, "years").format("yyyy-MM"),
    maxEndDate: moment().format("yyyy-MM"),
    startDate: moment().subtract(1, "years").format("yyyy-MM"),
    endDate: moment().subtract(1, "month").format("yyyy-MM"),
    comments: null,
    fileAccept: '.csv',
    fileRules: [],
    fileInputError: [],
    alert: false,
    alertMessage: null,
    alertType: null,
  }),
  methods: {
    setSuccessAlert(alertMessage) {
      this.alertMessage = alertMessage;
      this.alertType = 'bootstrap-success';
      this.alert = true;
    },
    setErrorAlert(alertMessage) {
      this.alertMessage = alertMessage;
      this.alertType = 'bootstrap-error';
      this.alert = true;
    },
    async submit() {
      this.isProcessing = true;
      console.log('generate report');
      try {
        const response = await ApiService.apiAxios.post('/api/v1/file-upload', {
          companyName: this.companyName,
          companyAddress: this.companyAddress,
          employeeCount: this.employeeCount,
          file: this.uploadFileValue[0],
        });
        console.log(response);
        this.setSuccessAlert('Report generated successfully');
        this.isProcessing = false;
      } catch (error) {
        console.error(error);
        this.isProcessing = false;
        this.setErrorAlert(error.response.data.message);
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
            this.setErrorAlert('Please remove spaces and special characters from file name and try uploading again.');
          }
        } catch (e) {

          throw e;
        }
      }
    },
  },
  watch: {
    startDate(newVal) {
      /* When the startDate changes, automatically adjust the endDate to be
      12 months later */
      if (newVal) {
        const startDate = moment(newVal)
        const endDate = moment(newVal).add(1, 'years').subtract(1, 'months')
        this.endDate = endDate.format("yyyy-MM");
      }
    },
    endDate(newVal) {
      /* When the endDate changes, automatically adjust the startDate to be
      12 months earlier */
      if (newVal) {
        const endDate = moment(newVal)
        const startDate = moment(newVal).subtract(1, 'years').add(1, 'months')
        this.startDate = startDate.format("yyyy-MM");
      }
    }
  },
  computed: {
    dataReady() {
      return this.validForm && this.uploadFileValue;
    },
    fromDateDisp() {
      return this.fromDateVal;
    },
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