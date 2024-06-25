import { defineStore } from 'pinia';
import { ref } from 'vue';
import ApiService from '../../services/apiService';
import { AddUserInput, User } from '../../types';

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

  const addUser = async (data: AddUserInput) => {
    return ApiService.addUser(data);
  }
  
  const assignUserRole = async (username: string, role: string) => {
    try {
      await ApiService.assignUserRole(username, role);
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
    addUser,
    assignUserRole,
    reset,
  };
});
