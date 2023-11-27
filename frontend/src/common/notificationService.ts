import { TinyEmitter } from 'tiny-emitter';
import Router from '../router';

/*
This service provides an interface that other components and services
in the application can use to report errors.  The recommended use is as follows:
- For unrecoverable errors redirect to a dedicated error page by calling 
  goToErrorPage("My error message").
- For recoverable errors, warnings and other alerts call one of the following
  to display a toast message on the current page:
  - pushNotificationError("my message") or
  - pushNotificationWarning("my message") or 
  - pushNotificationInfo("my message")    
*/

const DEFAULT_ERROR_PAGE_MESSAGE = "You have encountered a system error. Close your web browser, open a new session, then try again."
const NOTIFICATION_EVENT = "notification";
const LOCAL_STORAGE_KEY_ERROR_PAGE_MSG = 'errorPageMessage';

const notificationEvents = new (TinyEmitter as any)();

export interface Notification {
  message: string,
  severity: string
}
export const NotificationTypes = {
  NOTIFICATION_ERROR: "error",
  NOTIFICATION_WARNING: "warning",
  NOTIFICATION_INFO: "info",
  NOTIFICATION_SUCCESS: "success"
}

export const NotificationService = {

  //---------------------------------------------------------------------------
  // Public interface (intended for any component or service that needs to 
  // report a notification or error)
  //---------------------------------------------------------------------------

  /* 
  Navigates to a page designed to show that a non-recoverable error 
  has occurred. Also saves the message that will be displayed on
  the error page.
  */
  goToErrorPage(message: string = DEFAULT_ERROR_PAGE_MESSAGE) {
    this.setErrorPageMessage(message);
    Router.push("/error")
  },

  /* 
  Emits a notification event.  
  Implementation note: The intention is that this service is coupled with
  a related component that will listen for the notification events and display them.
  */
  pushNotification(message: string, severity: string = NotificationTypes.NOTIFICATION_INFO) {
    if (Object.values(NotificationTypes).indexOf(severity) == -1) {
      throw new Error(`Invalid notification severity '${severity}'.  Expected one of [${Object.values(NotificationTypes)}]`);
    }
    const notification: Notification = {
      message: message,
      severity: severity
    };
    notificationEvents.emit(NOTIFICATION_EVENT, notification)
  },

  /* Emits a notification event with error severity */
  pushNotificationError(message: string) {
    this.pushNotification(message, NotificationTypes.NOTIFICATION_ERROR);
  },

  /* Emits a notification event with warning severity */
  pushNotificationWarning(message: string) {
    this.pushNotification(message, NotificationTypes.NOTIFICATION_WARNING);
  },

  /* Emits a notification event with info severity */
  pushNotificationInfo(message: string) {
    this.pushNotification(message, NotificationTypes.NOTIFICATION_INFO);
  },

  //---------------------------------------------------------------------------
  // Protected interface (intended only for the coupled component responsible 
  // for displaying notifications
  //---------------------------------------------------------------------------

  /* Registers a callback function to be called for any notification events */
  registerNotificationListener(callback: Function) {
    notificationEvents.on(NOTIFICATION_EVENT, callback);
  },

  /* 
  Unregisters a callback function so it will no longer be called in 
  response to notification events 
  */
  unregisterNotificationListener(callback) {
    notificationEvents.off(NOTIFICATION_EVENT, callback);
  },

  //---------------------------------------------------------------------------
  // Protected interface (intended only for the coupled component responsible 
  // for rendering the ErrorPage and the component responsible to clearing
  // error messages when
  //---------------------------------------------------------------------------

  /* Gets the message to be displayed on the error page.
  Implementation note: The intention is that there will be a related component 
  responsible for rendering the Error Page, and it will use this function to
  determine which error message to display */
  getErrorPageMessage(): string | null {
    return localStorage.getItem(LOCAL_STORAGE_KEY_ERROR_PAGE_MSG);
  },

  /* 
  Sets the error message to appear on the ErrorPage. 
  Implementation note: The value is saved to local storage so that 
  it persists even if the page is refreshed.
  */
  setErrorPageMessage(message: string) {
    if (!message) {
      message = DEFAULT_ERROR_PAGE_MESSAGE;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_ERROR_PAGE_MSG, message);
  }

}