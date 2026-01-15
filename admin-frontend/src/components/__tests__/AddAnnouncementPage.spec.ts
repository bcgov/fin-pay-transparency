import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { createTestingPinia } from '@pinia/testing';
import { userEvent } from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AddAnnouncementPage from '../AddAnnouncementPage.vue';

const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

/**
 * Gets the dom element within the rich text editor which contains the
 * rich text as its inner html
 */
const getRichTextElement = (container, id) => {
  const elem = container.querySelector(`#${id} .ql-editor`);
  return elem;
};

/**
 * A helper function to set the value of a RichTextArea component.
 * id is the value of the rich text area's "id" attribute in the DOM.
 */
const setRichTextValue = (container, id, value = '') => {
  const elem = getRichTextElement(container, id);
  if (elem) {
    elem.innerHTML = value;
  }
};

const wrappedRender = async () => {
  return render(AddAnnouncementPage, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const mockAddAnnouncement = vi.fn();
const mockGetAnnouncement = vi.fn();
const mockClamavScanFile = vi.fn();
vi.mock('../../services/apiService', () => ({
  default: {
    addAnnouncement: (...args) => {
      mockAddAnnouncement(...args);
    },
    getAnnouncements: (...args) => {
      mockGetAnnouncement(...args);
    },
    clamavScanFile: (...args) => {
      return mockClamavScanFile(...args);
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

const formatDate = (date: LocalDate) => {
  return date.format(
    DateTimeFormatter.ofPattern('EEEE d MMMM yyyy').withLocale(Locale.CANADA),
  );
};

const setDate = async (field: HTMLElement, getDateCell: () => HTMLElement) => {
  await fireEvent.click(field);
  await waitFor(() => {
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
    const { getByRole, getByLabelText, container } = await wrappedRender();
    expect(getByRole('radio', { name: 'Draft' })).toBeInTheDocument();
    expect(getByRole('radio', { name: 'Publish' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(getByLabelText('Title')).toBeInTheDocument();
    expect(
      getRichTextElement(container, 'announcementDescription'),
    ).toBeInTheDocument();
    expect(getByLabelText('Active On')).toBeInTheDocument();
    expect(getByLabelText('Expires On')).toBeInTheDocument();
    expect(getByRole('checkbox', { name: 'No expiry' })).toBeInTheDocument();
    expect(getByLabelText('Link URL')).toBeInTheDocument();
    expect(getByLabelText('Display URL As')).toBeInTheDocument();
  });
  it('should submit the form', async () => {
    const { getByRole, getByLabelText, container } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const title = getByLabelText('Title');
    const linkUrl = getByLabelText('Link URL');
    const displayLinkAs = getByLabelText('Display URL As');
    await fireEvent.update(title, 'Test Title');
    setRichTextValue(container, 'announcementDescription', 'Test description');
    const activeOn = getByLabelText('Active On');
    const activeOnDate = formatDate(LocalDate.now());
    await setDate(activeOn, () => {
      return getByLabelText(activeOnDate);
    });
    const noExpiry = getByRole('checkbox', { name: 'No expiry' });
    await fireEvent.click(noExpiry);
    await fireEvent.update(linkUrl, 'https://example.com');
    await fireEvent.update(displayLinkAs, 'Example.pdf');
    await markAsPublish();
    await fireEvent.click(saveButton);
    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Confirm' });
      await fireEvent.click(confirmButton);
    });
    await waitFor(() => {
      expect(mockAddAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          description: '<p>Test description</p>',
          active_on: expect.any(String),
          expires_on: undefined,
          linkUrl: 'https://example.com',
          linkDisplayName: 'Example.pdf',
        }),
      );
      expect(mockSuccess).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith('/announcements');
    });
  });
  it('should submit the form as draft', async () => {
    const { getByRole, getByLabelText, container } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const title = getByLabelText('Title');
    const linkUrl = getByLabelText('Link URL');
    const displayLinkAs = getByLabelText('Display URL As');
    await fireEvent.update(title, 'Test Title');
    setRichTextValue(container, 'announcementDescription', 'Test description');
    await fireEvent.update(linkUrl, 'https://example.com');
    await fireEvent.update(displayLinkAs, 'Example.pdf');
    await fireEvent.click(saveButton);
    await waitFor(async () => {
      const confirmButton = getByRole('button', { name: 'Confirm' });
      await fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(mockAddAnnouncement).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          description: '<p>Test description</p>',
          linkUrl: 'https://example.com',
          linkDisplayName: 'Example.pdf',
        }),
      );
      expect(mockSuccess).toHaveBeenCalled();
      expect(mockRouterPush).toHaveBeenCalledWith('/announcements');
    });
  });

  describe('when no expiry is not checked', () => {
    it('should display expiry date is required error message', async () => {
      const { getByRole, getByLabelText, getByText, container } =
        await wrappedRender();
      const saveButton = getByRole('button', { name: 'Save' });
      const title = getByLabelText('Title');
      const linkUrl = getByLabelText('Link URL');
      const displayLinkAs = getByLabelText('Display URL As');
      await fireEvent.update(title, 'Test Title');
      setRichTextValue(
        container,
        'announcementDescription',
        'Test description',
      );
      await fireEvent.update(linkUrl, 'https://example.com');
      await fireEvent.update(displayLinkAs, 'Example.pdf');
      const activeOn = getByLabelText('Active On');
      const activeOnDate = formatDate(LocalDate.now());
      await setDate(activeOn, () => {
        return getByLabelText(activeOnDate);
      });
      await fireEvent.update(linkUrl, 'https://example.com');
      await fireEvent.update(displayLinkAs, 'Example.pdf');
      await markAsPublish();
      await fireEvent.click(saveButton);
      await waitFor(() => {
        expect(getByText('Please choose an Expiry date.')).toBeInTheDocument();
      });
    });
  });
  it('should not publish when confirmation cancel is clicked', async () => {
    const { getByRole, getByLabelText, container } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const title = getByLabelText('Title');
    const linkUrl = getByLabelText('Link URL');
    const displayLinkAs = getByLabelText('Display URL As');
    await fireEvent.update(title, 'Test Title');
    setRichTextValue(container, 'announcementDescription', 'Test description');
    const activeOn = getByLabelText('Active On');
    const activeOnDate = formatDate(LocalDate.now());
    await setDate(activeOn, () => {
      return getByLabelText(activeOnDate);
    });
    const noExpiry = getByRole('checkbox', { name: 'No expiry' });
    await fireEvent.click(noExpiry);
    await fireEvent.update(linkUrl, 'https://example.com');
    await fireEvent.update(displayLinkAs, 'Example.pdf');
    await markAsPublish();
    await fireEvent.click(saveButton);
    await waitFor(async () => {
      const cancelButton = getByRole('button', { name: 'Cancel' });
      await fireEvent.click(cancelButton);
    });
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
    const { getByRole, getByText, container } = await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    setRichTextValue(container, 'announcementDescription', 'a'.repeat(3000));
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(
        getByText('Description should have a maximum of 2000 characters.'),
      ).toBeInTheDocument();
    });
  });
  it('should show error message when Active On date is empty and attempting to publish', async () => {
    const { getByRole, getByLabelText, getByText, container } =
      await wrappedRender();
    const saveButton = getByRole('button', { name: 'Save' });
    const title = getByLabelText('Title');
    const linkUrl = getByLabelText('Link URL');
    const displayLinkAs = getByLabelText('Display URL As');
    await fireEvent.update(title, 'Test Title');
    setRichTextValue(container, 'announcementDescription', 'Test description');
    await fireEvent.update(linkUrl, 'https://example.com');
    await fireEvent.update(displayLinkAs, 'Example.pdf');
    await markAsPublish();
    await fireEvent.click(saveButton);
    await waitFor(() => {
      expect(getByText('Active On date is required.')).toBeInTheDocument();
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
    describe('when Display URL As is empty', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText, container } =
          await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const linkUrl = getByLabelText('Link URL');
        await fireEvent.update(title, 'Test Title');
        setRichTextValue(
          container,
          'announcementDescription',
          'Test description',
        );
        const activeOn = getByLabelText('Active On');
        const activeOnDate = formatDate(LocalDate.now());
        await setDate(activeOn, () => {
          return getByLabelText(activeOnDate);
        });
        const noExpiry = getByRole('checkbox', { name: 'No expiry' });
        await fireEvent.click(noExpiry);
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
    describe('link link url is more than 255 characters', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText, container } =
          await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const linkUrl = getByLabelText('Link URL');
        const displayLinkAs = getByLabelText('Display URL As');
        await fireEvent.update(title, 'Test Title');
        setRichTextValue(
          container,
          'announcementDescription',
          'Test description',
        );
        const activeOn = getByLabelText('Active On');
        const activeOnDate = formatDate(LocalDate.now());
        await setDate(activeOn, () => {
          return getByLabelText(activeOnDate);
        });
        await fireEvent.update(linkUrl, 'https://' + 'x'.repeat(255));
        await fireEvent.update(displayLinkAs, 'a');
        await markAsPublish();
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(
            getByText(
              'URL max length is 255 characters. Please shorten the URL.',
            ),
          ).toBeInTheDocument();
        });
      });
    });
  });

  describe('when link display name is not empty', () => {
    describe('link display name is more than 100 characters', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText, container } =
          await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const linkUrl = getByLabelText('Link URL');
        const displayLinkAs = getByLabelText('Display URL As');
        await fireEvent.update(title, 'Test Title');
        setRichTextValue(
          container,
          'announcementDescription',
          'Test description',
        );
        const activeOn = getByLabelText('Active On');
        const activeOnDate = formatDate(LocalDate.now());
        await setDate(activeOn, () => {
          return getByLabelText(activeOnDate);
        });
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
        const { getByRole, getByLabelText, getByText, container } =
          await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const displayLinkAs = getByLabelText('Display URL As');
        await fireEvent.update(title, 'Test Title');
        setRichTextValue(
          container,
          'announcementDescription',
          'Test description',
        );
        const activeOn = getByLabelText('Active On');
        const activeOnDate = formatDate(LocalDate.now());
        await setDate(activeOn, () => {
          return getByLabelText(activeOnDate);
        });
        const noExpiry = getByRole('checkbox', { name: 'No expiry' });
        await fireEvent.click(noExpiry);
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
        const { getByRole, getByLabelText, getByText, container } =
          await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const fileName = getByLabelText('Display File Link As');
        await fireEvent.update(title, 'Test Title');
        setRichTextValue(
          container,
          'announcementDescription',
          'Test description',
        );
        const activeOn = getByLabelText('Active On');
        const activeOnDate = formatDate(LocalDate.now());
        await setDate(activeOn, () => {
          return getByLabelText(activeOnDate);
        });
        const noExpiry = getByRole('checkbox', { name: 'No expiry' });
        await fireEvent.click(noExpiry);
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
    describe('when file is empty', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText, container } =
          await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const displayLinkAs = getByLabelText('Display File Link As');
        await fireEvent.update(title, 'Test Title');
        setRichTextValue(
          container,
          'announcementDescription',
          'Test description',
        );
        const activeOn = getByLabelText('Active On');
        const activeOnDate = formatDate(LocalDate.now());
        await setDate(activeOn, () => {
          return getByLabelText(activeOnDate);
        });
        const noExpiry = getByRole('checkbox', { name: 'No expiry' });
        await fireEvent.click(noExpiry);
        await fireEvent.update(displayLinkAs, 'Example.pdf');
        await markAsPublish();
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(getByText('File attachment is required.')).toBeInTheDocument();
        });
      });
    });
  });
  describe('when file is not empty', () => {
    describe('when file name is empty', () => {
      it('should show error message', async () => {
        const { getByRole, getByLabelText, getByText, container } =
          await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        const title = getByLabelText('Title');
        const attachment = getByLabelText('Attachment');
        const file = new File(['hello'], 'chucknorris.png', {
          type: 'image/png',
        });
        await waitFor(() => userEvent.upload(attachment, file));
        await waitFor(() => {
          expect(mockClamavScanFile).toHaveBeenCalled();
        });
        await fireEvent.update(title, 'Test Title');
        setRichTextValue(
          container,
          'announcementDescription',
          'Test description',
        );
        const activeOn = getByLabelText('Active On');
        const activeOnDate = formatDate(LocalDate.now());
        await setDate(activeOn, () => {
          return getByLabelText(activeOnDate);
        });
        const noExpiry = getByRole('checkbox', { name: 'No expiry' });
        await fireEvent.click(noExpiry);
        await markAsPublish();
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(
            getByText('File display text is required.'),
          ).toBeInTheDocument();
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
  describe('file upload', () => {
    describe('when clamav scan fails', () => {
      it('should show error message', async () => {
        mockClamavScanFile.mockImplementation(() => {
          console.log('mockClamavScanFile..... 11111');
          throw new Error('Failed to scan file');
        });
        const { getByLabelText, getByText } = await wrappedRender();
        const attachment = getByLabelText('Attachment');
        const file = new File(['hello'], 'chucknorris.png', {
          type: 'image/png',
        });
        await waitFor(() => userEvent.upload(attachment, file));
        await waitFor(() => {
          expect(mockClamavScanFile).toHaveBeenCalled();
        });
        await waitFor(() => {
          expect(getByText('File is invalid.')).toBeInTheDocument();
        });
      });
    });
    describe('when clamav scan pass', () => {
      it('should not show error message', async () => {
        mockClamavScanFile.mockResolvedValue({});
        const { getByLabelText, queryByText } = await wrappedRender();
        const attachment = getByLabelText('Attachment');
        const file = new File(['hello'], 'chucknorris.png', {
          type: 'image/png',
        });
        await waitFor(() => userEvent.upload(attachment, file));
        await waitFor(() => {
          expect(mockClamavScanFile).toHaveBeenCalled();
        });
        await waitFor(() => {
          expect(queryByText('File is invalid.')).toBeNull();
        });
      });
    });
  });

  describe('when add announcement fails', () => {
    it('should show error message', async () => {
      mockAddAnnouncement.mockImplementation(() => {
        throw new Error('Failed to add announcement');
      });
      const { getByRole, getByLabelText, container } = await wrappedRender();
      const saveButton = getByRole('button', { name: 'Save' });
      const title = getByLabelText('Title');

      const linkUrl = getByLabelText('Link URL');
      const displayLinkAs = getByLabelText('Display URL As');
      await fireEvent.update(title, 'Test Title');

      const description = container.querySelector(
        '#announcementDescription .ql-editor',
      );
      expect(description).toBeInTheDocument();
      if (description) {
        description.innerHTML = '<p>description</p>';
      }

      const activeOn = getByLabelText('Active On');
      const activeOnDate = formatDate(LocalDate.now());
      await setDate(activeOn, () => {
        return getByLabelText(activeOnDate);
      });
      const noExpiry = getByRole('checkbox', { name: 'No expiry' });
      await fireEvent.click(noExpiry);
      await fireEvent.update(linkUrl, 'https://example.com');
      await fireEvent.update(displayLinkAs, 'Example.pdf');
      await markAsPublish();
      await fireEvent.click(saveButton);

      await waitFor(async () => {
        const confirmButton = getByRole('button', { name: 'Confirm' });
        await fireEvent.click(confirmButton);
      });
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
