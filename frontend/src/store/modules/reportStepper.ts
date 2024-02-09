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

export const useReportStepperStore = defineStore(
  'reportStepper',
  () => {
    const stage = ref<ReportStage>('UPLOAD');
    const reportId = ref<string | undefined>();

    const setStage = (value: ReportStage) => {
      stage.value = value;
    };
    const setReportId = (value: string) => {
      reportId.value = value;
    };
    const clearReportId = () => {
      reportId.value = undefined;
    };

    return {
      stage,
      reportId,
      setReportId,
      setStage,
      clearReportId,
    };
  },
);
