<template>
  <v-form>
    <v-dialog v-model="open" max-width="600">
      <template v-slot:activator="{ props: activatorProps }">
        <v-btn
          prepend-icon="mdi-account-plus"
          text="Add New User"
          variant="elevated"
          color="primary"
          v-bind="activatorProps"
        ></v-btn>
      </template>

      <v-card v-if="open" role="presentation" aria-label="Add New User">
        <template v-slot:title >
          <span class="card-title">Add New User</span>
        </template>
        <v-divider></v-divider>

        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="12" sm="12">
              <h5>Name *</h5>

              <v-text-field
                single-line
                label="Name"
                placeholder="Name"
                v-model="name"
                v-bind="nameProps"
                :error-messages="errors.name"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="12" sm="12">
              <h5>Email *</h5>

              <v-text-field
                single-line
                label="Email"
                placeholder="Email"
                type="email"
                required
                :suffix="emailSuffix"
                v-model="email"
                v-bind="emailProps"
                :error-messages="errors.email"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="12" sm="12">
              <v-radio-group
                label="Select the user role *"
                v-model="role"
                :error-messages="errors.role"
                v-bind="roleProps"
                inline
              >
                <v-radio
                  v-for="item in RoleOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                ></v-radio>
              </v-radio-group>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text="Cancel" variant="outlined" @click="onClose()"></v-btn>

          <v-btn
            color="primary"
            text="Add"
            variant="elevated"
            @click="submit"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <ConfirmDialog ref="confirmDialog">
      <template v-slot:message>
        <p>Name: {{ name }}</p>
        <p>Role: {{ RoleLabels[role] }}</p>
        <p class="mt-2">
          Ensure that the user details are correct before proceeding. Do you want
          to add this user?
        </p>
      </template>
    </ConfirmDialog>
  </v-form>

</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  RoleLabels,
  RoleOptions,
  USER_ROLE_NAME,
} from '../../constants';
import z from 'zod';
import { useForm } from 'vee-validate';
import ConfirmDialog from '../util/ConfirmationDialog.vue';
import { useInvitesStore } from '../../store/modules/userInvitesStore';
import { NotificationService } from '../../services/notificationService';

const { addInvite } = useInvitesStore();
const open = ref(false);
const confirmDialog = ref();
const emailSuffix = '@gov.bc.ca';
const {
  meta,
  handleSubmit,
  handleReset,
  defineField,
  errors,
  validate,
  setErrors,
} = useForm({
  initialTouched: {
    name: false,
    email: false,
    role: true,
  },
  initialValues: {
    name: '',
    email: '',
    role: USER_ROLE_NAME,
  },
  validationSchema: {
    name(value) {
      if (!value) return 'Name is required.';
      return true;
    },
    email(value: string) {
      if (!value) return 'Email is required.';

      if (value.includes('@')) {
        return 'Should not contain a "@"" symbol';
      }

      return true;
    },
  },
});
const [name, nameProps] = defineField('name');
const [email, emailProps] = defineField('email');
const [role, roleProps] = defineField('role');

const onClose = () => {
  handleReset();
  open.value = false;
};

const submit = async () => {
  const results = await validate();
  if (!results.valid) {
    setErrors(results.errors);
    return;
  }

  open.value = false;
  const confirm = await confirmDialog.value?.open(
    `Confirm User Addition`,
    undefined,
    {
      titleBold: true,
      resolveText: `Continue`,
    },
  );

  if (!confirm) {
    open.value = true;
    return;
  }

  const data = {
    firstName: name.value,
    email: `${email.value}${emailSuffix}`,
    role: role.value,
  };

  try {
    await addInvite(data);
    NotificationService.pushNotificationSuccess(
      'User successfully onboarded. An email has been sent for them to activate their account for the application. Once they activate their account the user will be displayed for user management',
    );
  } catch (error) {
    open.value = true;
    NotificationService.pushNotificationError('Failed to add user');
  }
};
</script>

<style scoped lang="scss">
.card-title {
  font-weight: 700 !important;
}

input::-ms-input-placeholder {
  color: black !important;
}

.v-field__input {
  height: 40px;
}
.v-field__input > input {
  padding-top: 0px;
}

.v-label {
  font-weight: 700 !important;
}
</style>
