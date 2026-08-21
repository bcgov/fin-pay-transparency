import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { createTestingPinia } from '@pinia/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ReportsTable from '../ReportsTable.vue';
import { MAX_REPORT_URL_LEN } from '../../../utils/constant';

const vuetify = createVuetify({
  components,
  directives,
});

const pinia = createTestingPinia();
const mockRouterPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

const wrappedRender = async () => {
  return render(ReportsTable, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const mockGetReports = vi.fn();
const mockGetReport = vi.fn();
const mockAddOrUpdateReportUrl = vi.fn();
const mockConfirmationOpen = vi.fn();

vi.mock('../ConfirmationDialog.vue', () => ({
  default: {
    name: 'ConfirmationDialog',
    methods: {
      open: (...args: unknown[]) => mockConfirmationOpen(...args),
    },
    template: '<div data-testid="confirmation-dialog" />',
  },
}));

vi.mock('../../../common/apiService', () => ({
  default: {
    getReports: async () => {
      return mockGetReports();
    },
    getReport: (...args) => mockGetReport(...args),
    addOrUpdateReportUrl: (...args) => mockAddOrUpdateReportUrl(...args),
  },
}));

describe('ReportsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should display correct records', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        reporting_year: 2023,
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
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
  it('should display the empty state when there are no reports', async () => {
    mockGetReports.mockReturnValue([]);

    const { findByText } = await wrappedRender();

    expect(await findByText('No generated reports yet.')).toBeInTheDocument();
  });

  it('should render the mobile loading state', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 500,
    });
    window.dispatchEvent(new Event('resize'));
    mockGetReports.mockReturnValue(new Promise(() => {}));

    const { container } = await wrappedRender();

    expect(container.querySelector('.reports-table-mobile')).toBeVisible();
    expect(container.querySelector('.v-progress-circular')).toBeVisible();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('should render the mobile empty state', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 500,
    });
    window.dispatchEvent(new Event('resize'));
    mockGetReports.mockReturnValue([]);

    const { container, findByText } = await wrappedRender();

    expect(container.querySelector('.reports-table-mobile')).toBeVisible();
    expect(await findByText('No generated reports yet.')).toBeInTheDocument();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('should render mobile report cards with and without published links', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 500,
    });
    window.dispatchEvent(new Event('resize'));
    mockGetReports.mockReturnValue([
      {
        report_id: 'linked',
        reporting_year: 2023,
        create_date: new Date().toISOString(),
        report_url: 'https://example.gov.bc.ca/reports/current',
        is_unlocked: true,
      },
      {
        report_id: 'unlinked',
        reporting_year: 2022,
        create_date: new Date().toISOString(),
        is_unlocked: false,
      },
    ]);

    const { container, getByText, getByTestId } = await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    expect(container.querySelectorAll('.report-mobile-card')).toHaveLength(2);
    expect(getByTestId('reporting_year-linked')).toHaveTextContent('2023');
    expect(
      getByText('https://example.gov.bc.ca/reports/current'),
    ).toBeInTheDocument();
    expect(getByText('+Add link to published report')).toBeInTheDocument();
    expect(getByTestId('edit-report-linked')).toBeInTheDocument();
    expect(() => getByTestId('edit-report-unlinked')).toThrow();

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
    window.dispatchEvent(new Event('resize'));
  });

  it('should render the published report URL column and prepend https when saving a link', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
      },
    ]);
    mockAddOrUpdateReportUrl.mockResolvedValue(undefined);

    const { getByPlaceholderText, getByRole } = await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    expect(
      screen.getByText(/Link to published report \(optional\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /We invite you to share your most recent report link with our office for compliance tracking/i,
      ),
    ).toBeInTheDocument();

    await fireEvent.click(getByRole('button', { name: /Add link/i }));
    await fireEvent.update(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
      'example.gov.bc.ca/reports',
    );
    await fireEvent.click(getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(mockAddOrUpdateReportUrl).toHaveBeenCalledWith(
        'id1',
        'https://example.gov.bc.ca/reports',
        false,
      );
    });
  });
  it('should not allow report URLs longer than MAX_REPORT_URL_LEN', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
      },
    ]);

    const { getByPlaceholderText, getByRole, findByText } =
      await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /Add Link/i }));

    const tooLongUrl =
      'https://example.gov.bc.ca/' + 'a'.repeat(MAX_REPORT_URL_LEN);
    await fireEvent.update(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
      tooLongUrl,
    );
    await fireEvent.click(getByRole('button', { name: /^Save$/i }));

    expect(
      await findByText(`URL cannot exceed ${MAX_REPORT_URL_LEN} characters.`),
    ).toBeInTheDocument();
    expect(mockAddOrUpdateReportUrl).not.toHaveBeenCalled();
  });

  describe('Report URL TLD validation', () => {
    it.each([
      ['URL without a TLD', 'https://example/reports'],
      ['URL with a one-character TLD', 'https://example.c/reports'],
    ])('should reject %s', async (_description, invalidUrl) => {
      mockGetReports.mockReturnValue([
        {
          report_id: 'id1',
          report_start_date: '2023-01-01',
          report_end_date: '2023-02-01',
          create_date: new Date().toISOString(),
          update_date: new Date().toISOString(),
        },
      ]);

      const { getByPlaceholderText, getByRole, findByText } =
        await wrappedRender();

      await waitFor(() => {
        expect(mockGetReports).toHaveBeenCalled();
      });

      await fireEvent.click(getByRole('button', { name: /Add Link/i }));

      await fireEvent.update(
        getByPlaceholderText('https://example.gov.bc.ca/reports'),
        invalidUrl,
      );

      await fireEvent.click(getByRole('button', { name: /^Save$/i }));

      expect(
        await findByText('Please enter a URL with a valid domain.'),
      ).toBeInTheDocument();

      expect(mockAddOrUpdateReportUrl).not.toHaveBeenCalled();
    });

    it.each([
      ['.ca', 'https://example.ca/reports'],
      ['.gov.bc.ca', 'https://example.gov.bc.ca/reports'],
      ['a subdomain with a valid TLD', 'https://reports.example.org/reports'],
    ])(
      'should accept a URL with a valid TLD: %s',
      async (_description, validUrl) => {
        mockGetReports.mockReturnValue([
          {
            report_id: 'id1',
            report_start_date: '2023-01-01',
            report_end_date: '2023-02-01',
            create_date: new Date().toISOString(),
            update_date: new Date().toISOString(),
          },
        ]);

        mockAddOrUpdateReportUrl.mockResolvedValue(undefined);

        const { getByPlaceholderText, getByRole } = await wrappedRender();

        await waitFor(() => {
          expect(mockGetReports).toHaveBeenCalled();
        });

        await fireEvent.click(getByRole('button', { name: /Add Link/i }));

        await fireEvent.update(
          getByPlaceholderText('https://example.gov.bc.ca/reports'),
          validUrl,
        );

        await fireEvent.click(getByRole('button', { name: /^Save$/i }));

        await waitFor(() => {
          expect(mockAddOrUpdateReportUrl).toHaveBeenCalledWith(
            'id1',
            validUrl,
            false,
          );
        });
      },
    );
  });

  it('should display an error when saving a report URL fails', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
      },
    ]);

    mockAddOrUpdateReportUrl.mockRejectedValue(new Error('API failure'));

    const { getByPlaceholderText, getByRole, findByText } =
      await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /Add Link/i }));

    await fireEvent.update(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
      'example.gov.bc.ca/reports',
    );

    await fireEvent.click(getByRole('button', { name: /^Save$/i }));

    expect(
      await findByText('Failed to save URL. Please try again.'),
    ).toBeInTheDocument();

    expect(mockAddOrUpdateReportUrl).toHaveBeenCalledWith(
      'id1',
      'https://example.gov.bc.ca/reports',
      false,
    );
  });
  it('should populate the editor with the existing report URL', async () => {
    const existingUrl = 'https://example.gov.bc.ca/reports/current';

    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        report_url: existingUrl,
      },
    ]);

    const { getByPlaceholderText, getByRole } = await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /edit link/i }));

    expect(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
    ).toHaveValue(existingUrl);
  });
  it('should cancel editing an existing report URL', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        report_url: 'https://example.gov.bc.ca/reports/current',
      },
    ]);

    const { container, getByRole } = await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /edit link/i }));
    await fireEvent.click(
      container.querySelector('.report-url-editor button:last-child'),
    );

    expect(
      screen.queryByPlaceholderText('https://example.gov.bc.ca/reports'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('https://example.gov.bc.ca/reports/current'),
    ).toBeInTheDocument();
  });

  it('should confirm before removing an existing report URL', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        report_url: 'https://example.gov.bc.ca/reports/current',
      },
    ]);
    mockAddOrUpdateReportUrl.mockResolvedValue(undefined);
    mockConfirmationOpen.mockResolvedValue(true);

    const { getByPlaceholderText, getByRole } = await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /edit link/i }));
    await fireEvent.update(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
      '',
    );
    await fireEvent.click(getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(mockConfirmationOpen).toHaveBeenCalledWith(
        'Remove report link?',
        expect.stringContaining(
          'Are you sure you want to remove the published report link?',
        ),
        expect.objectContaining({
          resolveText: 'Remove Link',
          rejectText: 'Cancel',
        }),
      );
    });

    await waitFor(() => {
      expect(mockAddOrUpdateReportUrl).toHaveBeenCalledWith('id1', '', true);
    });
  });

  it('should cancel URL removal without clearing the current value', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        report_url: 'https://example.gov.bc.ca/reports/current',
      },
    ]);
    mockConfirmationOpen.mockResolvedValue(false);

    const { getByPlaceholderText, getByRole } = await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /edit link/i }));
    await fireEvent.update(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
      '',
    );
    await fireEvent.click(getByRole('button', { name: /^Save$/i }));

    await waitFor(() => {
      expect(mockConfirmationOpen).toHaveBeenCalled();
    });

    expect(mockAddOrUpdateReportUrl).not.toHaveBeenCalled();
    expect(
      screen.getByText('https://example.gov.bc.ca/reports/current'),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('https://example.gov.bc.ca/reports'),
    ).not.toBeInTheDocument();
  });
  it('should display an error when removing a report URL fails', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        report_url: 'https://example.gov.bc.ca/reports/current',
      },
    ]);
    mockConfirmationOpen.mockResolvedValue(true);
    mockAddOrUpdateReportUrl.mockRejectedValue(new Error('API failure'));

    const { getByPlaceholderText, getByRole, findByText } =
      await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /edit link/i }));
    await fireEvent.update(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
      '',
    );
    await fireEvent.click(getByRole('button', { name: /^Save$/i }));

    expect(
      await findByText('Failed to remove URL. Please try again.'),
    ).toBeInTheDocument();
    expect(mockAddOrUpdateReportUrl).toHaveBeenCalledWith('id1', '', true);
  });
  it('should reject an empty report URL', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
      },
    ]);

    const { getByPlaceholderText, getByRole, findByText } =
      await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /Add Link/i }));

    await fireEvent.update(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
      '',
    );

    await fireEvent.click(getByRole('button', { name: /^Save$/i }));

    expect(await findByText('Please enter a URL.')).toBeInTheDocument();

    expect(mockAddOrUpdateReportUrl).not.toHaveBeenCalled();
  });
  it('should reject a whitespace-only report URL', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
      },
    ]);

    const { getByPlaceholderText, getByRole, findByText } =
      await wrappedRender();

    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalled();
    });

    await fireEvent.click(getByRole('button', { name: /Add Link/i }));

    await fireEvent.update(
      getByPlaceholderText('https://example.gov.bc.ca/reports'),
      '   ',
    );

    await fireEvent.click(getByRole('button', { name: /^Save$/i }));

    expect(await findByText('Please enter a URL.')).toBeInTheDocument();

    expect(mockAddOrUpdateReportUrl).not.toHaveBeenCalled();
  });
  describe('Report URL normalization', () => {
    it.each([
      [
        'URL without protocol',
        'example.gov.bc.ca/reports',
        'https://example.gov.bc.ca/reports',
      ],
      [
        'URL with http protocol',
        'http://example.gov.bc.ca/reports',
        'https://example.gov.bc.ca/reports',
      ],
      [
        'URL with https protocol',
        'https://example.gov.bc.ca/reports',
        'https://example.gov.bc.ca/reports',
      ],
      [
        'URL with ftp protocol',
        'ftp://example.gov.bc.ca/reports',
        'https://example.gov.bc.ca/reports',
      ],
      [
        'URL with mailto protocol',
        'mailto://example.gov.bc.ca/reports',
        'https://example.gov.bc.ca/reports',
      ],
      [
        'URL with custom protocol',
        'custom+protocol://example.gov.bc.ca/reports',
        'https://example.gov.bc.ca/reports',
      ],
    ])(
      'should normalize %s before saving',
      async (_description, inputUrl, expectedUrl) => {
        mockGetReports.mockReturnValue([
          {
            report_id: 'id1',
            report_start_date: '2023-01-01',
            report_end_date: '2023-02-01',
            create_date: new Date().toISOString(),
            update_date: new Date().toISOString(),
          },
        ]);

        mockAddOrUpdateReportUrl.mockResolvedValue(undefined);

        const { getByPlaceholderText, getByRole } = await wrappedRender();

        await waitFor(() => {
          expect(mockGetReports).toHaveBeenCalled();
        });

        await fireEvent.click(getByRole('button', { name: /Add Link/i }));

        await fireEvent.update(
          getByPlaceholderText('https://example.gov.bc.ca/reports'),
          inputUrl,
        );

        await fireEvent.click(getByRole('button', { name: /^Save$/i }));

        await waitFor(() => {
          expect(mockAddOrUpdateReportUrl).toHaveBeenCalledWith(
            'id1',
            expectedUrl,
            false,
          );
        });
      },
    );
  });
  it('should open report details', async () => {
    mockGetReports.mockReturnValue([
      {
        report_id: 'id1',
        report_start_date: '2023-01-01',
        report_end_date: '2023-02-01',
        create_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
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
        update_date: new Date().toISOString(),
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
