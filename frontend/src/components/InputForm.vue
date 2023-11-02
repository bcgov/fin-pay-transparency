<template>
  <v-container class="d-flex justify-center">
    <v-alert v-model="alert" dense outlined dismissible :class="alertType" class="mb-3">
      {{ alertMessage }}
    </v-alert>
    <v-form ref="generateReportForm" v-model="validForm">
      <v-row no-gutters class="d-flex flex-column">
        <v-row class="pt-7">
          <v-btn to="/">Back</v-btn>
        </v-row>
        <v-row class="d-flex justify-start">
          <v-col cols="12">
            <h2 class="text-center">Upload</h2>
          </v-col>
          <v-col cols="12" class="d-flex justify-center">
            <v-text-field id="companyNameField" v-model="companyName" label="Company Name " :rules="requiredRules"
              required></v-text-field>
          </v-col>

          <v-col cols="12" class="d-flex justify-center">
            <v-text-field id="addressField" v-model="companyAddress" :rules="requiredRules" label="Address"
              required></v-text-field>
          </v-col>

          <v-col cols="12" class="d-flex justify-center">
            <v-select id="employeeCount" v-model="employeeCount" :rules="requiredRules" chips label="Employee Range Count"
              :items="['1000+ more', '300-999', '50-299']" required></v-select>
          </v-col>

          <v-col cols="6">
            <VueDatePicker v-model="startDate" model-type="yyyy-MM" month-picker auto-apply format="MMMM yyyy"
              placeholder="Start date" input-class-name="datepicker-input"
              :action-row="{ showSelect: false, showCancel: false, showNow: false, showPreview: false }" />
          </v-col>

          <v-col cols="6">
            <VueDatePicker v-model="endDate" model-type="yyyy-MM" month-picker auto-apply format="MMMM yyyy"
              placeholder="End date" input-class-name="datepicker-input"
              :action-row="{ showSelect: false, showCancel: false, showNow: false, showPreview: false }" />
          </v-col>

          <v-col cols="12">
            <v-file-input id="selectFileInput" v-model="uploadFileValue" color="#003366" variant="underlined"
              :accept="fileAccept" hint="CSV File supported" :error-messages="fileInputError"
              placeholder="Select your file" :rules="fileRules" />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="d-flex justify-center">
            <primary-button id="submitButton" :disabled="!validForm" :loading="isProcessing" text="Submit"
              :click-action="submit" />
          </v-col>
        </v-row>
      </v-row>
    </v-form>

  </v-container>
</template>
<script>

import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css'
import PrimaryButton from './util/primarybutton.vue';
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
    employeeCount: '',
    isProcessing: false,
    uploadFileValue: null,
    fileAccept: '.csv',
    fileRules: [],
    fileInputError: [],
    alert: false,
    alertMessage: null,
    alertType: null,
    earliestSelectableDate: new Date().setFullYear(new Date().getFullYear() - 2),
    startDate: null,
    endDate: null,
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
/* style the vue-datepicker component to closely match the Vuetify components */
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