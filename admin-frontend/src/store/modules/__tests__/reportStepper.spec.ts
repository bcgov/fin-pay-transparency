import { beforeEach, describe, it, expect } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useReportStepperStore, type ReportStage } from '../reportStepper';

describe('reportStepper', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  describe('defaults', () => {
    it('should default to the UPLOAD stage', () => {
      const store = useReportStepperStore();
      expect(store.stage).toBe<ReportStage>('UPLOAD');
    });
    it('should default undefined report id', () => {
      const store = useReportStepperStore();
      expect(store.reportId).toBe(undefined);
    });
  });

  describe('methods', () => {
    describe('setStage', () => {
      it('should set the new stage value', () => {
        const store = useReportStepperStore();
        expect(store.stage).toBe<ReportStage>('UPLOAD');
        store.setStage('FINAL');
        expect(store.stage).toBe<ReportStage>('FINAL');
    });
});
describe('reset', () => {
    it('should set the new stage value', () => {
        const store = useReportStepperStore();
        store.setStage('FINAL');
        expect(store.stage).toBe<ReportStage>('FINAL');
        store.reset();
        expect(store.stage).toBe<ReportStage>('UPLOAD');
        expect(store.reportId).toBe(undefined);
      });
    });
  });
});
