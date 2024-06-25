<template>
  <v-card class="pa-4 ma-2 user-card">
    <div class="actions d-flex">
      <v-avatar color="primary">
        <span class="text-h6">{{ getUserInitials(user) }}</span>
      </v-avatar>
      <span style="flex: 1 1 auto" />

      <v-btn
        density="compact"
        variant="text"
        color="error"
        icon="mdi-trash-can-outline"
        aria-label="Delete user"
      ></v-btn>
    </div>
    <div class="display-name mt-2">
      {{ user.displayName }}
    </div>
    <v-menu location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          color="primary"
          variant="text"
          append-icon="mdi-chevron-down"
          class="role-menu-button"
          :aria-label="`Role ${RoleLabels[user.role]}`"
          v-bind="props"
          >{{ RoleLabels[user.role] }}</v-btn
        >
      </template>

      <v-list>
        <v-list-item
          :variant="user.role === item.value ? 'tonal' : 'plain'"
          v-for="(item, index) in RoleOptions"
          :key="index"
          :class="user.role === item.value ? 'selected-role' : undefined"
          @click="assignRole(item)"
          :disabled="user.role === item.value"
        >
          <v-list-item-title v-text="item.label"></v-list-item-title>
          <template v-slot:append v-if="user.role === item.value">
            <v-icon size="x-small" icon="mdi-check" />
          </template>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-card>
  <v-overlay
    :persistent="true"
    :model-value="isProcessing"
    class="align-center justify-center"
  >
    <spinner />
  </v-overlay>
  <ConfirmationDialog ref="confirmDialog">
    <template v-slot:message>
      <p>Name: {{ user.displayName }}</p>
      <p>Current Role: {{ RoleLabels[user.role] }}</p>
      <p>
        <span class="text-red new-role">New</span> Role:
        {{ RoleLabels[nextRole] }}
      </p>
    </template>
  </ConfirmationDialog>
</template>
<script setup lang="ts">
import ConfirmationDialog from './util/ConfirmationDialog.vue';
import Spinner from './Spinner.vue';
import { ref } from 'vue';
import { RoleOptions, RoleLabels, NextRoleTransitions } from '../constants';
import { useUsersStore } from '../store/modules/usersStore';
import { NotificationService } from '../services/notificationService';

const props = defineProps(['user']);
const { assignUserRole } = useUsersStore();
const confirmDialog = ref<typeof ConfirmationDialog>();
const isProcessing = ref<boolean>(false);

const getUserInitials = (user) => {
  const tokens = user.displayName.split(' ');
  return `${tokens[0][0]}${tokens[1][0]}`;
};

const nextRole: string = NextRoleTransitions[props.user.role];

const assignRole = async (role: (typeof RoleOptions)[0]) => {
  const result = await confirmDialog.value?.open(
    `Confirm Role Change`,
    undefined,
    {
      titleBold: true,
      resolveText: `Continue`,
    },
  );

  if (result) {
    try {
      isProcessing.value = true;
      await assignUserRole(props.user.userName, role.value);
      NotificationService.pushNotificationSuccess(
        `${props.user.displayName} assigned ${RoleLabels[nextRole]} role`,
      );
    } catch (error) {
      NotificationService.pushNotificationError(
        `Failed to assign ${props.user.displayName} to role ${RoleLabels[nextRole]}`,
      );
    } finally {
      isProcessing.value = false;
    }
  }
};
</script>

<style scoped lang="scss">
.user-card-wrapper {
  .user-card {
    .actions {
      width: 100%;
    }
    .display-name {
      font-weight: 700;
      color: #000;
    }
  }
}

.role-menu-button {
  padding: 5px;
  padding-right: 5px;
}

.selected-role {
  color: #003366;
  font-weight: 600;
}

.new-role {
  font-weight: 600;
}
</style>
