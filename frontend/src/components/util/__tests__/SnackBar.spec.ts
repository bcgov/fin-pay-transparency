import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import { VApp } from 'vuetify/components';
import * as directives from 'vuetify/directives';
import {
  INotification,
  NotificationSeverity,
} from '../../../common/notificationService';
import SnackBar from '../SnackBar.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub the global ResizeObserver
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

describe('SnackBar', () => {
  let wrapper;
  let snackbar;

  beforeEach(() => {
    //create an instance of vuetify so we can inject it
    //into the mounted component, allowing it to behave as it would
    //in a browser
    const vuetify = createVuetify({
      components,
      directives,
    });

    //mount the SnackBar within a VApp wrapper
    wrapper = mount(VApp, {
      slots: {
        default: h(SnackBar),
      },
      global: {
        plugins: [vuetify],
      },
    });
    snackbar = wrapper.findComponent(SnackBar);
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('when one notification event is received', () => {
    it('the snackbar becomes visible and displays the notification', async () => {
      const notification: INotification = {
        message: 'fake error message',
        severity: NotificationSeverity.ERROR,
        timeoutMs: 5000,
      };

      expect(snackbar.vm.isVisible).toBeFalsy();

      snackbar.vm.onNotificationEvent(notification);

      // Check that data values in the component were correctly modified
      expect(snackbar.vm.activeNotification).toStrictEqual(notification);
      expect(snackbar.vm.isVisible).toBeTruthy();
    });
  });

  describe('when close() is called', () => {
    it('the snackbar becomes hidden', async () => {
      snackbar.vm.isVisible = true;
      snackbar.vm.message = 'a message';

      snackbar.vm.close();

      // Check that data values in the component were correctly modified
      expect(snackbar.vm.activeNotification).toBe(null);
      expect(snackbar.vm.isVisible).toBeFalsy();
    });
  });

  describe('when processNextNotification(..) is called with another notification in the queue', () => {
    it('the current notification is replaced with the next one', async () => {
      const notification1: INotification = {
        message: 'notification 1',
        severity: NotificationSeverity.ERROR,
        timeoutMs: 5000,
      };
      const notification2: INotification = {
        message: 'notification 2',
        severity: NotificationSeverity.INFO,
        timeoutMs: 5000,
      };

      // Simulate receiving two notifications in quick succession
      snackbar.vm.onNotificationEvent(notification1);
      snackbar.vm.onNotificationEvent(notification2);

      // Check that the first notification is displayed
      expect(snackbar.vm.activeNotification).toStrictEqual(notification1);
      expect(snackbar.vm.isVisible).toBeTruthy();

      // Simulate the first notification expiring
      // (normally this happens after a few seconds,
      // but we trigger it immediately here)
      snackbar.vm.onNotificationExpired();

      // Check that the first notification is displayed
      expect(snackbar.vm.activeNotification).toStrictEqual(notification2);
      expect(snackbar.vm.isVisible).toBeTruthy();

      // Cause the second notification to expire
      snackbar.vm.onNotificationExpired();

      // Confirm that no more notifications are displayed
      expect(snackbar.vm.activeNotification).toBe(null);
      expect(snackbar.vm.isVisible).toBeFalsy();
    });
  });
});
