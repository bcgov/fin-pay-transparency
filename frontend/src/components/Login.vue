<template>
  <v-container class="undized">
    <v-row no-gutters>
      <v-col cols="12">
        <v-container class="justify-center">
          <v-row no-gutters>
            <v-col>

              <p class="text-welcome mt-14 mb-8">
                Pay Transparency Reporting tool consectetur adipiscing elit. Etiam dictum ultrices purus, ac malesuada leo congue vel.
              </p>
              <p class="text-subtitle-2 mb-10">
                Introducing the Pay Transparency Reporting tool, onsectetur adipiscing elit. Ut fermentum tortor ut ultricies placerat. Nam eu leo lacus. Quisque id tempor arcu. Ut fermentum tortor ut ultricies placer, visit <u>Pay Transparency Laws in B.C.</u>
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
              <p class="text-welcome centered-text mt-14 mb-8">
                How to use the tool
              </p>
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
                <v-col class="d-flex justify-center pt-14">
                  
                  <div v-show="stage == 'UPLOAD'">
                    <h3 class="mb-4">Upload your company's data</h3>
                    <p class="mb-8">Introducing the Pay Transparency Reporting tool, onsectetur adipiscing elit. Ut fermentum tortor ut ultricies placerat. Nam eu leo lacus. Quisque id tempor arcu. Ut fermentum tortor ut ultricies placer, visit <u>Pay Transparency Laws in B.C.</u></p>
                    <v-btn>Download sample CSV</v-btn>
                  </div>
                  <p v-show="stage == 'REVIEW'">
                    <h3 class="mb-4">Review and validate</h3>
                    Introducing the Pay Transparency Reporting tool, onsectetur adipiscing elit. Ut fermentum tortor ut ultricies placerat. Nam eu leo lacus. Quisque id tempor arcu. Ut fermentum tortor ut ultricies placer, visit <u>Pay Transparency Laws in B.C.</u>
                  </p>
                  <p v-show="stage == 'GENERATE'">
                    <h3 class="mb-4">Generate your report</h3>
                    <p class="mb-8">Introducing the Pay Transparency Reporting tool, onsectetur adipiscing elit. Ut fermentum tortor ut ultricies placerat. Nam eu leo lacus. Quisque id tempor arcu. Ut fermentum tortor ut ultricies placer, visit <u>Pay Transparency Laws in B.C.</u></p>
                    <v-btn>View sample report</v-btn>
                  </p>                                    
                </v-col>
                <v-col class="d-flex justify-center aligned-right no-padding">
                  <img
                      class="image-monitor"
                      width="600px"
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

export default {
  name: 'Login',
  components: {

  },
  data() {
    return {
      appTitle: 'Pay Transparency Reporting',
      authRoutesLogin: sanitizeUrl(AuthRoutes.LOGIN_BCEID),
      stage: "UPLOAD",
      imageSource: "../assets/images/upload_screen.png"
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
          this.imageSource = "../assets/images/generate_screen.png";
          break;
        case 'REVIEW':
          this.stage = 'REVIEW';
          this.imageSource = "../assets/images/review_screen.png";
          break;
        case 'UPLOAD':
          this.stage = 'UPLOAD';
          this.imageSource = "../assets/images/upload_screen.png";
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
    font-size: 1.4em;
    margin-block-start: 1em;
    margin-block-end: 1em;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    font-weight: 500;
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
