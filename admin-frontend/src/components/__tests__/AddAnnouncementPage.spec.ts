import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AddAnnouncementPage from '../AddAnnouncementPage.vue';
import { de } from '@faker-js/faker';

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

describe('AddAnnouncementPage', () => {
  it('should render the form', async () => {
    const { getByRole, getByLabelText } = await wrappedRender();
    expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Save draft' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(getByLabelText('Title')).toBeInTheDocument();
    expect(getByLabelText('Description')).toBeInTheDocument();
    expect(getByLabelText('Publish On')).toBeInTheDocument();
    expect(getByLabelText('Expires On')).toBeInTheDocument();
    expect(getByRole('checkbox', { name: 'No expiry' })).toBeInTheDocument();
    expect(getByLabelText('Link URL')).toBeInTheDocument();
    expect(getByLabelText('Display Link As')).toBeInTheDocument();
  });
  it('should submit the form', async () => {
    const { getByRole, getByLabelText } = await wrappedRender();
    const publishButton = getByRole('button', { name: 'Publish' });
    const title = getByLabelText('Title');
    const description = getByLabelText('Description');
    const publishOn = getByLabelText('Publish On');
    const expiresOn = getByLabelText('Expires On');
    const linkUrl = getByLabelText('Link URL');
    const displayLinkAs = getByLabelText('Display Link As');
    await fireEvent.update(title, 'Test Title');
    await fireEvent.update(description, 'Test Description');
    await fireEvent.update(publishOn, '2022-12-31');
    await fireEvent.update(expiresOn, '2023-12-31');
    await fireEvent.update(linkUrl, 'https://example.com');
    await fireEvent.update(displayLinkAs, 'Example.pdf');
    await fireEvent.click(publishButton);
    await waitFor(() => {
      expect(mockAddAnnouncement).toHaveBeenCalledWith({
        title: 'Test Title',
        description: 'Test Description',
        published_on: '2022-12-31',
        expires_on: '2023-12-31',
        linkUrl: 'https://example.com',
        linkDisplayName: 'Example.pdf',
      });
      expect(mockSuccess).toHaveBeenCalled();
    });
  });
  it('should show error message when title is empty', () => {
    // test code
  });
  it('should show error message when description is empty', () => {
    // test code
  });
  it('should show error message when date is empty', () => {
    // test code
  });
  it('should show error message when date is invalid', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the future', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
  it('should show error message when date is in the past', () => {
    // test code
  });
});
