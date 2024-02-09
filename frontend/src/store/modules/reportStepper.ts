import { ref } from 'vue';
import { defineStore } from 'pinia';

export type ReportStage = 'UPLOAD' | 'REVIEW' | 'FINAL';

interface IStageOption {
  label: string;
  value: ReportStage;
}

export const REPORT_STAGES: IStageOption[] = [
  { label: 'Upload', value: 'UPLOAD' },
  { label: 'Review', value: 'REVIEW' },
  { label: 'Report', value: 'FINAL' },
];

interface IReportStepperState {
  stage: ReportStage;
  reportId?: string;
}

export const useReportStepperStore = defineStore<
  'reportStepper',
  IReportStepperState,
  {},
  {
    setStage: (value: ReportStage) => void;
    setReportId: (value: string) => void;
    clearReportId: () => void;
  }
>('reportStepper', {
  state: () => {
    return {
      stage: 'UPLOAD',
      reportId: undefined,
    };
  },
  actions: {
    setStage(value: ReportStage) {
      this.stage = value;
    },
    setReportId(id: string) {
      this.reportId = id;
    },
    clearReportId() {
      this.reportId = undefined;
    },
  },
});
