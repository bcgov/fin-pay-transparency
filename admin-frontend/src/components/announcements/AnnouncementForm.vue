<template>
  <div class="extend-to-right-edge">
    <v-row class="w-100 dense border-b-thin">
      <v-col>
        <h1>{{ title }}</h1>
      </v-col>
      <v-col class="d-flex justify-end mr-4">
        <v-btn variant="text" color="primary" class="mr-2" @click="handleCancel"
          >Cancel</v-btn
        >
        <v-btn
          variant="outlined"
          color="primary"
          class="mr-2"
          @click="handleSave('DRAFT')()"
          >Save draft</v-btn
        >
        <v-btn color="primary" @click="handleSave('PUBLISHED')()"
          >Publish</v-btn
        >
      </v-col>
    </v-row>
    <v-row class="w-100">
      <v-col sm="6" md="7" lg="7" xl="8">
        <div class="content">
          <v-row dense class="mt-2 w-100">
            <v-col cols="12" md="12" sm="12">
              <h5>Title *</h5>
              <v-text-field
                single-line
                label="Title"
                placeholder="Title"
                variant="outlined"
                counter
                maxlength="100"
                v-model="announcementTitle"
                :error-messages="errors.title"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="12" sm="12">
              <h5>Description *</h5>
              <v-textarea
                single-line
                variant="outlined"
                label="Description"
                placeholder="Description"
                maxlength="2000"
                counter
                rows="3"
                v-model="announcementDescription"
                :error-messages="errors.description"
              ></v-textarea>
            </v-col>
            <v-col cols="12" md="8" sm="12" class="d-flex flex-column">
              <h5 class="mb-2">Time settings</h5>
              <v-row dense>
                <v-col cols="2" class="d-flex justify-end align-center">
                  <p class="datetime-picker-label">Publish On</p>
                </v-col>
                <v-col cols="6">
                  <VueDatePicker
                    format="yyyy-MM-dd hh:mm a"
                    :enable-time-picker="true"
                    arrow-navigation
                    auto-apply
                    prevent-min-max-navigation
                    v-model="publishedOn"
                    :aria-labels="{ input: 'Publish On' }"
                  >
                  </VueDatePicker>
                </v-col>
              </v-row>
              <v-row dense class="mt-0">
                <v-col cols="2" class="d-flex justify-end align-center pa-0">
                </v-col>
                <v-col cols="6" class="pa-0 ml-3">
                  <span class="field-error">{{ errors.published_on }}</span>
                </v-col>
              </v-row>
              <v-row dense class="mt-2">
                <v-col cols="2" class="d-flex justify-end align-center">
                  <p class="datetime-picker-label">Expires On</p>
                </v-col>
                <v-col cols="6" class="d-flex align-center">
                  <VueDatePicker
                    :aria-labels="{ input: 'Expires On' }"
                    format="yyyy-MM-dd hh:mm a"
                    :enable-time-picker="true"
                    arrow-navigation
                    auto-apply
                    prevent-min-max-navigation
                    v-model="expiresOn"
                    :disabled="noExpiry"
                  />
                </v-col>
              </v-row>
              <v-row class="mt-0">
                <v-col cols="8" class="d-flex justify-end pa-0">
                  <v-checkbox
                    v-model="noExpiry"
                    class="expiry-checkbox"
                    label="No expiry"
                  ></v-checkbox>
                </v-col>
              </v-row>
            </v-col>
            <v-col cols="12">
              <h5 class="mb-2">Link</h5>
              <v-row dense class="ml-3 mt-2">
                <v-col cols="12">
                  <span class="attachment-label">Link URL</span>
                  <v-text-field
                    single-line
                    variant="outlined"
                    placeholder="https://example.com"
                    v-model="linkUrl"
                    label="Link URL"
                    :error-messages="errors.linkUrl"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <span class="attachment-label">Display Link As</span>
                  <v-text-field
                    single-line
                    variant="filled"
                    placeholder="eg., DocumentName.pdf"
                    label="Display Link As"
                    v-model="linkDisplayName"
                    :error-messages="errors.linkDisplayName"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-row>
            <v-col class="d-flex justify-end">
              <v-btn
                v-if="!announcementsToPreview?.length"
                class="btn-primary"
                prepend-icon="mdi-eye"
                @click="preview()"
                :disabled="!isPreviewAvailable"
                >Preview</v-btn
              >
            </v-col>
          </v-row>
        </div>
      </v-col>
      <Transition name="slide-fade">
        <v-col
          sm="6"
          md="5"
          lg="5"
          xl="4"
          class="px-0 py-0 d-flex justify-end"
          v-if="announcementsToPreview?.length"
        >
          <div class="previewPanel bg-previewPanel w-100 h-100 px-6 py-6">
            <v-row dense>
              <v-col>
                <h3>Preview Announcement</h3>
              </v-col>
              <v-col cols="2" class="d-flex justify-end">
                <v-btn
                  density="compact"
                  variant="plain"
                  icon="mdi-close"
                  @click="closePreview()"
                ></v-btn>
              </v-col>
            </v-row>

            <v-row dense class="mb-2">
              <v-col>
                <v-icon icon="mdi-information"></v-icon>
                This is how the announcement will appear to the public.
              </v-col>
            </v-row>
            <v-row dense>
              <v-col>
                <AnnouncementCarousel
                  :announcements="announcementsToPreview"
                  :pageSize="2"
                ></AnnouncementCarousel> </v-col
            ></v-row>
          </div>
        </v-col>
      </Transition>
    </v-row>
  </div>

  <ConfirmationDialog ref="confirmDialog">
    <template v-slot:message>
      <p>
        Are you sure want to cancel this changes. This process cannot be undone.
      </p>
    </template>
  </ConfirmationDialog>
  <ConfirmationDialog ref="publishConfirmationDialog">
    <template v-slot:message>
      <p>Are you sure you want to publish this announcement?</p>
    </template>
  </ConfirmationDialog>
</template>

<script lang="ts" setup>
import VueDatePicker from '@vuepic/vue-datepicker';
import { defineProps, defineEmits, watch, ref, computed } from 'vue';
import {
  AnnouncementFormValue,
  Announcement,
  AnnouncementFilterType,
  AnnouncementSortType,
} from '../../types/announcements';
import { useField, useForm } from 'vee-validate';
import * as zod from 'zod';
import { isEmpty } from 'lodash';
import { LocalDate, nativeJs } from '@js-joda/core';
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import { useRouter } from 'vue-router';
import AnnouncementCarousel from './AnnouncementCarousel.vue';
import ApiService from '../../services/apiService';

type Props = {
  announcement: AnnouncementFormValue | null;
  title: string;
};

let publishedAnnouncements: Announcement[] | undefined = undefined;
const announcementsToPreview = ref<Announcement[]>();

const router = useRouter();
const emits = defineEmits(['save']);
const confirmDialog = ref<typeof ConfirmationDialog>();
const publishConfirmationDialog = ref<typeof ConfirmationDialog>();
const { announcement } = defineProps<Props>();
const isPreviewAvailable = computed(() => values.title && values.description);

const { handleSubmit, setErrors, errors, meta, values } = useForm({
  initialValues: {
    title: announcement?.title || '',
    description: announcement?.description || '',
    published_on: announcement?.published_on || undefined,
    expires_on: announcement?.expires_on || undefined,
    no_expiry: undefined,
    linkUrl: announcement?.linkUrl || '',
    linkDisplayName: announcement?.linkDisplayName || '',
  },
  validationSchema: {
    title(value) {
      if (!value) return 'Title is required.';

      if (value.length > 100)
        return 'Title should have a maximum of 100 characters.';

      return true;
    },
    description(value) {
      if (!value) return 'Description is required.';

      if (value.length > 2000)
        return 'Description should have a maximum of 2000 characters.';

      return true;
    },
    linkUrl(value) {
      if (value && !zod.string().url().safeParse(value).success) {
        return 'Invalid URL.';
      }

      return true;
    },
    linkDisplayName(value) {
      if (value && value.length > 100) {
        return 'Link display name should not be more than 100 characters.';
      }

      return true;
    },
  },
});

const { value: announcementTitle } = useField('title');
const { value: announcementDescription } = useField('description');
const { value: publishedOn } = useField('published_on') as any;
const { value: expiresOn } = useField('expires_on') as any;
const { value: noExpiry } = useField('no_expiry') as any;
const { value: linkUrl } = useField('linkUrl') as any;
const { value: linkDisplayName } = useField('linkDisplayName') as any;

watch(noExpiry, () => {
  if (noExpiry.value) {
    expiresOn.value = undefined;
  }
});

//Watch for changes to any form field.
//If the 'preview' mode is active when the form changes
//then refresh the preview
watch(values, () => {
  if (announcementsToPreview.value) {
    preview();
  }
});

const handleCancel = async () => {
  if (!meta.value.dirty) {
    router.back();
    return;
  }

  const result = await confirmDialog.value?.open('Confirm Cancel', undefined, {
    titleBold: true,
    resolveText: 'Continue',
  });

  if (result) {
    router.back();
  }
};

/*
Preview the current announcement alongside any other pre-existing (published)
announcements.  The pre-existing announcements are fetched from the backend,
and cached for quick subsequent access (because this function may be called 
repeatedly).
*/
async function preview() {
  if (!publishedAnnouncements) {
    publishedAnnouncements = await getPublishedAnnouncements();
  }
  const currentAnnouncement = buildAnnouncementToPreview();
  announcementsToPreview.value = [
    currentAnnouncement as any,
    ...publishedAnnouncements,
  ];
}

/*
Clears the 'announcementsToPreview' ref which triggers the
preview panel to disappear.
*/
function closePreview() {
  announcementsToPreview.value = undefined;
}

/* 
Create a new Announcement object using the current form values.
The resulting Announcement object is principally used for preview
its appearance, so some of the unnecessary attributes aren't populated
(created_date, updated_date, etc)
*/
function buildAnnouncementToPreview() {
  const announcement = {
    announcement_id: null,
    title: announcementTitle.value,
    description: announcementDescription.value,
    announcement_resource: [] as any[],
  };
  if (linkDisplayName.value && linkUrl.value) {
    announcement.announcement_resource.push({
      display_name: linkDisplayName.value,
      resource_url: linkUrl.value,
    });
  }
  return announcement;
}

/*
Downloads from the backend a list of Announcements with status=PUBLISHED.
Results are ordered by update date (most recently updated are first).
Implementation note: The backend returns Announcements in "pages".  For
simplicity here, this function assumes all the published announcements 
can be fetched in one large "page" (of 100).
*/
async function getPublishedAnnouncements(): Promise<Announcement[]> {
  const filters: AnnouncementFilterType = [
    {
      key: 'status',
      operation: 'in',
      value: ['PUBLISHED'],
    },
  ];
  const sort: AnnouncementSortType = [{ field: 'updated_date', order: 'desc' }];
  const result = await ApiService.getAnnouncements(0, 100, filters, sort);
  return result?.items;
}

const handleSave = (status: 'DRAFT' | 'PUBLISHED') =>
  handleSubmit(async (values) => {
    if (!values.published_on && status === 'PUBLISHED') {
      setErrors({ published_on: 'Publish date is required.' });
      return;
    }

    if (values.published_on && values.expires_on) {
      const expiryDate = LocalDate.from(nativeJs(values.expires_on));
      const publishDate = LocalDate.from(nativeJs(values.published_on));
      if (expiryDate.isBefore(publishDate)) {
        setErrors({
          published_on: 'Publish date should be before expiry date.',
        });
        return;
      }
    }

    if (!values.linkDisplayName && values.linkUrl) {
      setErrors({ linkDisplayName: 'Link display name is required.' });
      return;
    }

    if (!values.linkUrl && values.linkDisplayName) {
      setErrors({ linkUrl: 'Link URL is required.' });
      return;
    }

    if (status === 'PUBLISHED') {
      const confirmation = await publishConfirmationDialog.value?.open(
        'Confirm Publish',
        undefined,
        {
          titleBold: true,
          resolveText: 'Confirm',
          rejectText: 'Close',
        },
      );

      if (!confirmation) {
        return;
      }
    }

    await emits('save', {
      ...values,
      linkDisplayName: isEmpty(values.linkDisplayName)
        ? undefined
        : values.linkDisplayName,
      linkUrl: isEmpty(values.linkUrl) ? undefined : values.linkUrl,
      status,
    });
  });
</script>

<style lang="scss">
.toolbar {
  display: flex;
  margin-bottom: 1rem;
  flex: 1;
  width: 100%;
  .fill-remaining-space {
    flex: 1 1 auto;
  }
}

.content {
  width: 100%;
  max-width: 800px;
}
.previewPanel {
  max-width: 500px !important;
}

.datetime-picker-label,
.attachment-label {
  font-size: small;
}

.v-selection-control .v-label {
  font-size: small !important;
}

.field-error {
  color: red;
  font-size: x-small;
}
.extend-to-right-edge {
  margin-right: -40px !important;
}
</style>
