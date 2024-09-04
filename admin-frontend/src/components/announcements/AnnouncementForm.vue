<template>
  <v-row dense class="mt-0 w-100 mb-4">
    <v-col class="py-0 px-0">
      <div class="toolbar">
        <h1>{{ title }}</h1>
        <span class="fill-remaining-space"></span>
        <v-btn
          v-if="!isConfirmDialogVisible"
          variant="outlined"
          color="primary"
          class="mr-2"
          @click="handleCancel"
          >Cancel</v-btn
        >

        <div class="d-flex flex-row align-center">
          <div class="mr-2">Save as:</div>
          <v-radio-group v-model="status" inline class="status-options mr-2">
            <v-radio
              v-if="
                !(
                  mode === AnnouncementFormMode.EDIT &&
                  announcement?.status === 'PUBLISHED'
                )
              "
              label="Draft"
              value="DRAFT"
              class="mr-2"
            >
              <template #label>
                <AnnouncementStatusChip
                  :status="AnnouncementStatus.Draft"
                ></AnnouncementStatusChip>
              </template>
            </v-radio>
            <v-radio value="PUBLISHED" label="Publish">
              <template #label>
                <AnnouncementStatusChip
                  :status="AnnouncementStatus.Published"
                ></AnnouncementStatusChip>
              </template>
            </v-radio>
          </v-radio-group>
          <v-btn color="primary" class="ml-2" @click="handleSave()">Save</v-btn>
        </div>
      </div>

      <v-row dense class="extend-to-right-edge border-t">
        <v-col sm="6" md="7" lg="7" xl="8" class="px-0">
          <div class="content">
            <v-row dense class="mt-2 form-wrapper">
              <v-col cols="12" md="12" sm="12">
                <h5
                  :class="{
                    'text-error':
                      announcementTitleRef && !announcementTitleRef?.isValid,
                  }"
                >
                  Title *
                </h5>
                <v-text-field
                  ref="announcementTitleRef"
                  v-model="announcementTitle"
                  single-line
                  label="Title"
                  placeholder="Title"
                  variant="outlined"
                  counter
                  maxlength="100"
                  :error-messages="errors.title"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="12" sm="12">
                <h5
                  :class="{
                    'text-error':
                      announcementTitleRef &&
                      !announcementDescriptionRef?.isValid,
                  }"
                >
                  Description *
                </h5>
                <v-textarea
                  ref="announcementDescriptionRef"
                  v-model="announcementDescription"
                  single-line
                  variant="outlined"
                  label="Description"
                  placeholder="Description"
                  maxlength="2000"
                  counter
                  rows="3"
                  :error-messages="errors.description"
                ></v-textarea>
              </v-col>
              <v-col cols="12" md="8" sm="12" class="d-flex flex-column">
                <h5 class="mb-2">Time settings</h5>
                <v-row dense>
                  <v-col cols="2" class="d-flex justify-end align-center">
                    <p
                      class="datetime-picker-label"
                      :class="{
                        'text-error': errors.published_on != null,
                      }"
                    >
                      Publish On
                    </p>
                  </v-col>
                  <v-col cols="6">
                    <VueDatePicker
                      v-model="publishedOn"
                      :state="errors.published_on == null ? undefined : false"
                      format="yyyy-MM-dd hh:mm a"
                      :enable-time-picker="true"
                      arrow-navigation
                      auto-apply
                      :aria-labels="{ input: 'Publish On' }"
                    >
                      <template #day="{ day, date }">
                        <span :aria-label="formatDate(date)">
                          {{ day }}
                        </span>
                      </template>
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
                    <p
                      class="datetime-picker-label"
                      :class="{
                        'text-error': errors.expires_on != null,
                      }"
                    >
                      Expires On
                    </p>
                  </v-col>
                  <v-col cols="6" class="d-flex align-center">
                    <VueDatePicker
                      v-model="expiresOn"
                      :aria-labels="{ input: 'Expires On' }"
                      format="yyyy-MM-dd hh:mm a"
                      :enable-time-picker="true"
                      arrow-navigation
                      auto-apply
                      prevent-min-max-navigation
                      :disabled="noExpiry"
                    >
                      <template #day="{ day, date }">
                        <span :aria-label="formatDate(date)">
                          {{ day }}
                        </span>
                      </template>
                    </VueDatePicker>
                  </v-col>
                </v-row>
                <v-row dense class="mt-0">
                  <v-col cols="2" class="d-flex justify-end align-center pa-0">
                  </v-col>
                  <v-col cols="6" class="pa-0 ml-3">
                    <span class="field-error">{{ errors.expires_on }}</span>
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
                <v-row v-if="!linkDisplayOnly" dense class="ml-3 mt-2">
                  <v-col cols="12">
                    <span
                      class="attachment-label"
                      :class="{
                        'text-error': linkUrlRef && !linkUrlRef?.isValid,
                      }"
                      >Link URL</span
                    >
                    <v-text-field
                      ref="linkUrlRef"
                      v-model="linkUrl"
                      single-line
                      variant="outlined"
                      placeholder="https://example.com"
                      label="https://example.com"
                      aria-label="Link URL"
                      counter
                      :error-messages="errors.linkUrl"
                    >
                      <template #counter="{ value }">
                        <span
                          :class="{
                            'text-error': linkUrlRef && !linkUrlRef?.isValid,
                          }"
                          >{{ value }}/255</span
                        >
                      </template>
                    </v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <span
                      class="attachment-label"
                      :class="{
                        'text-error':
                          linkDisplayNameRef && !linkDisplayNameRef?.isValid,
                      }"
                      >Display Link As</span
                    >
                    <v-text-field
                      ref="linkDisplayNameRef"
                      v-model="linkDisplayName"
                      single-line
                      variant="filled"
                      placeholder="eg. Pay Transparency in B.C."
                      label="eg. Pay Transparency in B.C."
                      aria-label="Display URL As"
                      counter
                      maxlength="100"
                      :error-messages="errors.linkDisplayName"
                    ></v-text-field>
                  </v-col>
                </v-row>
                <v-row v-else dense class="ml-3 mt-2">
                  <v-col cols="12">
                    <LinkResource
                      :url="linkUrl"
                      :text="linkDisplayName"
                      @on-edit="onEditLink"
                      @on-delete="handleDeleteLink"
                    ></LinkResource>
                  </v-col>
                </v-row>
              </v-col>
              <v-col cols="12">
                <div class="section-title">
                  <h5 class="mb-2">File</h5>
                  <span class="fill-remaining-space" />
                  <v-btn
                    v-if="
                      !fileDisplayOnly &&
                      mode === AnnouncementFormMode.EDIT &&
                      announcement?.fileDisplayName
                    "
                    variant="text"
                    class="ml-2"
                    aria-label="Edit file"
                    @click="cancelEdit"
                    >Cancel edit file</v-btn
                  >
                </div>
                <v-row v-if="!fileDisplayOnly" dense class="ml-3 mt-2">
                  <v-col cols="12">
                    <span
                      class="attachment-label"
                      :class="{
                        'text-error':
                          fileDisplayNameRef && !fileDisplayNameRef?.isValid,
                      }"
                      >Display File Link As</span
                    >
                    <v-text-field
                      ref="fileDisplayNameRef"
                      v-model="fileDisplayName"
                      single-line
                      variant="outlined"
                      placeholder="eg. Updated Pay Transparency Guidance Document"
                      label="eg. Updated Pay Transparency Guidance Document"
                      aria-label="Display File Link As"
                      counter
                      maxlength="100"
                      :error-messages="errors.fileDisplayName"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <span
                      class="attachment-label"
                      :class="{
                        'text-error': attachmentRef && !attachmentRef?.isValid,
                      }"
                      >Attachment</span
                    >
                    <v-file-input
                      ref="attachmentRef"
                      v-model="attachment"
                      single-line
                      label="Attachment"
                      class="attachment"
                      variant="outlined"
                      :error-messages="errors.attachment"
                    >
                      <template #prepend-inner>
                        <v-btn color="primary">Choose File</v-btn>
                      </template>
                    </v-file-input>
                  </v-col>
                </v-row>
                <v-row v-else dense class="ml-3 mt-2">
                  <v-col cols="12">
                    <AttachmentResource
                      :id="announcement?.file_resource_id!"
                      :name="announcement?.fileDisplayName!"
                      @on-edit="onEditFile"
                      @on-delete="handleDeleteFile"
                    ></AttachmentResource>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </div>
        </v-col>
        <v-col
          sm="6"
          md="5"
          lg="5"
          xl="4"
          class="px-0 py-0 d-flex justify-end extend-to-bottom"
        >
          <div class="previewPanel bg-previewPanel w-100 h-100 px-6 py-6">
            <v-row dense>
              <v-col>
                <h3>Preview Announcement</h3>
              </v-col>
            </v-row>

            <v-row dense class="mb-2">
              <v-col>
                <v-icon icon="mdi-information"></v-icon>
                This is how the announcement will appear to the public.
              </v-col>
            </v-row>
            <v-row dense>
              <v-col class="announcements">
                <AnnouncementPager
                  :announcements="announcementsToPreview"
                  :page-size="2"
                  class="h-100"
                ></AnnouncementPager> </v-col
            ></v-row>
          </div>
        </v-col>
      </v-row>
    </v-col>
  </v-row>

  <ConfirmationDialog ref="confirmDialog">
    <template #message>
      <p>
        Are you sure want to cancel this changes. This process cannot be undone.
      </p>
    </template>
  </ConfirmationDialog>
  <ConfirmationDialog ref="publishConfirmationDialog">
    <template #message>
      <p>Are you sure you want to publish this announcement?</p>
    </template>
  </ConfirmationDialog>
</template>

<script lang="ts" setup>
import VueDatePicker from '@vuepic/vue-datepicker';
import { defineProps, defineEmits, watch, ref } from 'vue';
import {
  AnnouncementFormValue,
  Announcement,
  AnnouncementFilterType,
  AnnouncementSortType,
  AnnouncementFormMode,
  AnnouncementResourceType,
  AnnouncementStatus,
} from '../../types/announcements';
import { useField, useForm } from 'vee-validate';
import * as zod from 'zod';
import { isEmpty } from 'lodash';
import {
  DateTimeFormatter,
  LocalDate,
  ZonedDateTime,
  nativeJs,
} from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import { useRouter } from 'vue-router';
import AnnouncementPager from './AnnouncementPager.vue';
import AttachmentResource from './AttachmentResource.vue';
import LinkResource from './LinkResource.vue';
import ApiService from '../../services/apiService';
import { v4 } from 'uuid';
import AnnouncementStatusChip from './AnnouncementStatusChip.vue';
import type { VTextField } from 'vuetify/components';

// References to component's exported properties
const announcementTitleRef = ref<VTextField | null>(null);
const announcementDescriptionRef = ref<VTextField | null>(null);
const linkUrlRef = ref<VTextField | null>(null);
const linkDisplayNameRef = ref<VTextField | null>(null);
const fileDisplayNameRef = ref<VTextField | null>(null);
const attachmentRef = ref<VTextField | null>(null);

type Props = {
  announcement: AnnouncementFormValue | null | undefined;
  title: string;
  mode: AnnouncementFormMode.CREATE | AnnouncementFormMode.EDIT;
};

let publishedAnnouncements: Announcement[] | undefined = undefined;
const currentAnnouncement = ref<any>(null);
const announcementsToPreview = ref<Announcement[]>();

const router = useRouter();
const emits = defineEmits(['save']);
const confirmDialog = ref<typeof ConfirmationDialog>();
const publishConfirmationDialog = ref<typeof ConfirmationDialog>();
const { announcement, mode } = defineProps<Props>();
const fileDisplayOnly = ref(!!announcement?.file_resource_id);
const linkDisplayOnly = ref(
  !isEmpty(announcement?.linkUrl) && !isEmpty(announcement?.linkDisplayName),
);
const isConfirmDialogVisible = ref(false);

const { handleSubmit, setErrors, errors, meta, values } = useForm({
  initialValues: {
    title: announcement?.title || '',
    description: announcement?.description || '',
    published_on: announcement?.published_on || undefined,
    expires_on: announcement?.expires_on || undefined,
    no_expiry: undefined,
    linkUrl: announcement?.linkUrl || '',
    linkDisplayName: announcement?.linkDisplayName || '',
    fileDisplayName: announcement?.fileDisplayName || '',
    attachmentId: announcement?.attachmentId || v4(),
    status: announcement?.status || 'DRAFT',
    attachment: undefined,
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

      if (value.length > 255)
        return 'URL max length is 255 characters. Please shorten the URL.';

      return true;
    },
    linkDisplayName(value) {
      if (value && value.length > 100) {
        return 'Link display name should not be more than 100 characters.';
      }

      return true;
    },
    fileDisplayName(value) {
      if (value && value.length > 100) {
        return 'File name should not be more than 100 characters.';
      }

      return true;
    },
    published_on(value) {
      if (!value && status.value === 'PUBLISHED') {
        return 'Publish date is required.';
      }

      return true;
    },
    async attachment(value) {
      if (!value) return true;
      try {
        await ApiService.clamavScanFile(value);
      } catch (error) {
        return 'File is invalid.';
      }

      return true;
    },
  },
});

const { value: announcementTitle } = useField('title');
const { value: status } = useField<string>('status');
const { value: announcementDescription } = useField('description');
const { value: publishedOn } = useField('published_on') as any;
const { value: expiresOn } = useField('expires_on') as any;
const { value: noExpiry } = useField('no_expiry') as any;
const { value: linkUrl } = useField('linkUrl') as any;
const { value: linkDisplayName } = useField('linkDisplayName') as any;
const { value: fileDisplayName } = useField('fileDisplayName') as any;
const { value: attachment } = useField('attachment') as any;

watch(noExpiry, () => {
  if (noExpiry.value) {
    expiresOn.value = undefined;
  }
});

//Watch for changes to any form field.
//If the 'preview' mode is active when the form changes
//then refresh the preview
watch(
  values,
  () => {
    refreshPreview();
  },
  { immediate: true },
);

const formatDate = (date: Date) => {
  return LocalDate.from(nativeJs(date)).format(
    DateTimeFormatter.ofPattern('EEEE d MMMM yyyy').withLocale(Locale.CANADA),
  );
};

const onEditFile = () => {
  fileDisplayOnly.value = false;
};

const onEditLink = () => {
  linkDisplayOnly.value = false;
};

const handleDeleteLink = () => {
  linkDisplayOnly.value = false;
  linkDisplayName.value = undefined;
  linkUrl.value = undefined;
};

const handleDeleteFile = () => {
  fileDisplayName.value = undefined;
  fileDisplayOnly.value = false;
};

const cancelEdit = () => {
  fileDisplayOnly.value = true;
  fileDisplayName.value = announcement?.fileDisplayName;
  attachment.value = undefined;
};

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
async function refreshPreview() {
  if (!publishedAnnouncements) {
    publishedAnnouncements = await getPublishedAnnouncements();
  }
  //if this is edit mode, filter out the anouncement being edited from the
  //published announcements (we don't want it to appear twice in the preview area)
  const publishedAnnouncementsFiltered =
    mode == AnnouncementFormMode.CREATE
      ? publishedAnnouncements
      : publishedAnnouncements?.filter(
          (a) => a.announcement_id != announcement?.announcement_id,
        );
  currentAnnouncement.value = buildAnnouncementToPreview();

  //combine the currentAnnouncement with a list of already-published
  //announcements
  const announcements: any[] = [];
  const isCurrentAnnouncementEmpty =
    !currentAnnouncement.value.announcement_id &&
    !currentAnnouncement.value.title &&
    !currentAnnouncement.value.description &&
    !currentAnnouncement.value.announcement_resource.length;
  if (!isCurrentAnnouncementEmpty) {
    announcements.push(currentAnnouncement.value);
  }
  if (publishedAnnouncementsFiltered?.length) {
    announcements.push(...publishedAnnouncementsFiltered);
  }
  announcementsToPreview.value = announcements;
}

/*
Create a new Announcement object using the current form values.
The resulting Announcement object is principally used for preview
its appearance, so some of the unnecessary attributes aren't populated
(created_date, updated_date, etc)
*/
function buildAnnouncementToPreview() {
  const previewAnnouncement = {
    announcement_id: announcement?.announcement_id,
    title: announcementTitle.value,
    description: announcementDescription.value,
    announcement_resource: [] as any[],
  };

  //include resource with type LINK
  if (linkDisplayName.value && linkUrl.value) {
    previewAnnouncement.announcement_resource.push({
      display_name: linkDisplayName.value,
      resource_url: linkUrl.value,
      resource_type: AnnouncementResourceType.LINK,
    });
  }

  //include resource with type ATTACHMENT
  //we handle the attachment slightly differently depending on whether
  //it is a pre-existing (already saved) file, or a not-yet-saved file.
  if (
    (attachment.value || announcement?.file_resource_id) &&
    fileDisplayName.value
  ) {
    const resource: any = {
      display_name: fileDisplayName.value,
      resource_type: AnnouncementResourceType.ATTACHMENT,
    };
    //if there is a new, not-yet-saved attachment, include it in the
    //preview in preference to the any pre-existing attachment
    if (attachment.value) {
      resource.announcement_resource_file = attachment.value;
    } else if (announcement?.file_resource_id) {
      resource.announcement_resource_id = announcement?.file_resource_id;
    }
    previewAnnouncement.announcement_resource.push(resource);
  }

  return previewAnnouncement;
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

const handleSave = handleSubmit(async (values) => {
  if (
    !validatePublishDate(values) ||
    !validateLink(values) ||
    !validateExpiry()
  ) {
    return;
  }

  function validateExpiry() {
    if (
      values.status === 'PUBLISHED' &&
      !values.expires_on &&
      !values.no_expiry
    ) {
      setErrors({ expires_on: 'Please choose an Expiry date.' });
      return false;
    }
    return true;
  }

  function validatePublishDate(values) {
    if (!values.published_on && status.value === 'PUBLISHED') {
      setErrors({ published_on: 'Publish date is required.' });
      return false;
    }

    if (
      announcement?.status !== 'PUBLISHED' &&
      values.published_on &&
      LocalDate.from(nativeJs(values.published_on)).isBefore(LocalDate.now())
    ) {
      setErrors({
        published_on:
          'Publish On date cannot be in the past. Please select a new date.',
      });
      return false;
    }

    if (values.published_on && values.expires_on) {
      const expiryDate = LocalDate.from(nativeJs(values.expires_on));
      const publishDate = LocalDate.from(nativeJs(values.published_on));
      if (expiryDate.isBefore(publishDate)) {
        setErrors({
          published_on: 'Publish date should be before expiry date.',
        });
        return false;
      }
    }

    return true;
  }

  function validateLink(values) {
    if (!values.linkDisplayName && values.linkUrl) {
      setErrors({ linkDisplayName: 'Link display name is required.' });
      return false;
    }

    if (!values.linkUrl && values.linkDisplayName) {
      setErrors({ linkUrl: 'Link URL is required.' });
      return false;
    }

    return true;
  }

  if (
    status.value === 'PUBLISHED' &&
    (mode === AnnouncementFormMode.CREATE ||
      announcement?.status !== 'PUBLISHED')
  ) {
    isConfirmDialogVisible.value = true;
    const confirmation = await publishConfirmationDialog.value?.open(
      'Confirm Publish',
      undefined,
      {
        titleBold: true,
        resolveText: 'Confirm',
      },
    );
    isConfirmDialogVisible.value = false;

    if (!confirmation) {
      return;
    }
  }

  await emits('save', {
    ...values,
    published_on: values.published_on
      ? DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(
          ZonedDateTime.from(nativeJs(values.published_on)),
        )
      : undefined,
    expires_on: values.expires_on
      ? DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(
          ZonedDateTime.from(nativeJs(values.expires_on)),
        )
      : undefined,
    linkDisplayName: isEmpty(values.linkDisplayName)
      ? undefined
      : values.linkDisplayName,
    linkUrl: isEmpty(values.linkUrl) ? undefined : values.linkUrl,
    status: status.value,
    attachment: attachment.value,
  });
});
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  margin-bottom: 1rem;
  flex: 1;
  width: 100%;
  .fill-remaining-space {
    flex: 1 1 auto;
  }
}
.v-row {
  margin-left: 0px !important;
}
.content {
  width: 100%;
  max-width: 800px;
}
.previewPanel {
  max-width: 500px !important;
}
.previewPanel .announcements {
  height: 500px;
}

.datetime-picker-label,
.attachment-label {
  font-size: small;
}

.v-selection-control .v-label {
  font-size: small !important;
}

.field-error {
  color: rgb(var(--v-theme-error));
  font-size: x-small;
}
.extend-to-right-edge {
  margin-right: -40px !important;
}
.extend-to-bottom {
  margin-bottom: -36px;
}
.status-options {
  height: 40px;
}
.attachment {
  .v-input__prepend {
    display: none;
  }
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
