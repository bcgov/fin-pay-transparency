import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Notification, NotificationService, NotificationTypes } from '../notificationService';

describe("NotificationService", () => {
  const listener = vi.fn();

  beforeEach(() => {
    NotificationService.registerNotificationListener(listener);
  })
  afterEach(() => {
    NotificationService.unregisterNotificationListener(listener);
    vi.resetAllMocks();
  })

  describe("pushNotificationError", () => {
    it("causes a new error notification to be delivered to listener", async () => {
      const message = "this is an error";
      NotificationService.pushNotificationError(message);
      expect(listener).toBeCalledTimes(1);
      const notification: Notification = listener.mock.calls[0][0];
      expect(notification.message).toBe(message);
      expect(notification.severity).toBe(NotificationTypes.NOTIFICATION_ERROR);
    })
  })

  describe("pushNotificationWarning", () => {
    it("causes a new warning notification to be delivered to listener", async () => {
      const message = "this is a warning";
      NotificationService.pushNotificationWarning(message);
      expect(listener).toBeCalledTimes(1);
      const notification: Notification = listener.mock.calls[0][0];
      expect(notification.message).toBe(message);
      expect(notification.severity).toBe(NotificationTypes.NOTIFICATION_WARNING);
    })
  })

  describe("pushNotificationInfo", () => {
    it("causes a new info notification to be delivered to listener", async () => {
      const message = "this is an info notification";
      NotificationService.pushNotificationInfo(message);
      expect(listener).toBeCalledTimes(1);
      const notification: Notification = listener.mock.calls[0][0];
      expect(notification.message).toBe(message);
      expect(notification.severity).toBe(NotificationTypes.NOTIFICATION_INFO);
    })
  })

  describe("pushNotification", () => {
    describe("when called with an invalid notification type", () => {
      it("throws an error", async () => {
        expect(
          () => {
            NotificationService.pushNotification("a message", "invalid notification type")
          }
        ).toThrow(Error);
      })
    })

  })

})