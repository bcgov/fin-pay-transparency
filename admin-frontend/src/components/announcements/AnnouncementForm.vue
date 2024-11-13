<template>
  <v-container fluid class="pa-0">
    <div class="toolbar mr-4">
      <h1>{{ title }}</h1>
      <div class="flex-fill"></div>
      <div>
        <v-radio-group v-model="status" inline class="d-flex">
          <div class="align-self-center">Save as:</div>
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
      </div>

      <div class="ml-0">
        <v-btn
          v-if="!isConfirmDialogVisible"
          variant="outlined"
          color="primary"
          class="mr-3"
          @click="handleCancel"
        >
          Cancel
        </v-btn>
        <v-btn color="primary" @click="handleSave()">Save</v-btn>
      </div>
    </div>

    <v-row no-gutters class="extend-to-right-edge border-t">
      <!-- FORM -->
      <v-col sm="6" md="7" lg="7" xl="8" class="px-0">
        <div class="form-content pr-5">
          <v-row dense class="mt-2">
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
                counter
                maxlength="100"
                variant="outlined"
                :error-messages="errors.title"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="12" sm="12">
              <h5
                :class="{
                  'text-error': announcementDescriptionError,
                }"
              >
                Description *
              </h5>
              <RichTextArea
                id="announcementDescription"
                v-model="announcementDescription"
                placeholder="Description"
                :max-length="announcementDescriptionMaxLength"
                :error-message="announcementDescriptionError"
                @plain-text-length-changed="onDescriptionPlaintextLengthChanged"
              ></RichTextArea>
            </v-col>
            <v-col cols="12" md="12" sm="12">
              <h5 class="mb-2">Time Settings</h5>
              <v-row dense>
                <v-col cols="12">
                  <span
                    class="datetime-picker-label"
                    :class="{
                      'text-error': errors.active_on != null,
                    }"
                  >
                    Active On
                  </span>
                  <v-input
                    variant="outlined"
                    label="Active On"
                    placeholder="Active On"
                  >
                    <VueDatePicker
                      v-model="activeOn"
                      :state="errors.active_on == null ? undefined : false"
                      format="yyyy-MM-dd hh:mm a"
                      :enable-time-picker="true"
                      arrow-navigation
                      auto-apply
                      :disabled="announcement?.status === 'PUBLISHED'"
                      :aria-labels="{ input: 'Active On' }"
                    >
                      <template #day="{ day, date }">
                        <span :aria-label="formatDate(date)">
                          {{ day }}
                        </span>
                      </template>
                    </VueDatePicker>
                  </v-input>
                </v-col>
              </v-row>
              <v-row dense class="mt-0">
                <v-col offset="2" cols="10" class="pa-0 ml-3">
                  <span class="field-error">{{ errors.active_on }}</span>
                </v-col>
              </v-row>
              <v-row dense class="mt-2">
                <v-col cols="12">
                  <span
                    class="datetime-picker-label"
                    :class="{
                      'text-error': errors.expires_on != null,
                    }"
                  >
                    Expires On
                  </span>
                  <VueDatePicker
                    v-model="expiresOn"
                    :state="errors.expires_on == null ? undefined : false"
                    :aria-labels="{ input: 'Expires On' }"
                    format="yyyy-MM-dd hh:mm a"
                    :enable-time-picker="true"
                    arrow-navigation
                    auto-apply
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
                <v-col cols="12" class="pa-0 ml-3">
                  <span class="field-error">{{ errors.expires_on }}</span>
                </v-col>
              </v-row>
              <v-row no-gutters>
                <v-col cols="12">
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
              <v-row v-if="!linkDisplayOnly" dense class="mt-2">
                <v-col cols="12">
                  <span
                    class="attachment-label"
                    :class="{
                      'text-error': linkUrlRef && !linkUrlRef?.isValid,
                    }"
                  >
                    Link URL
                  </span>
                  <v-text-field
                    ref="linkUrlRef"
                    v-model="linkUrl"
                    single-line
                    placeholder="https://example.com"
                    label="https://example.com"
                    aria-label="Link URL"
                    counter
                    :error-messages="errors.linkUrl"
                    variant="outlined"
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
                    >Display URL As</span
                  >
                  <v-text-field
                    ref="linkDisplayNameRef"
                    v-model="linkDisplayName"
                    single-line
                    variant="outlined"
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
              <v-row v-if="!fileDisplayOnly" dense class="mt-2">
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
                    placeholder="eg. Updated Pay Transparency Guidance Document"
                    label="eg. Updated Pay Transparency Guidance Document"
                    aria-label="Display File Link As"
                    counter
                    maxlength="100"
                    variant="outlined"
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

      <!-- PREVIEW -->
      <v-col
        sm="6"
        md="5"
        lg="5"
        xl="4"
        class="px-0 py-0 d-flex justify-end extend-to-bottom"
      >
        <div class="previewPanel bg-previewPanel w-100 h-100 px-3 py-6">
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

          <v-row no-gutters>
            <v-col class="announcements">
              <AnnouncementPager
                :announcements="announcementsToPreview"
                :page-size="2"
                class="h-100"
              />
            </v-col>
          </v-row>
        </div>
      </v-col>
    </v-row>
  </v-container>

  <ConfirmationDialog ref="confirmDialog">
    <template #message>
      <p>
        Are you sure want to cancel this changes. This process cannot be undone.
      </p>
    </template>
  </ConfirmationDialog>
  <ConfirmationDialog ref="publishConfirmationDialog"> </ConfirmationDialog>
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
  LocalDateTime,
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
import RichTextArea from '../RichTextArea.vue';

// References to component's exported properties
const announcementTitleRef = ref<VTextField | null>(null);
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

const announcementDescription = ref<string | undefined>(
  announcement?.description,
);
const announcementDescriptionMaxLength: number = 2000;
const announcementDescriptionLength = ref<number | undefined>(undefined);
const announcementDescriptionError = ref<string | undefined>(undefined);

const onDescriptionPlaintextLengthChanged = (numChars) => {
  announcementDescriptionLength.value = numChars;
  announcementDescriptionError.value = validateDescription();
};

const validateDescription = () => {
  if (!announcementDescriptionLength.value) return 'Description is required.';

  if (
    announcementDescriptionLength?.value &&
    announcementDescriptionLength.value > 2000
  )
    return 'Description should have a maximum of 2000 characters.';

  return undefined;
};

const { handleSubmit, setErrors, errors, meta, values } = useForm({
  initialValues: {
    title: announcement?.title || '',
    active_on: announcement?.active_on
      ? new Date(announcement?.active_on) //VueDatePicker is initialized with a Date()
      : undefined,
    expires_on: announcement?.expires_on
      ? new Date(announcement?.expires_on) //VueDatePicker is initialized with a Date()
      : undefined,
    no_expiry:
      !announcement?.expires_on && announcement?.status === 'PUBLISHED',
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
    linkUrl(value) {
      if (value && !zod.string().url().safeParse(value).success) {
        return 'Invalid URL.';
      }

      if (value && value.length > 255)
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
    active_on(value) {
      if (!value && status.value === 'PUBLISHED') {
        return 'Active On date is required.';
      }

      return true;
    },
    expires_on(value) {
      if (!value) {
        return true;
      }

      const expiryDate = LocalDate.from(nativeJs(value));
      if (expiryDate.isBefore(LocalDate.now())) {
        return 'Expires On date cannot be in the past. Please choose another date.';
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
const { value: activeOn } = useField('active_on') as any;
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
watch(values, refreshPreview, { immediate: true });
watch(announcementDescription, refreshPreview, { immediate: true });

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
  attachment.value = undefined;
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
    !validateActiveOnDate(values) ||
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

  function validateActiveOnDate(values) {
    if (!values.active_on && status.value === 'PUBLISHED') {
      setErrors({ active_on: 'Active On date is required.' });
      return false;
    }

    if (
      announcement?.status !== 'PUBLISHED' &&
      values.active_on &&
      LocalDate.from(nativeJs(values.active_on)).isBefore(LocalDate.now())
    ) {
      setErrors({
        active_on:
          'Active On date cannot be in the past. Please select a new date.',
      });
      return false;
    }

    if (values.active_on && values.expires_on) {
      const expiryDate = LocalDate.from(nativeJs(values.expires_on));
      const activeDate = LocalDate.from(nativeJs(values.active_on));
      if (expiryDate.isBefore(activeDate)) {
        setErrors({
          active_on: 'Publish On date should be before expiry date.',
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

  async function confirmSave(values): Promise<boolean> {
    let doSave = false;
    let confirmationSettings;

    if (values.status === 'DRAFT') {
      confirmationSettings = {
        title: 'Confirm Draft',
        message:
          'Do you want to save the announcement as a draft? It will not be published to the public site. Do you want to continue?',
      };
    } else if (
      mode === AnnouncementFormMode.CREATE ||
      announcement?.status !== 'PUBLISHED'
    ) {
      let activeDate = LocalDateTime.from(nativeJs(values.active_on));
      // If the active_on date is in the past (earlier than the current time), the server will override it with the current time.
      // Therefore, we need to show the user the time that the server would actually use, which is the current time in that case.
      if (activeDate.isBefore(LocalDateTime.now()))
        activeDate = LocalDateTime.now();

      const activeDateString = activeDate.format(
        DateTimeFormatter.ofPattern('MMM d, yyyy').withLocale(Locale.CANADA),
      );
      const activeTimeString = activeDate.format(
        DateTimeFormatter.ofPattern('h:mm a').withLocale(Locale.CANADA),
      );
      confirmationSettings = {
        title: 'Confirm Publish',
        message: `This announcement will be published to the public site on ${activeDateString} at ${activeTimeString} Do you want to continue?`,
      };
    } else {
      confirmationSettings = {
        title: 'Confirm Update',
        message:
          "This published message will be updated on the public site with the changes you've made. Do you want to continue?",
      };
    }

    if (confirmationSettings) {
      isConfirmDialogVisible.value = true;
      doSave = await publishConfirmationDialog.value?.open(
        confirmationSettings.title,
        confirmationSettings.message,
        {
          titleBold: true,
          resolveText: 'Confirm',
        },
      );
      isConfirmDialogVisible.value = false;
    }
    return doSave;
  }

  const isSaveConfirmed = await confirmSave(values);
  if (!isSaveConfirmed) {
    return;
  }

  emits('save', {
    ...values,
    description: announcementDescription.value,
    active_on: values.active_on
      ? nativeJs(values.active_on).format(
          DateTimeFormatter.ISO_OFFSET_DATE_TIME,
        )
      : undefined,
    expires_on: values.expires_on
      ? nativeJs(values.expires_on).format(
          DateTimeFormatter.ISO_OFFSET_DATE_TIME,
        )
      : undefined,
    linkDisplayName: isEmpty(values.linkDisplayName)
      ? undefined
      : values.linkDisplayName,
    linkUrl: isEmpty(values.linkUrl) ? undefined : values.linkUrl,
    status: status.value,
    attachment: attachment.value,
    attachmentId:
      !values.attachment && !values.fileDisplayName
        ? undefined
        : values.attachmentId,
  });
});
</script>

<style scoped lang="scss">
.toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1rem;
  width: 100%;
}
.form-content {
  width: 100%;
  max-width: 800px;
  padding-right: 5px;
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
  margin-right: -24px !important;
}
.extend-to-bottom {
  margin-bottom: -36px;
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
