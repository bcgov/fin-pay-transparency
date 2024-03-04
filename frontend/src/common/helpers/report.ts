import { IReport } from '../types';
import { LocalDateTime, nativeJs } from '@js-joda/core';

export const isReportEditable = (report: IReport, days: number = 30) => {
  return (
    !LocalDateTime.from(nativeJs(new Date(report.create_date))).isBefore(
      LocalDateTime.now().minusDays(days),
    ) || report.is_unlocked
  );
};
