import { expect, describe, it, vi, beforeEach } from 'vitest';

import { render, waitFor, fireEvent } from '@testing-library/vue';
import Dashboard from '../Dashboard.vue';
import { createTestingPinia } from '@pinia/testing';
import { authStore } from '../../store/modules/auth';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';

const pinia = createTestingPinia();
const mockRouterPush = vi.fn();
const mockRouter = {
  push: (...args) => mockRouterPush(...args),
};

const wrappedRender = async () => {
  return render(Dashboard, {
    global: {
      plugins: [pinia],
      mocks: {
        $router: mockRouter,
      },
    },
  });
};

const mockGetReports = vi.fn();
const mockGetReport = vi.fn();
vi.mock('../../common/apiService', () => ({
  default: {
    getReports: async () => {
      return mockGetReports();
    },
    getReport: (...args) => mockGetReport(...args),
  },
}));

const auth = authStore();

describe('Dashboard', () => {
  beforeEach(() => {
    auth.$patch({ userInfo: { legalName: 'Test' } } as any);
    vi.clearAllMocks();
  });

  it('should user name', async () => {
    mockGetReports.mockReturnValue([]);
    const { getByTestId } = await wrappedRender();
    expect(getByTestId('legal-name')).toHaveTextContent('Welcome, Test');
  });

  it('should display correct records', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        reporting_year: 2023,
        create_date: new Date().toISOString(),
      },
    ]);
    const { getByTestId } = await wrappedRender();
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    expect(getByTestId('reporting_year-id1')).toHaveTextContent('2023');
    expect(getByTestId('report_published_date-id1')).toHaveTextContent(
      LocalDate.now().format(
        DateTimeFormatter.ofPattern('MMMM d, YYYY').withLocale(Locale.ENGLISH),
      ),
    );
  });
  it('should open report details', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
      },
    ]);
    const { getByTestId } = await wrappedRender();
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    const viewReportButton = getByTestId('view-report-id1');
    await fireEvent.click(viewReportButton);
  });
  it('should open report in edit mode', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        is_unlocked: true,
      },
    ]);
    const { getByTestId } = await wrappedRender();
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    const editReportButton = getByTestId('edit-report-id1');
    await waitFor(() => {
      expect(editReportButton).toBeInTheDocument();
    });
    await fireEvent.click(editReportButton);
    expect(mockRouterPush).toHaveBeenCalledWith({
      path: 'generate-report-form',
    });
  });
});
