import { createTestingPinia } from '@pinia/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AddUserButton from '../AddUserButton.vue';

import {
  ADMIN_ROLE_NAME,
  RoleLabels,
  USER_ROLE_NAME,
} from '../../../constants';

global.ResizeObserver = require('resize-observer-polyfill');
const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const wrappedRender = async () => {
  return render(AddUserButton, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const mockAddInvite = vi.fn();
vi.mock('../../../store/modules/userInvitesStore', () => ({
  useInvitesStore: () => ({
    addInvite: () => {
      mockAddInvite();
    },
  }),
}));

const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('../../../services/notificationService', () => ({
  NotificationService: {
    pushNotificationSuccess: () => mockSuccess(),
    pushNotificationError: () => mockError(),
  },
}));

describe('AddUserButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });
  it('should render correctly', async () => {
    await wrappedRender();
    expect(
      screen.getByRole('button', { name: 'Add New User' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Continue' }),
    ).not.toBeInTheDocument();
  });

  it('should display dialog when button is clicked', async () => {
    const wrapper = await wrappedRender();
    const button = wrapper.getByRole('button', { name: 'Add New User' });
    await fireEvent.click(button);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: RoleLabels[ADMIN_ROLE_NAME] }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: RoleLabels[USER_ROLE_NAME] }),
    ).toBeInTheDocument();
  });

  describe('when form is has errors', () => {
    it('should display error messages', async () => {
      const wrapper = await wrappedRender();
      const button = wrapper.getByRole('button', { name: 'Add New User' });
      await fireEvent.click(button);
      const submitButton = screen.getByRole('button', { name: 'Add' });
      await fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText('Name is required.')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText('Email is required.')).toBeInTheDocument();
      });
    });

    it('email field should respect the suffix', async () => {
      const wrapper = await wrappedRender();
      const button = wrapper.getByRole('button', { name: 'Add New User' });
      await fireEvent.click(button);
      const emailInput = screen.getByRole('textbox', { name: 'Email' });
      await fireEvent.update(emailInput, 'username@gov.bc.ca');
      await waitFor(() => {
        expect(
          screen.getByText('Should not contain a "@"" symbol'),
        ).toBeInTheDocument();
      });
    });
  });

  it('should close dialog when cancel button is clicked', async () => {
    const wrapper = await wrappedRender();
    const button = wrapper.getByRole('button', { name: 'Add New User' });
    await fireEvent.click(button);
    // Use the presence of the 'Add' button as evidence that the whole
    // 'Add New User' dialog is visible.
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await fireEvent.click(cancelButton);
    expect(
      screen.queryByRole('button', { name: 'Add' }),
    ).not.toBeInTheDocument();
  });

  it('should call addUser when form is submitted', async () => {
    const wrapper = await wrappedRender();
    const button = wrapper.getByRole('button', { name: 'Add New User' });
    await fireEvent.click(button);
    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    await fireEvent.update(nameInput, 'Test User');
    await fireEvent.update(emailInput, 'name.last');
    await fireEvent.blur(nameInput);
    await fireEvent.blur(emailInput);

    expect(screen.queryByRole('button', { name: 'Continue' })).toBeDefined();
    const submitButton = screen.getByRole('button', { name: 'Add' });
    expect(screen.queryByText('Confirm User Addition')).not.toBeInTheDocument();

    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Confirm User Addition')).toBeVisible();
    });
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    await fireEvent.click(continueButton);
    await waitFor(() => {
      expect(mockAddInvite).toHaveBeenCalled();
    });
    expect(mockSuccess).toHaveBeenCalled();
  });

  it('should alert error if addUser fails', async () => {
    mockAddInvite.mockImplementation(() => {
      throw new Error('Failed to add user');
    });
    const wrapper = await wrappedRender();
    const button = wrapper.getByRole('button', { name: 'Add New User' });
    await fireEvent.click(button);
    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    await fireEvent.update(nameInput, 'Test User');
    await fireEvent.update(emailInput, 'name.last');
    await fireEvent.blur(nameInput);
    await fireEvent.blur(emailInput);

    expect(screen.queryByRole('button', { name: 'Continue' })).toBeDefined();
    const submitButton = screen.getByRole('button', { name: 'Add' });
    expect(screen.queryByText('Confirm User Addition')).not.toBeInTheDocument();

    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Confirm User Addition')).toBeVisible();
    });
    const continueButton = screen.getByRole('button', { name: 'Continue' });
    await fireEvent.click(continueButton);
    await waitFor(() => {
      expect(mockAddInvite).toHaveBeenCalled();
    });
    expect(mockError).toHaveBeenCalled();
  });

  it('should not submit form when cancel button is clicked', async () => {
    const wrapper = await wrappedRender();
    const button = wrapper.getByRole('button', { name: 'Add New User' });
    await fireEvent.click(button);
    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const emailInput = screen.getByRole('textbox', { name: 'Email' });
    await fireEvent.update(nameInput, 'Test User');
    await fireEvent.update(emailInput, 'name.last');
    await fireEvent.blur(nameInput);
    await fireEvent.blur(emailInput);

    expect(screen.queryByRole('button', { name: 'Continue' })).toBeDefined();
    const submitButton = screen.getByRole('button', { name: 'Add' });
    expect(screen.queryByText('Confirm User Addition')).not.toBeInTheDocument();

    await fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Confirm User Addition')).toBeVisible();
    });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add' })).toBeVisible();
    });
    expect(mockAddInvite).not.toHaveBeenCalled();
  });
});
