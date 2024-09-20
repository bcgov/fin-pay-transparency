import { createTestingPinia } from '@pinia/testing';
import { render, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { ReportMetrics } from '../../../types/reports';
import NumSubmissionsInYear from '../NumSubmissionsInYear.vue';

global.ResizeObserver = require('resize-observer-polyfill');
const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const mockReportMetrics: ReportMetrics = {
  num_submitted_reports: [{ reporting_year: 2024, count: 10 }],
};
const mockGetReportMetrics = vi.fn().mockResolvedValue(mockReportMetrics);

vi.mock('../../../services/apiService', () => ({
  default: {
    getReportMetrics: (...args) => {
      return mockGetReportMetrics(...args);
    },
  },
}));

const wrappedRender = () => {
  return render(NumSubmissionsInYear, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

describe('NumSubmissionsInYear', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays the number of reports submitted in the current reporting year', async () => {
    await wrappedRender();
    expect(mockGetReportMetrics).toHaveBeenCalled();

    await waitFor(() => {
      expect(
        screen.getByText(
          `${mockReportMetrics.num_submitted_reports[0].reporting_year}`,
          { exact: false /*  match substring */ },
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          `${mockReportMetrics.num_submitted_reports[0].count}`,
          { exact: false /*  match substring */ },
        ),
      ).toBeInTheDocument();
    });
  });
});
