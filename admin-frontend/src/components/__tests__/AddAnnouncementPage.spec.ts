import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AddAnnouncementPage from '../AddAnnouncementPage.vue';

global.ResizeObserver = require('resize-observer-polyfill');
const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const wrappedRender = async () => {
  return render(AddAnnouncementPage, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const mockAddAnnouncement = vi.fn();

vi.mock('../../services/apiService', () => ({
  default: {
    addAnnouncement: (...args) => {
      console.log('mockAddAnnouncement.....', args);
      mockAddAnnouncement(...args);
    },
  },
}));

const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('../../services/notificationService', () => ({
  NotificationService: {
    pushNotificationSuccess: () => mockSuccess(),
    pushNotificationError: () => mockError(),
  },
}));

const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: (...args) => mockRouterPush(...args),
    back: () => mockRouterBack(),
  }),
}));

const setDate = async (field: HTMLElement, getDateCell: () => HTMLElement) => {
  await fireEvent.click(field);
  await waitFor(() => {
    screen.debug();
    const dateCell = getDateCell();
    expect(dateCell).toBeInTheDocument();
    fireEvent.click(dateCell!);
  });
};

const markAsPublish = async () => {
  const publishRadioButton = screen.getByRole('radio', { name: 'Publish' });
  await fireEvent.click(publishRadioButton);
};

describe('AddAnnouncementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should render the form', async () => {
    const { getByRole, getByLabelText } = await wrappedRender();
    expect(getByRole('radio', { name: 'Draft' })).toBeInTheDocument();
    expect(getByRole('radio', { name: 'Publish' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(getByLabelText('Title')).toBeInTheDocument();
    expect(getByLabelText('Description')).toBeInTheDocument();
    expect(getByLabelText('Publish On')).toBeInTheDocument();
    expect(getByLabelText('Expires On')).toBeInTheDocument();
    expect(getByRole('checkbox', { name: 'No expiry' })).toBeInTheDocument();
    expect(getByLabelText('Link URL')).toBeInTheDocument();
    expect(getByLabelText('Display Link As')).toBeInTheDocument();
  });
  it('should submit the form', async () => {
    const { getByRole, getByLabelText, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const title = getByLabelText('Title');
    const description = getByLabelText('Description');
    const linkUrl = getByLabelText('Link URL');
    const displayLinkAs = getByLabelText('Display Link As');
    await fireEvent.update(title, 'Test Title');
    await fireEvent.update(description, 'Test Description');
    const publishOn = getByLabelText('Publish On');
    const expiresOn = getByLabelText('Expires On');
    await setDate(publishOn, () => getByText('15'));
    await setDate(expiresOn, () => getByText('20'));
    await fireEvent.update(linkUrl, 'https://example.com');
    await fireEvent.update(displayLinkAs, 'Example.pdf');
    await markAsPublish();
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(
        screen.getByText('Are you sure you want to publish this announcement?'),
      ).toBeInTheDocument();
    });
    const continueButton = screen.getByRole('button', { name: 'Confirm' });
    await fireEvent.click(continueButton);
    await waitFor(() => {
      expect(mockAddAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          description: 'Test Description',
          published_on: expect.any(Date),
          expires_on: expect.any(Date),
          linkUrl: 'https://example.com',
          linkDisplayName: 'Example.pdf',
        }),
      );
      expect(mockSuccess).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith('/announcements');
    });
  });
  it('should not publish when confirmation cancel is clicked', async () => {
    const { getByRole, getByLabelText, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const title = getByLabelText('Title');
    const description = getByLabelText('Description');
    const linkUrl = getByLabelText('Link URL');
    const displayLinkAs = getByLabelText('Display Link As');
    await fireEvent.update(title, 'Test Title');
    await fireEvent.update(description, 'Test Description');
    const publishOn = getByLabelText('Publish On');
    const expiresOn = getByLabelText('Expires On');
    await setDate(publishOn, () => getByText('15'));
    await setDate(expiresOn, () => getByText('20'));
    await fireEvent.update(linkUrl, 'https://example.com');
    await fireEvent.update(displayLinkAs, 'Example.pdf');
    await markAsPublish();
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(
        screen.getByText('Are you sure you want to publish this announcement?'),
      ).toBeInTheDocument();
    });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(mockAddAnnouncement).not.toHaveBeenCalled();
    });
  });
  it('should show error message when title is empty', async () => {
    const { getByRole, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(getByText('Title is required.')).toBeInTheDocument();
    });
  });
  it('should show error message when title is more than 100 characters', async () => {
    const { getByRole, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const title = screen.getByLabelText('Title');
    await fireEvent.update(title, 'a'.repeat(101));
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(
        getByText('Title should have a maximum of 100 characters.'),
      ).toBeInTheDocument();
    });
  });
  it('should show error message when description is empty', async () => {
    const { getByRole, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(getByText('Description is required.')).toBeInTheDocument();
    });
  });
  it('should show error message when description is more than 2000 characters', async () => {
    const { getByRole, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const description = screen.getByLabelText('Description');
    await fireEvent.update(description, 'a'.repeat(3000));
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(
        getByText('Description should have a maximum of 2000 characters.'),
      ).toBeInTheDocument();
    });
  });
  it('should show error message when publish date is empty and attempting to publish', async () => {
    const { getByRole, getByLabelText, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const title = getByLabelText('Title');
    const description = getByLabelText('Description');
    const linkUrl = getByLabelText('Link URL');
    const displayLinkAs = getByLabelText('Display Link As');
    await fireEvent.update(title, 'Test Title');
    await fireEvent.update(description, 'Test Description');
    await fireEvent.update(linkUrl, 'https://example.com');
    await fireEvent.update(displayLinkAs, 'Example.pdf');
    await markAsPublish();
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(getByText('Publish date is required.')).toBeInTheDocument();
    });
  });

  describe('when published date is greater than expiry date', () => {
    it('should show error message', async () => {
      const { getByRole, getByLabelText, getByText } = await wrappedRender();
      const saveButton = getByRole('button', { name: 'Save' });
      const title = getByLabelText('Title');
      const description = getByLabelText('Description');
      const linkUrl = getByLabelText('Link URL');
      const displayLinkAs = getByLabelText('Display Link As');
      await fireEvent.update(title, 'Test Title');
      await fireEvent.update(description, 'Test Description');
      const publishOn = getByLabelText('Publish On');
      const expiresOn = getByLabelText('Expires On');
      await setDate(publishOn, () => getByText('20'));
      await setDate(expiresOn, () => getByText('15'));
      await fireEvent.update(linkUrl, 'https://example.com');
      await fireEvent.update(displayLinkAs, 'Example.pdf');
      await markAsPublish();
      await fireEvent.click(saveButton);
      expect(mockAddAnnouncement).not.toHaveBeenCalled();
    });
  });
  it('should show error message when link url is invalid', async () => {
    const { getByRole, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const linkUrl = screen.getByLabelText('Link URL');
    await fireEvent.update(linkUrl, 'a'.repeat(50));
    await fireEvent.click(saveButton);
    await markAsPublish();
    await waitFor(() => {
      expect(getByText('Invalid URL.')).toBeInTheDocument();
    });
  });

  describe('when link url is not empty', () => {
    describe('when display link as is empty', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText } = await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const description = getByLabelText('Description');
        const publishOn = getByLabelText('Publish On');
        const expiresOn = getByLabelText('Expires On');
        const linkUrl = getByLabelText('Link URL');
        await fireEvent.update(title, 'Test Title');
        await fireEvent.update(description, 'Test Description');
        await setDate(publishOn, () => getByText('15'));
        await setDate(expiresOn, () => getByText('20'));
        await fireEvent.update(linkUrl, 'https://example.com');
        await markAsPublish();
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(
            getByText('Link display name is required.'),
          ).toBeInTheDocument();
        });
      });
    });
  });

  describe('when link display name is not empty', () => {
    describe('link display name is more than 100 characters', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText } = await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const description = getByLabelText('Description');
        const publishOn = getByLabelText('Publish On');
        const expiresOn = getByLabelText('Expires On');
        const linkUrl = getByLabelText('Link URL');
        const displayLinkAs = getByLabelText('Display Link As');
        await fireEvent.update(title, 'Test Title');
        await fireEvent.update(description, 'Test Description');
        await setDate(publishOn, () => getByText('15'));
        await setDate(expiresOn, () => getByText('20'));
        await fireEvent.update(linkUrl, 'https://example.com');
        await fireEvent.update(displayLinkAs, 'a'.repeat(101));
        await markAsPublish();
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(
            getByText(
              'Link display name should not be more than 100 characters.',
            ),
          ).toBeInTheDocument();
        });
      });
    });
    describe('when link url is empty', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const description = getByLabelText('Description');
        const publishOn = getByLabelText('Publish On');
        const expiresOn = getByLabelText('Expires On');
        const displayLinkAs = getByLabelText('Display Link As');
        await fireEvent.update(title, 'Test Title');
        await fireEvent.update(description, 'Test Description');
        await setDate(publishOn, () => getByText('15'));
        await setDate(expiresOn, () => getByText('20'));
        await fireEvent.update(displayLinkAs, 'Example.pdf');
        await markAsPublish();
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(getByText('Link URL is required.')).toBeInTheDocument();
        });
      });
    });
  });
  describe('when file name is not empty', () => {
    describe('file name is more than 100 characters', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText } = await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const description = getByLabelText('Description');
        const publishOn = getByLabelText('Publish On');
        const expiresOn = getByLabelText('Expires On');
        const linkUrl = getByLabelText('Link URL');
        const displayLinkAs = getByLabelText('Display Link As');
        const fileName = getByLabelText('File Name');
        await fireEvent.update(title, 'Test Title');
        await fireEvent.update(description, 'Test Description');
        await setDate(publishOn, () => getByText('15'));
        await setDate(expiresOn, () => getByText('20'));
        await fireEvent.update(linkUrl, 'https://example.com');
        await fireEvent.update(displayLinkAs, 'a'.repeat(50));
        await fireEvent.update(fileName, 'a'.repeat(101));
        await markAsPublish();
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(
            getByText('File name should not be more than 100 characters.'),
          ).toBeInTheDocument();
        });
      });
    });
    describe('when link url is empty', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const description = getByLabelText('Description');
        const publishOn = getByLabelText('Publish On');
        const expiresOn = getByLabelText('Expires On');
        const displayLinkAs = getByLabelText('Display Link As');
        await fireEvent.update(title, 'Test Title');
        await fireEvent.update(description, 'Test Description');
        await setDate(publishOn, () => getByText('15'));
        await setDate(expiresOn, () => getByText('20'));
        await fireEvent.update(displayLinkAs, 'Example.pdf');
        await markAsPublish();
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(getByText('Link URL is required.')).toBeInTheDocument();
        });
      });
    });
  });

  describe('when no expiry is checked', () => {
    it('should disable the expires on field', async () => {
      const { getByRole, getByLabelText } = await wrappedRender();
      const noExpiry = getByRole('checkbox', { name: 'No expiry' });
      const expiresOn = getByLabelText('Expires On');
      await fireEvent.click(noExpiry);
      expect(expiresOn).toBeDisabled();
      expect(expiresOn).toHaveValue('');
    });
  });

  describe('when no expiry is unchecked', () => {
    it('should enable the expires on field', async () => {
      const { getByRole, getByLabelText } = await wrappedRender();
      const noExpiry = getByRole('checkbox', { name: 'No expiry' });
      const expiresOn = getByLabelText('Expires On');
      await fireEvent.click(noExpiry);
      await fireEvent.click(noExpiry);
      expect(expiresOn).toBeEnabled();
    });
  });

  describe('when add announcement fails', () => {
    it('should show error message', async () => {
      mockAddAnnouncement.mockImplementation(() => {
        throw new Error('Failed to add announcement');
      });
      const { getByRole, getByLabelText } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
      const title = getByLabelText('Title');
      const description = getByLabelText('Description');
      const linkUrl = getByLabelText('Link URL');
      const displayLinkAs = getByLabelText('Display Link As');
      await fireEvent.update(title, 'Test Title');
      await fireEvent.update(description, 'Test Description');
      const publishOn = getByLabelText('Publish On');
      const expiresOn = getByLabelText('Expires On');
      await setDate(publishOn, () => screen.getByText('15'));
      await setDate(expiresOn, () => screen.getByText('20'));
      await fireEvent.update(linkUrl, 'https://example.com');
      await fireEvent.update(displayLinkAs, 'Example.pdf');
      await markAsPublish();
      await fireEvent.click(saveButton);
      await waitFor(() => {
        expect(
          screen.getByText(
            'Are you sure you want to publish this announcement?',
          ),
        ).toBeInTheDocument();
      });
      const continueButton = screen.getByRole('button', { name: 'Confirm' });
      await fireEvent.click(continueButton);
      await waitFor(() => {
        expect(mockError).toHaveBeenCalled();
      });
    });
  });

  describe('when cancel button is clicked', () => {
    it('should navigate to announcements page', async () => {
      const { getByRole } = await wrappedRender();
      const cancelButton = getByRole('button', { name: 'Cancel' });
      await fireEvent.click(cancelButton);
      await waitFor(() => {
        expect(mockRouterBack).toHaveBeenCalled();
      });
    });

    describe('when form is dirty', () => {
      it('should show confirmation dialog', async () => {
        const { getByRole } = await wrappedRender();
        const title = screen.getByLabelText('Title');
        await fireEvent.update(title, 'Test Title');
        const cancelButton = getByRole('button', { name: 'Cancel' });
        await fireEvent.click(cancelButton);
        await waitFor(() => {
          expect(
            screen.getByText(
              'Are you sure want to cancel this changes. This process cannot be undone.',
            ),
          ).toBeInTheDocument();
        });

        const continueButton = screen.getByRole('button', { name: 'Continue' });
        await fireEvent.click(continueButton);
        await waitFor(() => {
          expect(mockRouterBack).toHaveBeenCalled();
        });
      });
    });
  });
});
