import { ref } from 'vue';
import { defineStore } from 'pinia';
import ApiService from '../../common/apiService';
import { IReport } from '../../common/types';

export type ReportStage = 'UPLOAD' | 'REVIEW' | 'FINAL';
export enum ReportMode {
  New = 'new',
  View = 'view',
  Edit = 'edit',
}

export interface IStageOption {
  label: string;
  value: ReportStage;
  url: string;
  isDisabled: (current: ReportStage) => boolean;
  isComplete: (current: ReportStage) => boolean;
}

export const REPORT_STAGES: IStageOption[] = [
  {
    label: 'Upload',
    value: 'UPLOAD',
    url: '/generate-report-form',
    isDisabled: (stage) => stage === 'FINAL',
    isComplete: (stage) => ['UPLOAD', 'REVIEW', 'FINAL'].includes(stage),
  },
  {
    label: 'Review',
    value: 'REVIEW',
    url: '/draft-report',
    isDisabled: (stage) => stage === 'FINAL' || stage === 'UPLOAD',
    isComplete: (stage) => ['REVIEW', 'FINAL'].includes(stage),
  },
  {
    label: 'Report',
    value: 'FINAL',
    url: '/published-report',
    isDisabled: (stage) =>
      (['REVIEW', 'UPLOAD'] as ReportStage[]).includes(stage),
    isComplete: (stage) => ['FINAL'].includes(stage),
  },
];

export const useReportStepperStore = defineStore('reportStepper', () => {
  const stage = ref<ReportStage>('UPLOAD');
  const reportId = ref<string | undefined>();
  const reportInfo = ref<IReport | undefined>();
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
    reportInfo.value = undefined;
  };

  const setReportInfo = async (report: IReport) => {
    reportId.value = report.report_id;
    if (report.report_id)
      reportData.value = await ApiService.getReport(report.report_id);
    else reportData.value = report;
  };

  const setMode = (newMode: ReportMode) => {
    mode.value = newMode;
  };

  return {
    stage,
    reportId,
    reportInfo,
    reportData,
    mode,
    setStage,
    reset,
    setReportInfo,
    setMode,
  };
});
