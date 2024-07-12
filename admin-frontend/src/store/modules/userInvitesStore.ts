import { defineStore } from 'pinia';
import { ref } from 'vue';
import { CreateUserInviteInput, UserInvite } from '../../types';
import ApiService from '../../services/apiService';

export const useInvitesStore = defineStore('invites', () => {
  const loading = ref<boolean>(false);
  const invites = ref<UserInvite[] | undefined>(undefined);

  const getInvites = async () => {
    loading.value = true;
    const response = await ApiService.getPendingUserInvites();
    invites.value = response.data;
    loading.value = false;
  };

  const addInvite = async (data: CreateUserInviteInput) => {
    await ApiService.inviteUser(data);
    const response = await ApiService.getPendingUserInvites();
    invites.value = response.data;
  };

  const deleteInvite = async (inviteId: string) => {
    await ApiService.deleteUserInvite(inviteId);
    const response = await ApiService.getPendingUserInvites();
    invites.value = response.data;
  };

  const resendInvite = async (inviteId: string) => {
    await ApiService.resendUserInvite(inviteId);
  };

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
