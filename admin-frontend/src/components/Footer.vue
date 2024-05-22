<template>
  <v-footer color="#fff" dark absolute class="margin-top" app>
    <div class="first-nation-acknowledgement">
      <v-container>
        <v-row>
          <v-col>
            The B.C. Public Service acknowledges the territories of First
            Nations around B.C. and is grateful to carry out our work on these
            lands. We acknowledge the rights, interests, priorities, and
            concerns of all Indigenous Peoples - First Nations, Métis, and Inuit
            - respecting and acknowledging their distinct cultures, histories,
            rights, laws, and governments.
          </v-col>
        </v-row>
      </v-container>
    </div>
    <v-container>
      <v-row>
        <v-col class="d-sm-flex justify-space-between">
          <div class="contact">
            <img
              tabindex="-1"
              src="../assets/images/bc-gov-logo-light.png"
              width="155"
              alt="B.C. Government Logo"
            />
            <p class="mt-4" data-testid="footer-message">
              For questions or assistance with creating a report please contact
              the Pay Transparency Unit -
              <a class="contact-email" href="mailto:paytransparency@gov.bc.ca">
                PayTransparency@gov.bc.ca
              </a>
            </p>
          </div>
          <div class="more-info">
            <p class="font-weight-bold mb-4 mt-6 mt-sm-4">MORE INFO</p>
            <ul>
              <li
                v-for="link in settings.links"
                :key="link.id"
                class="footer-btn pl-1 pr-1"
              >
                <a :href="sanitizeUrl(link.to)" :data-testid="link.id">
                  {{ link.label }}
                </a>
              </li>
            </ul>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup lang="ts">
import { sanitizeUrl } from '@braintree/sanitize-url';

type Link = { label: string; to: string; id: string };

type FooterSettings = {
  links: Link[];
};

const settings: FooterSettings = {
  links: [
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
};
</script>

<style scoped lang="scss">
$font-size: 14px;
$text-color: rgb(70, 67, 65);
$border-color: rgb(252, 186, 25);

a {
  color: rgb(32, 31, 30);
  text-decoration: underline !important;
}

.v-footer {
  flex-direction: column;
  min-width: 100%;
  font-size: $font-size;
  z-index: 0 !important;
  padding: 0 !important;

  .first-nation-acknowledgement {
    background-color: rgb(41, 41, 41);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: 16px 0;
    color: #fff;
    font-size: 14px;
    line-height: 21px;
    transition: none !important;
    width: 100%;
    margin-bottom: 16px;
    border-top: 4px solid $border-color !important;
    border-bottom: 4px solid $border-color !important;
    overflow: hidden;
  }
}

.more-info {
  flex: 0 0 auto;
  ul {
    list-style-type: none;
    columns: 2;
    margin: 0px 0px 16px;
    gap: 48px;
    li {
      margin-bottom: 16px;
      width: 160px;
      @media (max-width: 1280px) {
        width: unset;
      }
    }
  }
}

.contact {
  flex: 0 0 50%;
}
</style>
