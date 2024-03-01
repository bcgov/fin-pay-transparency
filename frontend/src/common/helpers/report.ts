import { IReport } from '../types';
import { LocalDateTime, nativeJs } from '@js-joda/core';

export const isReportEditable = (report: IReport) => {
  return (
    !LocalDateTime.from(nativeJs(new Date(report.create_date))).isBefore(
      LocalDateTime.now().minusDays(30),
    ) || report.unlocked
  );
};
