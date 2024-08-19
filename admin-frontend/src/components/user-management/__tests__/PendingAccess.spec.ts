import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import PendingAccess from '../PendingAccess.vue';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { useInvitesStore } from '../../../store/modules/userInvitesStore';
import { setActivePinia } from 'pinia';
import { createTestingPinia } from '@pinia/testing';

const mockResendUserInvite = vi.fn();
const mockDeleteUserInvite = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    resendUserInvite: () => mockResendUserInvite(),
    deleteUserInvite: () => mockDeleteUserInvite(),
  },
}));

const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('../../../services/notificationService', () => ({
  NotificationService: {
    pushNotificationSuccess: () => mockSuccess(),
    pushNotificationError: () => mockError(),
  },
}));

global.ResizeObserver = require('resize-observer-polyfill');
const vuetify = createVuetify({ components, directives });
const pinia = createTestingPinia();
const wrappedRender = async () => {
  setActivePinia(pinia);
  return render(PendingAccess, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const getTrigger = () => screen.getByRole('button', { name: 'Pending Access' });

let store: ReturnType<typeof useInvitesStore> = useInvitesStore();
describe('PendingAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render correctly', async () => {
    await wrappedRender();
    expect(getTrigger()).toBeInTheDocument();
  });

  it('should close the dialog', async () => {
    await wrappedRender();
    const triggerButton = getTrigger();
    await fireEvent.click(triggerButton);
    await waitFor(() => {
      expect(screen.getByText('Pending User Access')).toBeInTheDocument();
    });
    const closeButton = screen.getByRole('button', { name: 'Close' });
    await fireEvent.click(closeButton);
    await waitFor(() => {
      expect(screen.queryByText('Pending User Access')).not.toBeInTheDocument();
    });
  });

  describe('without invites', () => {
    it('should render loading state', async () => {
      await wrappedRender();
      const triggerButton = getTrigger();
      await fireEvent.click(triggerButton);
      await waitFor(() => {
        expect(store.getInvites).toHaveBeenCalled();
      });
      await store.$patch({ invites: [], loading: true });
      await waitFor(() => {
        expect(store.loading).toBe(true);
        expect(
          screen.getByText('Loading access invitations...'),
        ).toBeInTheDocument();
      });
    });
    it('should render empty state', async () => {
      await wrappedRender();
      const triggerButton = getTrigger();
      await fireEvent.click(triggerButton);
      await waitFor(() => {
        expect(store.getInvites).toHaveBeenCalled();
      });
      await store.$patch({ invites: [], loading: false });
      await waitFor(() => {
        expect(store.loading).toBe(false);
        expect(screen.getByText('No pending invitations')).toBeInTheDocument();
      });
    });
  });

  describe('with invites', () => {
    it('should render invites', async () => {
      store.$patch({
        loading: false,
        invites: [
          {
            admin_user_onboarding_id: '1',
            first_name: 'John Doe',
            email: 'user@example.com',
          },
        ],
      });
      await wrappedRender();
      expect(screen.queryByText('Pending User Access')).not.toBeInTheDocument();
      const triggerButton = getTrigger();
      await fireEvent.click(triggerButton);
      await waitFor(async () => {
        await expect(
          screen.getByText('Pending User Access'),
        ).toBeInTheDocument();
        expect(store.getInvites).toHaveBeenCalled();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    describe('resend invite', () => {
      it('should resend invite', async () => {
        store.$patch({
          loading: false,
          invites: [
            {
              admin_user_onboarding_id: '1',
              first_name: 'John Doe',
              email: 'user@example.com',
            },
          ],
        });
        await wrappedRender();
        const triggerButton = getTrigger();
        await fireEvent.click(triggerButton);
        await waitFor(async () => {
          await expect(
            screen.getByText('Pending User Access'),
          ).toBeInTheDocument();
          expect(store.getInvites).toHaveBeenCalled();
        });
        expect(screen.getByText('John Doe')).toBeInTheDocument();

        const resendButton = screen.getByRole('button', {
          name: 'Resend email',
        });
        await fireEvent.click(resendButton);
        await waitFor(() => {
          expect(
            screen.getByText('Would you like to resend the invitation email?'),
          ).toBeInTheDocument();
        });
        const confirmButton = screen.getByRole('button', { name: 'Send' });
        await fireEvent.click(confirmButton);
        await waitFor(() => {
          expect(store.resendInvite).toHaveBeenCalled();
          expect(mockSuccess).toHaveBeenCalled();
        });
      });

      it('should fail resend invite', async () => {
        store.$patch({
          loading: false,
          invites: [
            {
              admin_user_onboarding_id: '1',
              first_name: 'John Doe',
              email: 'user@example.com',
            },
          ],
        });
        vi.spyOn(store, 'resendInvite').mockRejectedValue(() => new Error());
        await wrappedRender();
        const triggerButton = getTrigger();
        await fireEvent.click(triggerButton);
        await waitFor(async () => {
          await expect(
            screen.getByText('Pending User Access'),
          ).toBeInTheDocument();
          expect(store.getInvites).toHaveBeenCalled();
        });
        expect(screen.getByText('John Doe')).toBeInTheDocument();

        const resendButton = screen.getByRole('button', {
          name: 'Resend email',
        });
        await fireEvent.click(resendButton);
        await waitFor(() => {
          expect(
            screen.getByText('Would you like to resend the invitation email?'),
          ).toBeInTheDocument();
        });
        const confirmButton = screen.getByRole('button', { name: 'Send' });
        await fireEvent.click(confirmButton);
        await waitFor(() => {
          expect(store.resendInvite).toHaveBeenCalled();
          expect(mockError).toHaveBeenCalled();
        });
      });
    });
    describe('delete invite', () => {
      it('should delete invite', async () => {
        store.$patch({
          loading: false,
          invites: [
            {
              admin_user_onboarding_id: '1',
              first_name: 'John Doe',
              email: 'user@example.com',
            },
          ],
        });
        await wrappedRender();
        const triggerButton = getTrigger();
        await fireEvent.click(triggerButton);
        await waitFor(async () => {
          await expect(
            screen.getByText('Pending User Access'),
          ).toBeInTheDocument();
          expect(store.getInvites).toHaveBeenCalled();
        });
        expect(screen.getByText('John Doe')).toBeInTheDocument();

        const deleteButton = screen.getByRole('button', {
          name: 'Delete invite',
        });
        await fireEvent.click(deleteButton);
        await waitFor(() => {
          expect(
            screen.getByText('Are you sure you want to delete this invite?'),
          ).toBeInTheDocument();
        });
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        await fireEvent.click(confirmButton);
        await waitFor(() => {
          expect(store.deleteInvite).toHaveBeenCalled();
          expect(mockSuccess).toHaveBeenCalled();
        });
      });

      it('should fail resend invite', async () => {
        store.$patch({
          loading: false,
          invites: [
            {
              admin_user_onboarding_id: '1',
              first_name: 'John Doe',
              email: 'user@example.com',
            },
          ],
        });
        vi.spyOn(store, 'deleteInvite').mockRejectedValue(() => new Error());
        await wrappedRender();
        const triggerButton = getTrigger();
        await fireEvent.click(triggerButton);
        await waitFor(async () => {
          await expect(
            screen.getByText('Pending User Access'),
          ).toBeInTheDocument();
          expect(store.getInvites).toHaveBeenCalled();
        });
        expect(screen.getByText('John Doe')).toBeInTheDocument();

        const deleteButton = screen.getByRole('button', {
          name: 'Delete invite',
        });
        await fireEvent.click(deleteButton);
        await waitFor(() => {
          expect(
            screen.getByText('Are you sure you want to delete this invite?'),
          ).toBeInTheDocument();
        });
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        await fireEvent.click(confirmButton);
        await waitFor(() => {
          expect(store.deleteInvite).toHaveBeenCalled();
          expect(mockError).toHaveBeenCalled();
        });
      });
    });
  });
});
