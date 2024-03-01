import { describe, expect, it } from 'vitest';
import { isReportEditable } from '../report';
import { IReport } from '../../types';
import { LocalDateTime, convert } from '@js-joda/core';

describe('helpers/report', () => {
  describe.only('isEditable', () => {
    describe('when report is less than 30 days old', () => {
      it('should not be editable', () => {
        const report: Partial<IReport> = {
            create_date: convert(LocalDateTime.now().minusDays(15)).toDate().toISOString(),
            unlocked: true
        }

        expect(isReportEditable(report as IReport)).toBeTruthy()
      });
    });
    describe('when report is older than 30 days', () => {
      it('should not be editable', () => {
        const report: Partial<IReport> = {
            create_date: convert(LocalDateTime.now().minusDays(40)).toDate().toISOString(),
            unlocked: false
        }

        expect(isReportEditable(report as IReport)).toBeFalsy()
      });
    });
    describe('when report is older than 30 days and is not locked', () => {
      it('should not be editable', () => {
        const report: Partial<IReport> = {
            create_date: convert(LocalDateTime.now().minusDays(40)).toDate().toISOString(),
            unlocked: false
        }

        expect(isReportEditable(report as IReport)).toBeFalsy()
      });
    });
    describe('when report  is not locked', () => {
      it('should be editable', () => {
        const report: Partial<IReport> = {
            create_date: convert(LocalDateTime.now().minusDays(40)).toDate().toISOString(),
            unlocked: true
        }

        expect(isReportEditable(report as IReport)).toBeTruthy()
      });
    });
  });
});
