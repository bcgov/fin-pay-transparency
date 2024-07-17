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
        :disabled="currentUser?.id === user.id"
        @click="removeUser"
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
          v-if="currentUser?.id !== user.id"
          :aria-label="`Role ${RoleLabels[user.effectiveRole]}`"
          v-bind="props"
        >
          {{ RoleLabels[user.effectiveRole] }}
        </v-btn>
        <span
          v-if="currentUser?.id === user.id"
          class="role-display"
          :aria-label="`Role ${RoleLabels[user.effectiveRole]}`"
          >{{ RoleLabels[user.effectiveRole] }}</span
        >
      </template>

      <v-list>
        <v-list-item
          :variant="user.effectiveRole === item.value ? 'tonal' : 'plain'"
          v-for="(item, index) in RoleOptions"
          :key="index"
          :class="
            user.effectiveRole === item.value ? 'selected-role' : undefined
          "
          @click="assignRole(item)"
          :disabled="user.effectiveRole === item.value"
          role="menuitem"
          :aria-label="item.label"
        >
          <v-list-item-title v-text="item.label"></v-list-item-title>
          <template v-slot:append v-if="user.effectiveRole === item.value">
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
      <p>Current Role: {{ RoleLabels[user.effectiveRole] }}</p>
      <p>
        <span class="text-red new-role">New</span> Role:
        {{ RoleLabels[nextRole] }}
      </p>
    </template>
  </ConfirmationDialog>
  <ConfirmationDialog ref="deleteConfirmDialog">
    <template v-slot:message>
      <p>
        Please confirm the deletion of
        <span class="delete-displayname">{{ user.displayName }}</span>
      </p>
    </template>
  </ConfirmationDialog>
</template>
<script setup lang="ts">
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import Spinner from '../Spinner.vue';
import { ref } from 'vue';
import { RoleOptions, RoleLabels, NextRoleTransitions } from '../../constants';
import { useUsersStore } from '../../store/modules/usersStore';
import { NotificationService } from '../../services/notificationService';
import { User } from '../../types';
import { authStore } from '../../store/modules/auth';
import { storeToRefs } from 'pinia';

const props = defineProps<{ user: User }>();
const auth = authStore();
const { userInfo: currentUser, x } = storeToRefs(auth);
const { assignUserRole, deleteUser } = useUsersStore();
const confirmDialog = ref<typeof ConfirmationDialog>();
const isProcessing = ref<boolean>(false);

const getUserInitials = (user) => {
  const tokens = user.displayName.split(' ');
  return `${tokens[0][0]}${tokens[1][0]}`;
};

const nextRole: string = NextRoleTransitions[props.user.effectiveRole];

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
      await assignUserRole(props.user.id, role.value);
      NotificationService.pushNotificationSuccess(
        `Permissions have been updated. If the user is currently logged in, please request that they log out and log in again`,
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

const removeUser = async () => {
  const result = await confirmDialog.value?.open(
    `Confirm User Deletion`,
    undefined,
    {
      titleBold: true,
      resolveText: `Delete`,
    },
  );

  if (result) {
    try {
      isProcessing.value = true;
      await deleteUser(props.user.id);
      NotificationService.pushNotificationSuccess(
        `${props.user.displayName} deleted successfully`,
      );
    } catch (error) {
      NotificationService.pushNotificationError(
        `Failed to delete ${props.user.displayName}`,
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

.role-display {
  font-weight: 600;
  color: #003366;
}

.selected-role {
  color: #003366;
  font-weight: 600;
}

.delete-displayname {
  font-weight: 600;
  color: #003366;
}

.new-role {
  font-weight: 600;
}
</style>
