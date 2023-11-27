import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createVuetify } from "vuetify";
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { Notification, NotificationTypes } from '../../../common/notificationService';
import SnackBar from '../SnackBar.vue';

describe("SnackBar", () => {
  let wrapper;

  beforeEach(() => {

    //create an instance of vuetify so we can inject it 
    //into the mounted component, allowing it to behave as it would
    //in a browser
    const vuetify = createVuetify({
      components,
      directives,
    })

    wrapper = mount(SnackBar, {
      global: {
        plugins: [vuetify],
      }
    })

  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  })

  describe("when one notification event is received", () => {
    it("the snackbar becomes visible and displays the notification", async () => {
      const notification: Notification = {
        message: "fake error message",
        severity: NotificationTypes.NOTIFICATION_ERROR
      };

      expect(wrapper.vm.isVisible).toBeFalsy()

      wrapper.vm.onNotificationEvent(notification);

      // Check that data values in the component were correctly modified
      expect(wrapper.vm.message).toBe(notification.message);
      expect(wrapper.vm.isVisible).toBeTruthy();


    })
  })

  describe("when close() is called", () => {
    it("the snackbar becomes hidden", async () => {

      wrapper.vm.isVisible = true;
      wrapper.vm.message = "a message";

      wrapper.vm.close();

      // Check that data values in the component were correctly modified
      expect(wrapper.vm.message).toBe(null);
      expect(wrapper.vm.isVisible).toBeFalsy();

    })
  })

  describe("when processNextNotification(..) is called with another notification in the queue", () => {
    it("the current notification is replaced with the next one", async () => {

      const notification1: Notification = {
        message: "notification 1",
        severity: NotificationTypes.NOTIFICATION_ERROR
      };
      const notification2: Notification = {
        message: "notification 2",
        severity: NotificationTypes.NOTIFICATION_INFO
      };

      // Simulate receiving two notifications in quick succession
      wrapper.vm.onNotificationEvent(notification1);
      wrapper.vm.onNotificationEvent(notification2);

      // Check that the first notification is displayed
      expect(wrapper.vm.message).toBe(notification1.message);
      expect(wrapper.vm.isVisible).toBeTruthy();

      // Simulate the first notification expiring
      // (normally this happens after a few seconds, 
      // but we trigger it immediately here)      
      wrapper.vm.onNotificationExpired();

      // Check that the first notification is displayed
      expect(wrapper.vm.message).toBe(notification2.message);
      expect(wrapper.vm.isVisible).toBeTruthy();

      // Cause the second notification to expire
      wrapper.vm.onNotificationExpired();

      // Confirm that no more notifications are displayed
      expect(wrapper.vm.message).toBe(null);
      expect(wrapper.vm.isVisible).toBeFalsy();

    })
  })

})