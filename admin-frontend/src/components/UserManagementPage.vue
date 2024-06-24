<template>
  <div v-if="loading" class="loader-root">
    <v-progress-circular color="primary" indeterminate></v-progress-circular>
    <span class="mt-2">Loading users</span>
  </div>
  <div v-if="!loading && users !== undefined" class="main-root">
    <div class="toolbar">
      <div class="title">Users ({{ users.length }})</div>
      <span style="flex: 1 1 auto" />
      <v-btn prepend-icon="mdi-account-plus" color="primary" variant="elevated"
        >Add New User</v-btn
      >
    </div>
    <v-row class="users-grid" no-gutters>
      <v-col
        class="user-card-wrapper"
        cols="12"
        sm="12"
        md="3"
        v-for="user of users"
      >
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
              >
                <v-list-item-title v-text="item.label"></v-list-item-title>
                <template v-slot:append v-if="user.role === item.value">
                  <v-icon size="x-small" icon="mdi-check" />
                </template>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import { useUsersStore } from '../store/modules/usersStore';
import { RoleOptions, RoleLabels } from '../constants';

const usersStore = useUsersStore();
const { users, loading } = storeToRefs(usersStore);

const getUserInitials = (user) => {
  const tokens = user.displayName.split(' ');
  return `${tokens[0][0]}${tokens[1][0]}`;
};

onMounted(async () => {
  await usersStore.getUsers();
});
</script>

<style scoped lang="scss">
.loader-root {
  width: 100%;
  height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.main-root {
  width: 100%;
  min-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;

  .toolbar {
    width: 100%;
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
    .title {
      font-weight: bold;
      font-size: large;
    }
  }
}
.users-grid {
  flex: none;
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
}
.role-menu-button {
  padding: 5px;
  padding-right: 5px;
}

.selected-role {
  color: #003366;
  font-weight: 600;
}
</style>
