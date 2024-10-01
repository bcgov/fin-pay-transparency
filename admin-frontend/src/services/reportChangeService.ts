import { TinyEmitter } from 'tiny-emitter';
import { AdminPortalEvent } from '../types/events';

const reportChangedEvents = new TinyEmitter();

export type ReportChangedEventCallback = (
  payload: ReportChangedEventPayload,
) => void;

export type ReportChangedEventPayload = { reportId: string };

/**
 * This service is an event bus for events related to data changes made by
 * admin users to Reports.  It is intented to be used by
 * components which trigger admin-related report changes (e.g. lock/unlock)
 * to alert other components about those changes.
 */
export const ReportChangeService = {
  /**
   * Pushes a report change event onto the event bus for the given reportId
   * @param reportId
   */
  reportChanged(reportId: string) {
    const payload: ReportChangedEventPayload = { reportId: reportId };
    reportChangedEvents.emit(AdminPortalEvent.REPORT_CHANGED, payload);
  },

  /**
   * Register a callback function which will called whenever
   * a report change event occurs
   * @param eventType the type of event that occurred
   * @param callback a function that will be called
   */
  listen(callback: ReportChangedEventCallback): void {
    reportChangedEvents.on(AdminPortalEvent.REPORT_CHANGED, callback);
  },

  /**
   * Un-register a callback function so that it will no longer be called
   * when report change events occur
   * @param callback a function that will be de-registered
   */
  unlisten(callback: ReportChangedEventCallback): void {
    reportChangedEvents.off(AdminPortalEvent.REPORT_CHANGED, callback);
  },
};
