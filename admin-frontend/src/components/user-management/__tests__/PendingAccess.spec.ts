import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import PendingAccess from '../PendingAccess.vue';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { useInvitesStore } from '../../../store/modules/userInvitesStore';
import { setActivePinia, createPinia } from 'pinia';

const mockGetPendingUserInvites = vi.fn();
const mockResendUserInvite = vi.fn();
const mockDeleteUserInvite = vi.fn();
vi.mock('../../../services/apiService', () => ({
  default: {
    getPendingUserInvites: () => mockGetPendingUserInvites(),
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
const pinia = createPinia();
setActivePinia(pinia);
const wrappedRender = async () => {
  return render(PendingAccess, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const getTrigger = () => screen.getByRole('button', { name: 'Pending Access' });

describe('PendingAccess', () => {
  let store: ReturnType<typeof useInvitesStore>;
  beforeEach(() => {
    vi.clearAllMocks();
    // setActivePinia(createPinia());
    store = useInvitesStore();
  });

  it('should render correctly', async () => {
    await wrappedRender();
    expect(getTrigger()).toBeInTheDocument();
  });

  it('should close the dialog', async () => {
    mockGetPendingUserInvites.mockResolvedValue({
      data: [],
    });
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
      mockGetPendingUserInvites.mockResolvedValue({
        data: [],
      });
      await wrappedRender();
      const triggerButton = getTrigger();
      await fireEvent.click(triggerButton);
      await waitFor(() => {
        expect(mockGetPendingUserInvites).toHaveBeenCalled();
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
      mockGetPendingUserInvites.mockResolvedValue({
        data: [],
      });
      await wrappedRender();
      const triggerButton = getTrigger();
      await fireEvent.click(triggerButton);
      await waitFor(() => {
        expect(mockGetPendingUserInvites).toHaveBeenCalled();
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
      mockGetPendingUserInvites.mockResolvedValue({
        data: [
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
        expect(mockGetPendingUserInvites).toHaveBeenCalled();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    describe('resend invite', () => {
      it('should resend invite', async () => {
        mockGetPendingUserInvites.mockResolvedValue({
          data: [
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
          expect(mockGetPendingUserInvites).toHaveBeenCalled();
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
          expect(mockResendUserInvite).toHaveBeenCalled();
          expect(mockSuccess).toHaveBeenCalled();
        });
      });

      it('should fail resend invite', async () => {
        mockGetPendingUserInvites.mockResolvedValue({
          data: [
            {
              admin_user_onboarding_id: '1',
              first_name: 'John Doe',
              email: 'user@example.com',
            },
          ],
        });
        mockResendUserInvite.mockRejectedValue(
          new Error('Failed to resend invite'),
        );
        await wrappedRender();
        const triggerButton = getTrigger();
        await fireEvent.click(triggerButton);
        await waitFor(async () => {
          await expect(
            screen.getByText('Pending User Access'),
          ).toBeInTheDocument();
          expect(mockGetPendingUserInvites).toHaveBeenCalled();
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
          expect(mockResendUserInvite).toHaveBeenCalled();
          expect(mockError).toHaveBeenCalled();
        });
      });
    });
    describe('delete invite', () => {
      it('should delete invite', async () => {
        mockGetPendingUserInvites.mockResolvedValue({
          data: [
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
          expect(mockGetPendingUserInvites).toHaveBeenCalled();
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
          expect(mockDeleteUserInvite).toHaveBeenCalled();
          expect(mockSuccess).toHaveBeenCalled();
        });
      });

      it('should fail resend invite', async () => {
        mockGetPendingUserInvites.mockResolvedValue({
          data: [
            {
              admin_user_onboarding_id: '1',
              first_name: 'John Doe',
              email: 'user@example.com',
            },
          ],
        });
        mockDeleteUserInvite.mockRejectedValue(
          new Error('Failed to delete invite'),
        );
        await wrappedRender();
        const triggerButton = getTrigger();
        await fireEvent.click(triggerButton);
        await waitFor(async () => {
          await expect(
            screen.getByText('Pending User Access'),
          ).toBeInTheDocument();
          expect(mockGetPendingUserInvites).toHaveBeenCalled();
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
          expect(mockDeleteUserInvite).toHaveBeenCalled();
          expect(mockError).toHaveBeenCalled();
        });
      });
    });
  });
});
