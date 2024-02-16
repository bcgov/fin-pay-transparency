import { ref } from 'vue';
import { defineStore } from 'pinia';

export type ReportStage = 'UPLOAD' | 'REVIEW' | 'FINAL';

interface IStageOption {
  label: string;
  value: ReportStage;
  isDisabled: (current: ReportStage) => boolean;
}

export const REPORT_STAGES: IStageOption[] = [
  {
    label: 'Upload',
    value: 'UPLOAD',
    isDisabled: (stage) => stage === 'FINAL',
  },
  {
    label: 'Review',
    value: 'REVIEW',
    isDisabled: (stage) => stage === 'FINAL' || stage === 'UPLOAD',
  },
  {
    label: 'Report',
    value: 'FINAL',
    isDisabled: (stage) =>
      (['REVIEW', 'UPLOAD'] as ReportStage[]).includes(stage),
  },
];

export const useReportStepperStore = defineStore('reportStepper', () => {
  const stage = ref<ReportStage>('UPLOAD');
  const reportId = ref<string | undefined>();
  const reportStartDate = ref<string | undefined>();
  const reportEndDate = ref<string | undefined>();

  const setStage = (value: ReportStage) => {
    stage.value = value;
  };

  const reset = () => {
    stage.value = 'UPLOAD';
    reportId.value = undefined;
  };

  const setReportId = (id: string) => {
    reportId.value = id;
  };

  const setReportDates = (start: string, end: string) => {
    reportStartDate.value = start;
    reportEndDate.value = end;
  };

  return {
    stage,
    reportId,
    reportStartDate,
    reportEndDate,
    setStage,
    reset,
    setReportId,
    setReportDates,
  };
});
