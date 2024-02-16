import { ref } from 'vue';
import { defineStore } from 'pinia';
import ApiService from '../../common/apiService';

export type ReportStage = 'UPLOAD' | 'REVIEW' | 'FINAL';
export enum ReportMode {
  New = 'new',
  View = 'view',
  Edit = 'edit',
}

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
  const reportData = ref();
  const mode = ref<ReportMode>();

  const setStage = (value: ReportStage) => {
    stage.value = value;
  };

  const reset = () => {
    mode.value = ReportMode.New;
    stage.value = 'UPLOAD';
    reportId.value = undefined;
    reportData.value = undefined;
  };

  const setReportId = async (id: string) => {
    reportId.value = id;
    reportData.value = await ApiService.getReport(id);
  };

  const setMode = (newMode: ReportMode) => {
    mode.value = newMode;
  };

  return {
    stage,
    reportId,
    reportData,
    mode,
    setStage,
    reset,
    setReportId,
    setMode,
  };
});
