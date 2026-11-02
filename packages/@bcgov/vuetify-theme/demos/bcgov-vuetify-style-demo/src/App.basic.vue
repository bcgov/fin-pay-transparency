<script setup lang="ts">
import { ref } from "vue";

const notificationOptions = [
  { title: "Email", value: "email" },
  { title: "SMS", value: "sms" },
];
const notifications = ref<string[]>([]);

const provinces = [
  { title: "British Columbia", value: "bc" },
  { title: "Alberta", value: "ab" },
];
const province = ref<string | null>(null);

const contactMethod = ref("email");
const agreed = ref(false);
const enabled = ref(true);
const name = ref("");
const comments = ref("");
const quantity = ref(1);
const alignment = ref("left");
const calendarDate = ref<Date>(new Date());
const startDate = ref<Date | null>(null);
const startTime = ref("09:00");
const skills = ["TypeScript", "Vue"];
const buttonVariants = ["elevated", "flat", "tonal", "outlined", "text", "plain", ] as const;
const buttonColors = [undefined, "primary", "secondary", "error"];
</script>

<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-title>Vuetify Component Reference - basic</v-app-bar-title>
    </v-app-bar>

    <v-main>
      <v-container max-width="1100" class="py-8">
        <h2 class="mb-6">Navigation and Structure</h2>

        <section class="mb-8">
          <h3 class="mb-3">App Bar (Header)</h3>
            <v-layout min-height="100">
          <v-app-bar>
            <v-app-bar-title>Example header</v-app-bar-title>
          </v-app-bar>
        </v-layout>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Toolbar (Subheader)</h3>
          <v-toolbar  >
            <v-btn color="link" variant="plain">Overview</v-btn>
            <v-divider  vertical />
            <v-btn color="link" variant="plain">Details</v-btn>
            <v-divider  vertical />
            <v-btn color="link" variant="plain">Contact</v-btn>
          </v-toolbar>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Footer (Footer)</h3>
          <v-footer class="position-relative">
            <span class="text-body-2">Example footer</span>
          </v-footer>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Menu (Menu)</h3>
          <v-menu>
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="outlined">Actions</v-btn>
            </template>
            <v-list>
              <v-list-item title="Edit" value="edit" color="primary" />
              <v-list-item title="Duplicate" value="duplicate" />
              <v-list-item title="Archive" value="archive" />
            </v-list>
          </v-menu>
        </section>

        <h2 class="mb-6">Inputs and Controls</h2>

        <section class="mb-8">
          <h3 class="mb-3">Button (Button)</h3>
          <div class="d-flex flex-wrap ga-3 mb-3">
            <v-btn color="primary" variant="flat">Primary</v-btn>
            <v-btn variant="outlined">Secondary</v-btn>
            <v-btn variant="text">Tertiary</v-btn>
            <v-btn color="link" variant="plain">Link</v-btn>
            <v-btn color="error" variant="flat">Danger</v-btn>
          </div>
          <v-table>
            <tbody>
              <tr v-for="color in [undefined, 'primary', 'secondary', 'error']" :key="color">
                <td v-for="variant in  ['elevated', 'flat', 'tonal', 'outlined', 'text', 'plain' ]" :key="variant">
                  <v-btn :color="color" :variant="variant">
                    {{ color ?? 'undefined'}}
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">ButtonGroup</h3>
          No equivalent. Vuetify can group buttons, but it has a different purpose and meaning.
          <!-- <v-btn-group>
            <v-btn>Back</v-btn>
            <v-btn>Next</v-btn>
          </v-btn-group> -->
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Date Picker (Calendar)</h3>
          <v-date-picker v-model="calendarDate" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Checkbox (Checkbox)</h3>
          <v-checkbox v-model="agreed" label="Accept terms" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Checkbox Group (CheckboxGroup)</h3>
          <p class="text-body-2 mb-2">Notifications</p>
          <v-checkbox
            v-for="option in notificationOptions"
            :key="option.value"
            v-model="notifications"
            :label="option.title"
            :value="option.value"
          />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Date Input (DatePicker)</h3>
          <v-date-input v-model="startDate" label="Start date" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Number Input (NumberField)</h3>
          <v-number-input v-model="quantity" label="Quantity" :min="0" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Radio Group and Radio (RadioGroup and Radio)</h3>
          <v-radio-group v-model="contactMethod" label="Preferred contact">
            <v-radio label="Email" value="email" />
            <v-radio label="Phone" value="phone" />
          </v-radio-group>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Select (Select)</h3>
          <v-label text="Province"/>
          <v-select
            v-model="province"
            :items="provinces"
            placeholder="Select a province"
          />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Switch (Switch)</h3>
          <v-switch v-model="enabled" label="Enable notifications" color="primary" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Chip Group and Chip (TagGroup, TagList and Tag)</h3>
          <v-chip-group>
            <v-chip>TypeScript</v-chip>
            <v-chip>Vue</v-chip>
          </v-chip-group>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Textarea (TextArea)</h3>
          <v-textarea v-model="comments" label="Comments" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Text Field (TextField)</h3>
          <v-text-field
            v-model="name"
            label="Full name"
            hint="Enter your legal name."
            persistent-hint
          />
          <v-text-field label="Label" variant="outlined"></v-text-field>
          <v-text-field label="Label" variant="underlined"></v-text-field>
          <v-text-field label="Label" variant="solo"></v-text-field>
          <v-text-field label="Label" variant="solo-filled"></v-text-field>
          <v-text-field label="Label" variant="solo-inverted"></v-text-field>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Time Picker (TimeField)</h3>
          <v-time-picker v-model="startTime" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Button Toggle (ToggleButton and ToggleButtonGroup)</h3>
          <v-btn-toggle v-model="alignment" mandatory >
            <v-btn value="left" >Left</v-btn>
            <v-btn value="center" >Center</v-btn>
            <v-btn value="right" >Right</v-btn>
          </v-btn-toggle>
        </section>

        <h2 class="mb-6">Notifications and Feedback</h2>

        <section class="mb-8">
          <h3 class="mb-3">Snackbar (AlertBanner)</h3>
          <div class="d-flex flex-column ga-3">
            <v-layout min-height="60">
              <v-snackbar model-value contained timeout="-1" color="info" prepend-icon="$info">Information banner.</v-snackbar>
            </v-layout>
            <v-layout min-height="60">
              <v-snackbar model-value contained timeout="-1" color="success" prepend-icon="$success">Success banner.</v-snackbar>
            </v-layout>
            <v-layout min-height="60">
              <v-snackbar model-value contained timeout="-1" color="warning" prepend-icon="$warning">Warning banner.</v-snackbar>
            </v-layout>
            <v-layout min-height="60">
              <v-snackbar model-value contained timeout="-1" color="error" prepend-icon="$error">Error banner.</v-snackbar>
            </v-layout>
          </div>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Dialog (Dialog and Modal)</h3>
          <v-dialog max-width="500">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="outlined">Open dialog</v-btn>
            </template>
            <template #default="{ isActive }">
              <v-card title="Dialog title" text="Dialog content goes here.">
                <v-card-actions>
                  <v-spacer />
                  <v-btn @click="isActive.value = false">Close</v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Dialog (AlertDialog)</h3>
          <v-dialog max-width="500">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="outlined">Open alert dialog</v-btn>
            </template>
            <template #default="{ isActive }">
              <v-card title="Confirm action" text="Are you sure you want to continue?">
                <v-card-actions>
                  <v-spacer />
                  <v-btn variant="text" @click="isActive.value = false">Cancel</v-btn>
                  <v-btn color="primary" @click="isActive.value = false">Continue</v-btn>
                </v-card-actions>
              </v-card>
            </template>
          </v-dialog>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Alert (InlineAlert)</h3>
          <div class="d-flex flex-column ga-3">
            <v-alert type="info" text="Information message." />
            <v-alert type="success" text="Success message." />
            <v-alert type="warning" text="Warning message." />
            <v-alert type="error" text="Error message." />
          </div>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Progress Linear (ProgressBar)</h3>
          <v-progress-linear :model-value="60" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Progress Circular (ProgressCircle)</h3>
          <v-progress-circular :model-value="40" />
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Tooltip (Tooltip)</h3>
          <v-tooltip text="Helpful hint">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="outlined">Hover or focus me</v-btn>
            </template>
          </v-tooltip>
        </section>

        <h2 class="mb-6">Content</h2>

        <section class="mb-8">
          <h3 class="mb-3">Expansion Panel (Accordion and AccordionGroup)</h3>
          <v-expansion-panels>
            <v-expansion-panel title="First section">
              <v-expansion-panel-text>Content for the first section.</v-expansion-panel-text>
            </v-expansion-panel>
            <v-expansion-panel title="Second section">
              <v-expansion-panel-text>Content for the second section.</v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Alert (Callout)</h3>
          <v-alert border="start" class="bg-blue-10 callout" variant="flat" text="Callout body text." border-color="primary"/>
        </section>

        <h2 class="mb-6">Utility</h2>

        <section class="mb-8">
          <h3 class="mb-3">Form (Form)</h3>
          <v-form @submit.prevent>
            <v-text-field v-model="name" label="Name" />
            <v-btn type="submit" color="primary">Submit</v-btn>
          </v-form>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Typography (Heading)</h3>
          <h1>Heading level 1</h1>
          <h2>Heading level 2</h2>
          <h3>Heading level 3</h3>
          <h4>Heading level 4</h4>
          <h5>Heading level 5</h5>
          <h6>Heading level 6</h6>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Anchor (Link)</h3>
          <a href="https://www2.gov.bc.ca">gov.bc.ca</a>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Typography (Text)</h3>
          <span class="text-body-small">Small text.</span>
          <span class="text-body-medium">Medium text.</span>
          <span class="text-body-large">Large text.</span>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Divider (Separator)</h3>
          <p>Content above the separator.</p>
          <v-divider class="my-4" />
          <p>Content below the separator.</p>
        </section>

        <section class="mb-8">
          <h3 class="mb-3">Icon (Icons)</h3>
          <div class="d-flex flex-wrap ga-4">
            <v-icon icon="fas fa-check" />
            <v-icon icon="fas fa-xmark" />
            <v-icon icon="fas fa-chevron-down" />
            <v-icon icon="fas fa-circle-info" />
            <v-icon icon="fas fa-triangle-exclamation" />
            <v-icon icon="fas fa-plus" />
            <v-icon icon="fas fa-minus" />
            <v-icon icon="fas fa-calendar" />
            <v-icon icon="fas fa-up-right-from-square" />
          </div>
        </section>
      </v-container>
    </v-main>

    <v-footer>
      <span class="text-body-2">Vuetify components demo</span>
    </v-footer>
  </v-app>
</template>