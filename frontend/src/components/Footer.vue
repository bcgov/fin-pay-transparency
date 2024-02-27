<template>
  <v-footer color="#003366" dark absolute>
    <v-row no-gutters>
      <v-col class="justify-center" style="text-align: center">
        For questions or assistance with creating a report please contact the
        Pay Transparency Unit -
        <a class="contact-email" href="mailto:paytransparency@gov.bc.ca">
          PayTransparency@gov.bc.ca
        </a>
      </v-col>
    </v-row>
  </v-footer>
  <v-footer color="#003366" dark absolute class="bordered">
    <v-row no-gutters>
      <v-col class="justify-center">
        <v-btn
          id="footer-home"
          class="footer-btn pl-1 pr-1"
          variant="plain"
          color="white"
          href="https://www.gov.bc.ca/"
        >
          Home
        </v-btn>
        |
        <v-btn
          id="footer-about"
          class="footer-btn pl-1 pr-1"
          variant="plain"
          color="white"
          href="https://www2.gov.bc.ca/gov/content/about-gov-bc-ca"
        >
          About gov.bc.ca
        </v-btn>
        |
        <v-btn
          id="footer-disclaimer"
          class="footer-btn pl-1 pr-1"
          variant="plain"
          color="white"
          href="http://gov.bc.ca/disclaimer"
        >
          Disclaimer
        </v-btn>
        |
        <v-btn
          id="footer-privacy"
          class="footer-btn pl-1 pr-1"
          variant="plain"
          color="white"
          href="http://gov.bc.ca/privacy"
        >
          Privacy
        </v-btn>
        |
        <v-btn
          id="footer-accessibility"
          class="footer-btn pl-1 pr-1"
          variant="plain"
          color="white"
          href="http://gov.bc.ca/webaccessibility"
        >
          Accessibility
        </v-btn>
        |
        <v-btn
          id="footer-copyright"
          class="footer-btn pl-1 pr-1"
          variant="plain"
          color="white"
          href="http://gov.bc.ca/copyright"
        >
          Copyright
        </v-btn>
        |
        <v-btn
          id="footer-contact"
          class="footer-btn pl-1 pr-1"
          variant="plain"
          color="white"
          href="https://www2.gov.bc.ca/gov/content/home/contact-us"
        >
          Contact Us
        </v-btn>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup lang="ts"></script>

<style>
.v-footer {
  flex-direction: column;
  min-width: 100%;
}

.v-footer.bordered {
  border-top: 2px solid rgb(252, 186, 25) !important;
  overflow: hidden;
  max-height: 3em;
}
a.contact-email {
  color: white;
  text-decoration: underline;
}

.v-btn--active.footer:before,
.v-btn.footer:focus:before,
.v-btn.footer:hover:before {
  background: none;
}
.footer-btn:hover {
  text-decoration: underline !important;
}
</style>
