<template>
  <v-container class="undized">
    <v-row no-gutters>
      <v-col cols="12">
        <v-container class="justify-center">
          <v-row no-gutters>
            <v-col>

              <p class="text-welcome mt-14 mb-8 centered-text">
                Welcome to the Pay Transparency Reporting Tool
              </p>
              <p class="text-subtitle-2 mb-10">
                In British Columbia, if you are a provincially regulated employer above a certain size, you are required to complete and post a pay transparency report on all your B.C. employees by November 1st of each year.  This portal enables you to easily create a pay transparency report as required under the <a target="_blank" href="https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/23018">Pay Transparency Act</a> and <a target="_blank" href="https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/225_2023">Regulation</a>. 
                <ul class="ml-8 mt-4 mb-4">
                  <li>2024: all employers with 1,000 employees or more will be required to begin posting annual pay transparency reports</li>
                  <li>2025: all employers with 300 employees or more will be required to begin posting annual pay transparency reports</li>
                  <li>2026: all employers with 50 employees or more will be required to begin posting annual pay transparency reports</li>
                </ul>
                Below is an overview of the three steps required to produce your pay transparency report. For additional information please visit <a target="_blank" href="https://www2.gov.bc.ca/gov/content/gender-equity/pay-transparency-laws-in-bc">Pay Transparency Laws in B.C.</a>
              </p>
              <p class="text-caption">This application does not collect, record or publish personal information.</p>
              <v-btn
                id="login-button"
                color="primary"
                class="mb-8"
                @click="clearStorageAndRedirectToLogin"
              >
                Log In with Business BCeID<v-icon>mdi-login</v-icon>
              </v-btn>  

            </v-col>
          </v-row>
        </v-container>  
      </v-col>
    </v-row>
    <v-row no-gutters class="grey-div">
      <v-col>
        <v-container class="justify-center">
          <v-row no-gutters>
            <v-col>
              <h3 class="centered-text mt-14 mb-8">
                How to use the tool
              </h3>
            </v-col>
          </v-row>
          <v-row class="mb-4 d-flex justify-center w-100">
            <v-col class="w-100">

              <v-row>
                <v-col class="d-flex justify-center align-center">                                    
                  <div class="circle" :class="{ active: stage == 'UPLOAD', disabled: stage != 'UPLOAD'  }" v-on:click="changeStage('UPLOAD')">1</div>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <div class="circle" :class="{ active: stage == 'REVIEW', disabled: stage != 'REVIEW' }" v-on:click="changeStage('REVIEW')">2</div>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <div class="circle" :class="{ active: stage == 'GENERATE', disabled: stage != 'GENERATE' }" v-on:click="changeStage('GENERATE')">3</div>
                </v-col>
              </v-row>

              <v-row>
                <v-col class="d-flex justify-center align-center">
                  <h5>Upload</h5>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <h5>Review</h5>
                </v-col>
                <v-col class="d-flex justify-center align-center">
                  <h5>Generate</h5>
                </v-col>
              </v-row>

              <v-row>
                <v-col class="d-flex no-padding">
                  <div class="progress-dash" :class="{ disabled: stage != 'UPLOAD' }"></div>
                </v-col>
                <v-col class="d-flex no-padding">
                  <div class="progress-dash" :class="{ disabled: stage != 'REVIEW' }"></div>
                </v-col>
                <v-col class="d-flex no-padding">
                  <div class="progress-dash" :class="{ disabled: stage != 'GENERATE' }"></div>
                </v-col>
              </v-row>   

              <v-row>
                <v-col class="d-flex justify-center align-center no-padding">
                  <div class="triangle-down" :class="{ disabled: stage != 'UPLOAD' }"></div>
                </v-col>
                <v-col class="d-flex justify-center align-center no-padding">
                  <div class="triangle-down" :class="{ disabled: stage != 'REVIEW' }"></div>
                </v-col>
                <v-col class="d-flex justify-center align-center no-padding">
                  <div class="triangle-down" :class="{ disabled: stage != 'GENERATE' }"></div>
                </v-col>
              </v-row>

              <v-row class="mt-8 mb-2">
                <v-col class="d-flex justify-center pt-10">
                  
                  <div v-show="stage == 'UPLOAD'">
                    <h3 class="mb-4">Upload your company's data</h3>
                    <p class="mb-8">
                      Please review the <a target="_blank" href="https://www2.gov.bc.ca/assets/gov/british-columbians-our-governments/services-policies-for-government/gender-equity/guidance-for-pay-gap-reporting-nov-03-2023.pdf">Guidance for Preparing Pay Transparency Reports</a> to ensure you understand what must be in your report. You will also be able to include general information about your organization and any constraints or limitations with your data (i.e. no overtime hours permitted).  When you are ready, upload a file of your employee data in comma-separated value (CSV) format.  
                    </p>
                    <v-btn>Download sample CSV</v-btn>
                  </div>
                  <p v-show="stage == 'REVIEW'">
                    <h3 class="mb-4">Review and validate</h3>
                    <p class="mb-8">
                      Please carefully review any error messages and confirm the information you provided is accurate before moving forward.  The <a target="_blank" href="https://www2.gov.bc.ca/assets/gov/british-columbians-our-governments/services-policies-for-government/gender-equity/guidance-for-pay-gap-reporting-nov-03-2023.pdf">Guidance for Preparing Pay Transparency Reports</a> details what must be included in your report.
                    </P>
                  </p>
                  <p v-show="stage == 'GENERATE'">
                    <h3 class="mb-4">Generate your report</h3>
                    <p class="mb-8">
                      You will now be able to download and review a draft version of your report. Draft reports are not saved in the system. Once your report is finalized, it will be available in the system in your employer profile for retrieval and distribution.
                    </p>
                    <v-btn>View sample report</v-btn>
                  </p>                                    
                </v-col>
                <v-col class="d-flex justify-center aligned-right no-padding">
                  <img
                      class="image-monitor"
                      width="562px"
                      height="370px"
                      tabindex="-1"
                      :src="imageSource"
                      alt="Monitor"
                  >  
                </v-col>
              </v-row>               

            </v-col>
          </v-row>        
        </v-container>  

      </v-col>
    </v-row>  
  </v-container>
</template>

<script>
import { authStore } from '../store/modules/auth';
import { mapState } from 'pinia';
import { AuthRoutes } from '../utils/constant';
import { sanitizeUrl } from '@braintree/sanitize-url';

import uploadpng from "../assets/images/upload_screen.png"
import generatepng from "../assets/images/generate_screen.png"
import reviewpng from "../assets/images/review_screen.png"

export default {
  name: 'Login',
  components: {

  },
  data() {
    return {
      appTitle: 'Pay Transparency Reporting',
      authRoutesLogin: sanitizeUrl(AuthRoutes.LOGIN_BCEID),
      stage: "UPLOAD",
      imageSource: uploadpng
    };
  },
  computed: {
    ...mapState(authStore, ['isAuthenticated']),
  },
  methods: {
    clearStorageAndRedirectToLogin() {
      authStore().setJwtToken();
      window.location.href = this.authRoutesLogin;
    },
    changeStage: function(newstage) {
      switch(newstage) {
        case 'GENERATE':
          this.stage = 'GENERATE';
          this.imageSource = generatepng;
          break;
        case 'REVIEW':
          this.stage = 'REVIEW';
          this.imageSource = reviewpng;
          break;
        case 'UPLOAD':
          this.stage = 'UPLOAD';
          this.imageSource = uploadpng;
          break;
      }
    }
  }
};
</script>

<style scoped>
  .image-monitor {
    border-style: none;
    margin-left: auto;   
  }

  .full-height{
    height: 100%;
  }

  .centered-text{
    text-align: center;
  }

  .top-text {
    vertical-align: top;
  }  

  .no-padding {
    padding: 0;
  }

  .aligned-right {
    text-align: right;
  }

  .progress-dash {
    height: 3px;
    width: 100%;
    background-color: #003366;
  }

  .triangle-down {
    width: 0; 
    height: 0; 
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-top: 15px solid #003366;
  }

  .progress-dash.disabled {
      background-color: #aaaaaa;
  }  

  .triangle-down.disabled {
      display: none;
  }   

  .circle.disabled {
      background-color: #aaaaaa;
      cursor: pointer;
  }  

  .text-welcome {
    font-size: 1.6em;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    font-weight: 600;
  }

  .grey-div {
    background: #8080801c;
    height: 100%;
  }

  .undized {
    margin: 0;
    padding: 0;
    min-width: 100%;
    max-width: 100%;
    height: 100%;
    overflow: hidden; 
    word-wrap: break-word;
  }
</style>
