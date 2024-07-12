import { defineStore } from 'pinia';
import { ref } from 'vue';
import { CreateUserInviteInput, UserInvite } from '../../types';
import ApiService from '../../services/apiService';

export const useInvitesStore = defineStore('invites', () => {
  const loading = ref<boolean>(false);
  const invites = ref<UserInvite[] | undefined>(undefined);

  const getInvites = async () => {
    try {
      loading.value = true;
      const response = await ApiService.getPendingUserInvites();
      invites.value = response?.data;
    } catch (err) {
      console.log(`get invites failed: ${err}`);
    } finally {
      loading.value = false;
    }
  };

  const addInvite = async (data: CreateUserInviteInput) => {
    try {
      await ApiService.inviteUser(data);
      const response = await ApiService.getPendingUserInvites();
      invites.value = response?.data;
    } catch (error) {
      console.log(`addInvite failed - ${error}`);
      throw error;
    }
  };

  const deleteInvite = async (inviteId: string) => {
    try {
      await ApiService.deleteUserInvite(inviteId);
      const response = await ApiService.getPendingUserInvites();
      invites.value = response?.data;
    } catch (err) {
      console.log(`get invites failed: ${err}`);
      throw err;
    }
  };

  const resendInvite = async (inviteId: string) => {
    await ApiService.resendUserInvite(inviteId);
  }

  const reset = () => {
    loading.value = false;
    invites.value = undefined;
  };

  return {
    //state
    loading,
    invites,
    //actions
    getInvites,
    addInvite,
    deleteInvite,
    resendInvite,
    reset,
  };
});
