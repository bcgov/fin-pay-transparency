<template>
  <v-row no-gutters>
    <v-col cols="12">
      <v-container>
        <v-row no-gutters>
          <v-col>
            <!-- begin -->
            <h4 class="text-welcome mt-14 mb-8 centered-text">
              Welcome to the Pay Transparency Reporting Tool
            </h4>
            <p class="text-subtitle-2">
              In British Columbia, if you are a provincially regulated employer
              above a certain size, you are required to complete and post a pay
              transparency report by November 1st of each year through a phased
              approach:
            </p>
            <ul class="ml-8 mt-4 mb-4">
              <li>2024: all employers with 1,000 employees or more</li>
              <li>2025: all employers with 300 employees or more</li>
              <li>2026: all employers with 50 employees or more</li>
            </ul>
            <p class="text-subtitle-2 mb-2">
              This tool enables you to easily create a pay transparency report
              as required under the
              <a
                target="_blank"
                rel="noopener noreferrer"
                :href="sanitizeUrl(frontendConfig.PAY_TRANSPARENCY_ACT_URL)"
                >Pay Transparency Act</a
              >
              and
              <a
                target="_blank"
                rel="noopener noreferrer"
                :href="
                  sanitizeUrl(frontendConfig.PAY_TRANSPARENCY_REGULATION_URL)
                "
                >Regulation</a
              >.
            </p>
            <p class="text-subtitle-2 mb-4">
              Below is an overview of the three steps required to produce your
              pay transparency report. For additional information please visit
              <a
                target="_blank"
                rel="noopener noreferrer"
                :href="sanitizeUrl(frontendConfig.PAY_TRANSPARENCY_HOME_URL)"
                >Pay Transparency in B.C.</a
              >
            </p>
            <v-btn
              id="login-button"
              class="btn-primary"
              data-testid="login-button"
              title="Login"
              @click="clearStorageAndRedirectToLogin"
            >
              Log In with Business BCeID<v-icon>mdi-login</v-icon>
            </v-btn>
            <p class="text-caption mt-2 mb-8">
              This tool does not collect, record or publish personal
              information.
            </p>
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
            <h3 class="centered-text mt-14 mb-8">How to use the tool</h3>
          </v-col>
        </v-row>
        <v-row class="mb-4 d-flex justify-center w-100">
          <v-col class="w-100">
            <v-row>
              <v-col class="d-flex justify-center align-center">
                <button
                  aria-label="Upload"
                  class="circle"
                  :class="{
                    active: stage == 'UPLOAD',
                    available: stage != 'UPLOAD',
                  }"
                  @click="changeStage('UPLOAD')"
                >
                  1
                </button>
              </v-col>
              <v-col class="d-flex justify-center align-center">
                <button
                  aria-label="Review"
                  class="circle"
                  :class="{
                    active: stage == 'REVIEW',
                    available: stage != 'REVIEW',
                  }"
                  @click="changeStage('REVIEW')"
                >
                  2
                </button>
              </v-col>
              <v-col class="d-flex justify-center align-center">
                <button
                  aria-label="Generate"
                  class="circle"
                  :class="{
                    active: stage == 'GENERATE',
                    available: stage != 'GENERATE',
                  }"
                  @click="changeStage('GENERATE')"
                >
                  3
                </button>
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
                <div
                  class="progress-dash"
                  :class="{ disabled: stage != 'UPLOAD' }"
                ></div>
              </v-col>
              <v-col class="d-flex no-padding">
                <div
                  class="progress-dash"
                  :class="{ disabled: stage != 'REVIEW' }"
                ></div>
              </v-col>
              <v-col class="d-flex no-padding">
                <div
                  class="progress-dash"
                  :class="{ disabled: stage != 'GENERATE' }"
                ></div>
              </v-col>
            </v-row>

            <v-row>
              <v-col class="d-flex justify-center align-center no-padding">
                <div
                  class="triangle-down"
                  :class="{ disabled: stage != 'UPLOAD' }"
                ></div>
              </v-col>
              <v-col class="d-flex justify-center align-center no-padding">
                <div
                  class="triangle-down"
                  :class="{ disabled: stage != 'REVIEW' }"
                ></div>
              </v-col>
              <v-col class="d-flex justify-center align-center no-padding">
                <div
                  class="triangle-down"
                  :class="{ disabled: stage != 'GENERATE' }"
                ></div>
              </v-col>
            </v-row>

            <v-row class="mt-8 mb-2">
              <v-col class="d-flex justify-center pt-10">
                <div v-show="stage == 'UPLOAD'">
                  <h3 class="mb-4">Upload your company's data</h3>
                  <p class="mb-8">
                    Please review the
                    <a
                      target="_blank"
                      rel="noopener"
                      :href="
                        sanitizeUrl(
                          frontendConfig.GUIDANCE_FOR_REPORTING_PDF_URL,
                        )
                      "
                      >Guidance for Preparing Pay Transparency Reports</a
                    >
                    to ensure you understand what must be in your report. You
                    will also be able to include general information about your
                    organization and any constraints or limitations with your
                    data (For example: At ____, no overtime hours are
                    permitted). When you are ready, upload a file of your
                    employee data in comma-separated value (CSV) format.
                  </p>
                  <v-btn class="btn-secondary" href="SampleCsv.csv" download>
                    Download sample CSV
                  </v-btn>
                </div>
                <div v-show="stage == 'REVIEW'">
                  <h3 class="mb-4">Review and validate</h3>
                  <p class="mb-8">
                    Please carefully review any error messages and confirm the
                    information you provided is accurate before moving forward.
                    The
                    <a
                      target="_blank"
                      rel="noopener"
                      :href="
                        sanitizeUrl(
                          frontendConfig.GUIDANCE_FOR_REPORTING_PDF_URL,
                        )
                      "
                      >Guidance for Preparing Pay Transparency Reports</a
                    >
                    details what must be included in your report.
                  </p>
                </div>
                <div v-show="stage == 'GENERATE'">
                  <h3 class="mb-4">Generate your report</h3>
                  <p class="mb-8">
                    You will now be able to download and review a draft version
                    of your report. Draft reports are not saved in the system.
                    Once your report is finalized, it will be available in the
                    system in your employer profile for retrieval and
                    distribution.
                  </p>
                  <v-btn class="btn-secondary" href="SampleReport.pdf" download>
                    View sample report
                  </v-btn>
                </div>
              </v-col>
              <v-col class="d-flex justify-center aligned-right no-padding">
                <img
                  class="image-monitor"
                  width="562px"
                  height="370px"
                  tabindex="-1"
                  :src="imageSource"
                  alt="Monitor"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-col>
  </v-row>
</template>

<script>
import { authStore } from '../store/modules/auth';
import { mapState } from 'pinia';
import { AuthRoutes } from '../utils/constant';
import { sanitizeUrl } from '@braintree/sanitize-url';

import uploadpng from '../assets/images/upload_screen.png';
import generatepng from '../assets/images/generate_screen.png';
import reviewpng from '../assets/images/review_screen.png';

export default {
  name: 'Login',
  components: {},
  data() {
    return {
      appTitle: 'Pay Transparency Reporting',
      authRoutesLogin: sanitizeUrl(AuthRoutes.LOGIN_BCEID),
      stage: 'UPLOAD',
      imageSource: uploadpng,
      frontendConfig: window.config,
    };
  },
  computed: {
    ...mapState(authStore, ['isAuthenticated']),
  },
  methods: {
    sanitizeUrl: sanitizeUrl,
    clearStorageAndRedirectToLogin() {
      authStore().setJwtToken();
      window.location.href = this.authRoutesLogin;
    },
    changeStage: function (newstage) {
      switch (newstage) {
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
    },
  },
};
</script>

<style scoped lang="scss">
.image-monitor {
  border-style: none;
  margin-left: auto;
}

.full-height {
  height: 100%;
}

.centered-text {
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

.circle {
  height: 60px;
  width: 60px;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  &.available {
    background-color: #00336633;
    cursor: pointer;
  }

  &.active {
    background-color: #003366;
    cursor: pointer;
  }

  &.disabled {
    background-color: #aaaaaa;
    cursor: not-allowed;
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
</style>
