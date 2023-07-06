<template>

  <v-container class="d-flex justify-center">
    <v-alert
        v-model="alert"
        dense
        outlined
        dismissible
        :class="alertType"
        class="mb-3"
    >
      {{ alertMessage }}
    </v-alert>
    <v-form ref="generateReportForm" v-model="validForm">
      <v-row no-gutters class="d-flex flex-column">
        <v-row class="d-flex justify-start ">
          <v-col cols="12">
            <h2 class="text-center">Generate Report</h2>
          </v-col>
          <v-col cols="12"
                 class="d-flex justify-center"
          >
            <v-text-field
                id="companyNameField"
                v-model="companyName"
                label="Company Name "
                :rules="requiredRules"
                required
            ></v-text-field>
          </v-col>

          <v-col cols="12"
                 class="d-flex justify-center"
          >
            <v-text-field
                id="addressField"
                v-model="companyAddress"
                :rules="requiredRules"
                label="Address"
                required
            ></v-text-field>
          </v-col>

          <v-col cols="4"
                 class="d-flex justify-center"
          >
            <v-text-field
                id="employeeCount"
                v-model="employeeCount"
                :rules="requiredRules"
                label="Number of Employees"
                required
            ></v-text-field>
          </v-col>
          <v-col>
            <v-file-input
                id="selectFileInput"
                v-model="uploadFileValue"
                color="#003366"
                variant="underlined"
                :accept="fileAccept"
                hint="CSV File supported"
                :error-messages="fileInputError"
                placeholder="Select your file"
                :rules="fileRules"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12"
                 class="d-flex justify-center"
          >
            <primary-button
                id="generateReportButton"
                :disabled="!validForm"
                :loading="isProcessing"
                text="Generate Report" :click-action="generateReport"
            />
          </v-col>
        </v-row>
      </v-row>
    </v-form>

  </v-container>

</template>
<script>
import PrimaryButton from './util/PrimaryButton.vue';
import ApiService from '../common/apiService';

export default {
  components: {PrimaryButton},
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
    alertType: null
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
    async generateReport() {
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
  computed: {
    dataReady() {
      return this.validForm && this.uploadFileValue;
    },
  }
};
</script>
