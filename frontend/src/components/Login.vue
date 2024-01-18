<template>

<v-container class="unbastardized">
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
      <v-container class="unbastardized">
        <v-row no-gutters>
          <v-col>
            <p class="text-welcome mt-14 mb-8">
              Pay Transparency Reporting tool consectetur adipiscing elit. Etiam dictum ultrices purus, ac malesuada leo congue vel.
            </p>
          </v-col>
        </v-row>
      </v-container>  
    </v-col>
  </v-row>  
</v-container>

<!--
<div class="row">

            <p class="text-welcome mt-14 mb-8">
              Pay Transparency Reporting tool consectetur adipiscing elit. Etiam dictum ultrices purus, ac malesuada leo congue vel.
            </p>
            <p class="text-subtitle-2 mb-10">
              Introducing the Pay Transparency Reporting tool, onsectetur adipiscing elit. Ut fermentum tortor ut ultricies placerat. Nam eu leo lacus. Quisque id tempor arcu. Ut fermentum tortor ut ultricies placer, visit <u>Pay Transparency Laws in B.C.</u>
            </p>
            <v-btn
              id="login-button"
              color="primary"
              class="mb-8"
              @click="clearStorageAndRedirectToLogin"
            >
              Log In with Business BCeID<v-icon>mdi-login</v-icon>
            </v-btn>  

</div>
<div class="row">
   <div class="grey-div">
   
   </div>
</div>
-->
<!--
<div class="w-100 h-100">
  <v-row>
    <v-col>
      <v-container class="justify-center">
        <v-row>
          <v-col>
            <p class="text-welcome mt-14 mb-8">
              Pay Transparency Reporting tool consectetur adipiscing elit. Etiam dictum ultrices purus, ac malesuada leo congue vel.
            </p>
            <p class="text-subtitle-2 mb-10">
              Introducing the Pay Transparency Reporting tool, onsectetur adipiscing elit. Ut fermentum tortor ut ultricies placerat. Nam eu leo lacus. Quisque id tempor arcu. Ut fermentum tortor ut ultricies placer, visit <u>Pay Transparency Laws in B.C.</u>
            </p>
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
  
  <v-row class="grey-div">
    <v-col>
      <v-container class="justify-center">
        <v-row>
          <v-col>
            <p class="text-welcome mt-14 mb-8">
              Pay Transparency Reporting tool consectetur adipiscing elit. Etiam dictum ultrices purus, ac malesuada leo congue vel.
            </p>
          </v-col>
        </v-row>
      </v-container>  
    </v-col>
  </v-row>
</div>
-->




<!--
  <v-container
    fluid
    class="full-height"
  >
    <article id="login-banner">
      <v-row
        align="center"
        justify="center"
      >
        <v-card
          variant="elevated"
          elevation="8"
          class="login-card"
        >
          <v-card-title class="gov-header">
            <h4 id="login_text">
              Log In
            </h4>
          </v-card-title>
          <v-card-text id="login_descriptor">
            Welcome to the Pay Transparency!
          </v-card-text>
          <v-row
            class="my-1"
            align="center"
            justify="center"
          >
            <v-btn
              id="login-button"
              variant="outlined"
              class="ma-2"
              @click="clearStorageAndRedirectToLogin"
            >
              Log In with Business BCeID<v-icon>mdi-login</v-icon>
            </v-btn>
          </v-row>
        </v-card>
      </v-row>
    </article>
  </v-container>
-->
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
    };
  },
  computed: {
    ...mapState(authStore, ['isAuthenticated']),
  },
  methods: {
    clearStorageAndRedirectToLogin() {
      authStore().setJwtToken();
      window.location.href = this.authRoutesLogin;
    }
  }
};
</script>

<style scoped>
  .full-height{
    height: 100%;
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
  }

  .unbastardized {
    margin: 0;
    padding: 0;
    min-width: 100%;
    max-width: 100%;
  }



.row {
    width:100%;
    height:50%;
}
.row div {
    width:100%;
    height:100%;
    float:left;
}

  .no-padding-margin {
    padding: 0;
    margin-right: 0;
    margin-left: 0;
  }
</style>
