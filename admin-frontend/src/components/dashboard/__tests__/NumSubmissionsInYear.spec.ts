import { screen, waitFor } from '@testing-library/vue';
import { renderWithPlugins } from '../../../test-utils/vuetify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReportMetrics } from '../../../types/reports';
import NumSubmissionsInYear from '../NumSubmissionsInYear.vue';

const mockReportMetrics: ReportMetrics = {
  report_metrics: [
    {
      reporting_year: 2024,
      num_published_reports: 10,
      num_published_reports_total: 25,
    },
  ],
};
const mockGetReportMetrics = vi.fn(async () => mockReportMetrics);

vi.mock('../../../services/apiService', () => ({
  default: {
    getReportMetrics: () => {
      return mockGetReportMetrics();
    },
  },
}));

const wrappedRender = () => {
  return renderWithPlugins(NumSubmissionsInYear);
};

describe('NumSubmissionsInYear', () => {
  it('displays the number of reports submitted in the current reporting year', async () => {
    await wrappedRender();
    expect(mockGetReportMetrics).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByText(
          `${mockReportMetrics.report_metrics[0].reporting_year}`,
          { exact: false /*  match substring */ },
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `${mockReportMetrics.report_metrics[0].num_published_reports}`,
          {
            exact: false /*  match substring */,
          },
        ),
      ).toBeInTheDocument();
    });
  });

  it('displays the total number of reports submitted since launch', async () => {
    await wrappedRender();
    expect(mockGetReportMetrics).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByText(
          `${mockReportMetrics.report_metrics[0].num_published_reports_total}`,
          {
            exact: false /*  match substring */,
          },
        ),
      ).toBeInTheDocument();
    });
  });
});
