import { defineStore } from 'pinia';
import { ref } from 'vue';
import ApiService from '../../services/apiService';
import { User } from '../../types';

export const useUsersStore = defineStore('users', () => {
  const loading = ref<boolean>(false);
  const users = ref<User[] | undefined>(undefined);

  const getUsers = async () => {
    try {
      loading.value = true;
      const { data } = await ApiService.getUsers();
      users.value = data;
    } catch (err) {
      console.log(`get users failed: ${err}`);
    } finally {
      loading.value = false;
    }
  };

  const assignUserRole = async (userId: string, role: string) => {
    try {
      await ApiService.assignUserRole(userId, role);
      const { data } = await ApiService.getUsers();
      users.value = data;
    } catch (err) {
      console.log(`get users failed: ${err}`);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await ApiService.deleteUser(userId);
      const { data } = await ApiService.getUsers();
      users.value = data;
    } catch (err) {
      console.log(`get users failed: ${err}`);
    }
  };

  const reset = () => {
    loading.value = false;
    users.value = undefined;
  };

  return {
    //state
    loading,
    users,
    //actions
    getUsers,
    assignUserRole,
    deleteUser,
    reset,
  };
});
