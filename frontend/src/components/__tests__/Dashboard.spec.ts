import { expect, describe, it, vi, beforeEach } from 'vitest';

import { render, waitFor, fireEvent } from '@testing-library/vue';
import Dashboard from '../Dashboard.vue';
import { createTestingPinia } from '@pinia/testing';
import { authStore } from '../../store/modules/auth';

const pinia = createTestingPinia();

const wrappedRender = async () => {
  return render(Dashboard, {
    global: {
      plugins: [pinia],
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
        create_date: new Date().toISOString(),
      },
    ]);
    const { getByTestId } = await wrappedRender();
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    expect(getByTestId('report_start_date-id1')).toHaveTextContent(
      'January 1, 2023',
    );
    expect(getByTestId('report_end_date-id1')).toHaveTextContent(
      'February 1, 2023',
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
});
