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

interface IStageOption {
  label: string;
  value: ReportStage;
  url: string;
  isDisabled: (current: ReportStage) => boolean;
}

export const REPORT_STAGES: IStageOption[] = [
  {
    label: 'Upload',
    value: 'UPLOAD',
    url: '/generate-report-form',
    isDisabled: (stage) => stage === 'FINAL',
  },
  {
    label: 'Review',
    value: 'REVIEW',
    url: '/draft-report',
    isDisabled: (stage) => stage === 'FINAL' || stage === 'UPLOAD',
  },
  {
    label: 'Report',
    value: 'FINAL',
    url: '/published-report',
    isDisabled: (stage) =>
      (['REVIEW', 'UPLOAD'] as ReportStage[]).includes(stage),
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
    reportInfo.value = report;
    reportData.value = await ApiService.getReport(report.report_id);
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
