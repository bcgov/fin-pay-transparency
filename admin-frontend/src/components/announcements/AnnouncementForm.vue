<template>
  <div class="toolbar">
    <h1>{{ title }}</h1>
    <span class="fill-remaining-space"></span>
    <v-btn variant="text" color="primary" class="mr-2" @click="handleCancel"
      >Cancel</v-btn
    >

    <div class="d-flex flex-row align-center">
      <div class="mr-2">Save as:</div>
      <v-radio-group inline v-model="status" class="status-options mr-2">
        <v-radio
          v-if="!(mode === 'edit' && announcement?.status === 'PUBLISHED')"
          label="Draft"
          value="DRAFT"
          class="mr-2"
        ></v-radio>
        <v-radio label="Publish" value="PUBLISHED"></v-radio>
      </v-radio-group>
      <v-btn color="primary" class="ml-2" @click="handleSave()">Save</v-btn>
    </div>
  </div>
  <div class="content">
    <v-divider></v-divider>
    <v-row dense class="mt-2 form-wrapper">
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
              <template #day="{ day, date }">
                <span :aria-label="formatDate(date)">
                  {{ day }}
                </span>
              </template>
            </VueDatePicker>
          </v-col>
        </v-row>
        <v-row dense class="mt-0">
          <v-col cols="2" class="d-flex justify-end align-center pa-0"> </v-col>
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
            >
              <template #day="{ day, date }">
                <span :aria-label="formatDate(date)">
                  {{ day }}
                </span>
              </template>
            </VueDatePicker>
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
import { defineProps, defineEmits, watch, ref } from 'vue';
import { AnnouncementFormValue } from '../../types/announcements';
import { useField, useForm } from 'vee-validate';
import * as zod from 'zod';
import { isEmpty } from 'lodash';
import { DateTimeFormatter, LocalDate, nativeJs } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import { useRouter } from 'vue-router';

type Props = {
  announcement: AnnouncementFormValue | null | undefined;
  title: string;
  mode: 'create' | 'edit';
};

const router = useRouter();
const emits = defineEmits(['save']);
const confirmDialog = ref<typeof ConfirmationDialog>();
const publishConfirmationDialog = ref<typeof ConfirmationDialog>();
const { announcement, mode } = defineProps<Props>();

const { handleSubmit, setErrors, errors, meta } = useForm({
  initialValues: {
    title: announcement?.title || '',
    description: announcement?.description || '',
    published_on: announcement?.published_on || undefined,
    expires_on: announcement?.expires_on || undefined,
    no_expiry: undefined,
    linkUrl: announcement?.linkUrl || '',
    linkDisplayName: announcement?.linkDisplayName || '',
    status: announcement?.status || 'DRAFT',
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
const { value: status } = useField<string>('status');
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

const formatDate = (date: Date) => {
  return LocalDate.from(nativeJs(date)).format(
    DateTimeFormatter.ofPattern('EEEE d MMMM yyyy').withLocale(Locale.CANADA),
  );
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

const handleSave = handleSubmit(async (values) => {
  if (!validatePublishDate(values) || !validateLink(values)) {
    return;
  }

  function validatePublishDate(values) {
    if (!values.published_on && status.value === 'PUBLISHED') {
      setErrors({ published_on: 'Publish date is required.' });
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

  if (status.value === 'PUBLISHED' && (mode === 'create' || announcement?.status !== 'PUBLISHED')) {
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
    status: status.value,
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

  .form-wrapper {
    max-width: 800px;
  }
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

.status-options {
  height: 40px;
}
</style>
