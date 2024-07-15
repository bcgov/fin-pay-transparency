<template>
  <v-dialog v-model="open" max-width="850">
    <template v-slot:activator="{ props: activatorProps }">
      <v-btn
        text="Pending Access"
        variant="outlined"
        color="primary"
        class="mr-2"
        v-bind="activatorProps"
      ></v-btn>
    </template>

    <v-card v-if="open">
      <template v-slot:title>
        <span class="card-title">Pending User Access</span>
      </template>
      <template v-slot:append>
        <v-btn variant="text" icon="mdi-close" @click="onClose" aria-label="Close"></v-btn>
      </template>
      <v-divider></v-divider>

      <v-card-text>
        <v-empty-state
          v-if="!loading && !invites?.length"
          headline="No pending invitations"
          title=""
          text="There are no pending user access invitations. When there are, they'll appear here."
        ></v-empty-state>
        <div v-if="loading" class="loader-root">
          <v-progress-circular
            color="primary"
            indeterminate
          ></v-progress-circular>
          <span class="mt-2">Loading access invitations...</span>
        </div>
        <v-data-table
          :headers="headers"
          :items="invites"
          :items-per-page="10"
          :disable-sort="true"
          v-if="invites?.length"
        >
          <template v-slot:item="{ item }">
            <tr>
              <td :data-testid="`name-${item.admin_user_onboarding_id}`">
                {{ item.first_name }}
              </td>
              <td :data-testid="`email-${item.admin_user_onboarding_id}`">
                {{ item.email }}
              </td>
              <td class="actions">
                <v-btn
                  :data-testid="`resend-${item.admin_user_onboarding_id}`"
                  prepend-icon="mdi-email-outline"
                  variant="text"
                  color="link"
                  @click="resendEmail(item)"
                >
                  Resend email
                </v-btn>
                <v-btn
                  :data-testid="`delete-${item.admin_user_onboarding_id}`"
                  prepend-icon="mdi-delete-outline"
                  variant="text"
                  color="link"
                  @click="deleteInvite(item)"
                >
                  Delete invite
                </v-btn>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>

      <v-divider></v-divider>
    </v-card>
  </v-dialog>
  <ConfirmationDialog ref="resendConfirmDialog">
    <template v-slot:message>
      <p>Would you like to resend the invitation email?</p>
      <p>The expiry date will be extended.</p>
    </template>
  </ConfirmationDialog>
  <ConfirmationDialog ref="deleteConfirmDialog">
    <template v-slot:message>
      <p>Are you sure you want to delete this invite?</p>
      <p>This action cannot be undone.</p>
    </template>
  </ConfirmationDialog>
</template>
<script setup lang="ts">
import ConfirmationDialog from '../util/ConfirmationDialog.vue';
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useInvitesStore } from '../../store/modules/userInvitesStore';
import { UserInvite } from '../../types';
import { NotificationService } from '../../services/notificationService';

const deleteConfirmDialog = ref<typeof ConfirmationDialog>();
const resendConfirmDialog = ref<typeof ConfirmationDialog>();

const invitesStore = useInvitesStore();
const { invites, loading } = storeToRefs(invitesStore);
const headers: any = [
  { title: 'Name', key: 'name', sortable: false },
  {
    title: 'Email',
    key: 'email',
    sortable: false,
  },
  { title: 'Actions', sortable: false, key: 'actions', align: 'start' },
];

const open = ref(false);

const onClose = () => {
  open.value = false;
};

const deleteInvite = async (item: UserInvite) => {
  open.value = false;
  const result = await deleteConfirmDialog.value?.open(
    'Confirm Delete',
    undefined,
    {
      titleBold: true,
      resolveText: 'Delete',
    },
  );

  open.value = true;
  if (result) {
    try {
      await invitesStore.deleteInvite(item.admin_user_onboarding_id);
      NotificationService.pushNotificationSuccess(
        `Invitation deleted successfully.`,
      );
    } catch (e) {
      console.error(e);
      NotificationService.pushNotificationError(
        `Failed to delete invitation. Please try again.`,
      );
    }
  }
};   

const resendEmail = async (item: UserInvite) => {
  open.value = false;
  const result = await resendConfirmDialog.value?.open(
    'Confirm Resend',
    undefined,
    {
      titleBold: true,
      resolveText: 'Send',
    },
  );

  open.value = true;
  if (result) {
    try {
      await invitesStore.resendInvite(item.admin_user_onboarding_id);
      NotificationService.pushNotificationSuccess(
        `Invitation email resent successfully.`,
      );
    } catch (e) {
      console.error(e);
      NotificationService.pushNotificationError(
        `Failed to resend invitation email. Please try again.`,
      );
    }
  }
};

watch(open, async (isOpen) => {
  if (isOpen) {
    await invitesStore.getInvites();
  }
});
</script>
<style scoped lang="scss">
.card-title {
  font-weight: 700 !important;
}

.loader-root {
  width: 100%;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
</style>
