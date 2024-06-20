import { defineStore } from 'pinia';
import { ref } from 'vue';
import ApiService from '../../services/apiService';
import { User } from '../../types';

export const useUsersStore = defineStore('users', () => {
  const loading = ref<boolean>(false);
  const users = ref<User[]>([]);

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

  const reset = () => {
    loading.value = false;
    users.value = [];
  };

  return {
    //state
    loading,
    users,
    //actions
    getUsers,
    reset,
  };
});
