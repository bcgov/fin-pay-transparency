<template>
  <div v-if="loading" class="loader-root">
    <v-progress-circular color="primary" indeterminate></v-progress-circular>
    <span class="mt-2">Loading users</span>
  </div>
  <div v-if="!loading && users !== undefined" class="main-root">
    <div class="toolbar">
      <div class="title">Users ({{ users.length }})</div>
      <span style="flex: 1 1 auto" />
      <AddUserButton />
    </div>
    <v-row class="users-grid" no-gutters>
      <v-col
        class="user-card-wrapper"
        cols="12"
        sm="12"
        md="3"
        v-for="user of users"
      >
        <UserCard :key="user.id" :user="user" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import AddUserButton from './user-management/AddUserButton.vue';
import UserCard from './UserCard.vue';
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import { useUsersStore } from '../store/modules/usersStore';

const usersStore = useUsersStore();
const { users, loading } = storeToRefs(usersStore);

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
