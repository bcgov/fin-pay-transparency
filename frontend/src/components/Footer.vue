<template>
  <v-footer color="#fff" dark absolute class="bordered" app>
    <v-row>
      <v-col class="justify-left" style="text-align: left">
        <v-row>
          <v-col class="justify-left" style="text-align: left">
            <img
              tabindex="-1"
              src="../assets/images/bc-gov-logo-light.png"
              width="155"
              class="logo"
              alt="B.C. Government Logo"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col class="justify-center" style="text-align: left" data-testid="footer-message">
            For questions or assistance with creating a report please contact
            the Pay Transparency Unit -
            <a class="contact-email" href="mailto:paytransparency@gov.bc.ca">
              PayTransparency@gov.bc.ca
            </a>
          </v-col>
        </v-row>
      </v-col>
      <v-col class="justify-right">
        <p class="more-info-title">MORE INFO</p>
        <v-row>
          <v-col class="links" style="text-align: left">
            <v-list>
              <v-list-item
                class="footer-btn pl-1 pr-1"
                v-for="link in settings.links.left"
                v-bind:href="sanitizeUrl(link.to)"
                :data-testid="link.id"
              >
                <v-list-item-title v-text="link.label"></v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col class="links" style="text-align: left">
            <v-list>
              <v-list-item
                class="footer-btn pl-1 pr-1"
                v-for="link in settings.links.right"
                v-bind:href="sanitizeUrl(link.to)"
                :data-testid="link.id"
              >
                <v-list-item-title v-text="link.label"></v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-footer>
</template>

<script setup lang="ts">
import { sanitizeUrl } from '@braintree/sanitize-url';

type Link = { label: string; to: string; id: string };

type FooterSettings = {
  links: {
    left: Link[];
    right: Link[];
  };
};

const settings: FooterSettings = {
  links: {
    left: [
      { id: 'footer-link-home', label: 'Home', to: 'https://www.gov.bc.ca/' },
      {
        id: 'footer-link-about',
        label: 'About gov.bc.ca',
        to: 'https://www2.gov.bc.ca/gov/content/about-gov-bc-ca',
      },
      {
        id: 'footer-link-disclaimer',
        label: 'Disclaimer',
        to: 'https://www.gov.bc.ca/disclaimer',
      },
      {
        id: 'footer-link-privacy',
        label: 'Privacy',
        to: 'https://www.gov.bc.ca/privacy',
      },
    ],
    right: [
      {
        id: 'footer-link-accessibility',
        label: 'Accessibility',
        to: 'https://www.gov.bc.ca/webaccessibility',
      },
      {
        id: 'footer-link-copyright',
        label: 'Copyright',
        to: 'https://www.gov.bc.ca/copyright',
      },
      {
        id: 'footer-link-contact-us',
        label: 'Contact Us',
        to: 'https://www2.gov.bc.ca/gov/content/home/contact-us',
      },
    ],
  },
};
</script>

<style lang="scss">
$font-size: 12px;
$text-color: rgb(70, 67, 65);

.v-footer {
  flex-direction: column;
  min-width: 100%;
  font-size: $font-size;
}

.v-footer.bordered {
  border-top: 2px solid rgb(252, 186, 25) !important;
  overflow: hidden;
  padding-top: 50px;
}
a.contact-email {
  color: rgb(32, 31, 30);
  text-decoration: underline;
}

.v-list-item-title {
  color: $text-color;
  font-size: $font-size !important;

  &:hover {
    text-decoration: underline;
  }
}

.more-info-title {
  font-weight: 700;
}
.links {
  display: flex;
  flex-direction: column;
}
</style>
