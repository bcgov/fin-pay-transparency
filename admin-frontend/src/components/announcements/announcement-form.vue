<template>
  <div class="toolbar">
    <h1>{{ title }}</h1>
    <span class="fill-remaining-space"></span>
    <v-btn variant="text" color="primary" class="mr-2" @click="handleReset"
      >Cancel</v-btn
    >
    <v-btn
      variant="outlined"
      color="primary"
      class="mr-2"
      @click="handleSave('DRAFT')"
      >Save draft</v-btn
    >
    <v-btn color="primary" @click="handleSave('PUBLISHED')()">Publish</v-btn>
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
            >
            </VueDatePicker>
          </v-col>
        </v-row>
        <v-row class="mt-0">
          <v-col cols="2" class="d-flex justify-end align-center pa-0"> </v-col>
          <v-col cols="6 pa-0 ml-3">
            <span class="field-error">{{ errors.published_on }}</span>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="2" class="d-flex justify-end align-center">
            <p class="datetime-picker-label">Expires On</p>
          </v-col>
          <v-col cols="6" class="d-flex align-center">
            <VueDatePicker
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
              :error-messages="errors.linkUrl"
            ></v-text-field>
          </v-col>
          <v-col cols="12">
            <span class="attachment-label">Display Link As</span>
            <v-text-field
              single-line
              variant="outlined"
              placeholder="eg., DocumentName.pdf"
              v-model="linkDisplayName"
              :error-messages="errors.linkDisplayName"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import VueDatePicker from '@vuepic/vue-datepicker';
import { defineProps, defineEmits, watch } from 'vue';
import { Announcement } from '../../types';
import { useField, useForm } from 'vee-validate';
import * as zod from 'zod';

const emits = defineEmits(['save']);

type Props = {
  announcement: Announcement | null;
  title: string;
};

const { announcement } = defineProps<Props>();

const { handleReset, handleSubmit, setErrors, errors } = useForm({
  initialValues: {
    title: announcement?.title || '',
    description: announcement?.description || '',
    published_on: announcement?.published_on || '',
    expires_on: announcement?.expires_on || '',
    no_expiry: undefined,
    linkUrl: announcement?.linkUrl || '',
    linkDisplayName: announcement?.linkDisplayName || '',
  },
  validationSchema: {
    title(value) {
      if (!value) return 'Title is required.';

      if (value.length > 100)
        return 'Title should be less than 100 characters.';

      return true;
    },
    description(value) {
      if (!value) return 'Description is required.';

      if (value.length > 2000)
        return 'Description should be less than 2000 characters.';

      return true;
    },
    linkUrl(value) {
      if (value && !zod.string().url().safeParse(value).success) {
        return 'Invalid URL.';
      }

      return true;
    },
    linkText(value) {
      if (value && value.length > 100)
        return 'Link display name should be less than 100 characters.';

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
    expiresOn.value = null;
  }
});

const handleSave = (status: 'DRAFT' | 'PUBLISHED') =>
  handleSubmit(async (values) => {
    if (!values.published_on && status === 'PUBLISHED') {
      setErrors({ published_on: 'Publish date is required.' });
      return;
    }

    if (!values.linkDisplayName && values.linkUrl) {
      setErrors({ linkDisplayName: 'Link display name is required.' });
      return;
    }

    if (!values.linkUrl && values.linkDisplayName) {
      setErrors({ linkUrl: 'Link URL is required.' });
      return;
    }

    await emits('save', {
      ...values,
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
</style>
