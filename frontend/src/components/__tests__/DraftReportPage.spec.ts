import { vi, describe, it, expect } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { render, fireEvent, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import DraftReportPage from '../DraftReportPage.vue';
import ApiService from '../../common/apiService';
import { NotificationService } from '../../common/notificationService';
import { useReportStepperStore } from '../../store/modules/reportStepper';
import { IReport } from '../../common/types';

// --- Shared mocks ---

vi.mock('../../common/apiService');
vi.mock('../../common/notificationService');

// Stub child components so tests focus on DraftReportPage behaviour.
// HtmlReport stub exposes a trigger button so tests can fire the Vue emit —
// a native DOM CustomEvent does NOT reach Vue component event listeners.
vi.mock('../util/HtmlReport.vue', () => ({
  default: {
    name: 'HtmlReport',
    emits: ['html-report-loaded'],
    template:
      '<div data-testid="html-report">' +
      '<button data-testid="emit-html-report-loaded" @click="$emit(\'html-report-loaded\')" />' +
      '</div>',
  },
}));

vi.mock('../util/ReportStepper/Stepper.vue', () => ({
  default: {
    name: 'ReportStepper',
    template: '<div data-testid="report-stepper" />',
  },
}));

// ConfirmationDialog is mocked so we can spy on open() per-test.
// The spy is exposed at module scope so tests can call mockResolvedValueOnce
// on it directly. It resolves true by default (user confirmed).
const openSpy = vi.fn(async () => true);
vi.mock('../util/ConfirmationDialog.vue', () => ({
  default: {
    name: 'ConfirmationDialog',
    setup(_, { expose }) {
      expose({ open: openSpy });
    },
    template: '<div data-testid="confirmation-dialog" />',
  },
}));

// --- Helpers ---

const TEST_REPORT_ID = 'report-123';
const TEST_REPORTING_YEAR = 2024;

function buildRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: { template: '<div />' },
      },
      { path: '/draft-report', component: DraftReportPage },
      { path: '/published-report', component: { template: '<div />' } },
      { path: '/generate-report-form', component: { template: '<div />' } },
    ],
  });
}

interface RenderOptions {
  reportId?: string | null;
  reportData?: { reporting_year?: number; [key: string]: unknown } | null;
}

async function renderComponent({
  reportId = TEST_REPORT_ID,
  reportData = { reporting_year: TEST_REPORTING_YEAR },
}: RenderOptions = {}) {
  const user = userEvent.setup();
  const router = buildRouter();

  const vuetify = createVuetify({ components, directives });

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      reportStepper: { reportId, reportData },
    },
  });

  // Render a root <router-view> so the router owns the component lifecycle.
  // This is required for onBeforeRouteLeave to fire when the route changes.
  const result = render(
    { template: '<router-view />' },
    {
      global: {
        plugins: [pinia, router, vuetify],
      },
    },
  );

  // Navigate after render so the component mounts inside the router-view.
  await router.push('/draft-report');
  await flushPromises();

  const store = useReportStepperStore();
  return { ...result, store, router, user };
}

/** Render the component and emit html-report-loaded so the action banner appears. */
async function renderWithReport(options: RenderOptions = {}) {
  const rendered = await renderComponent(options);
  await rendered.user.click(rendered.getByTestId('emit-html-report-loaded'));
  return rendered;
}

/** Render the component and check the 'confirmation' checkbox. */
async function renderThenCheckBox(options: RenderOptions = {}) {
  const rendered = await renderWithReport(options);
  await rendered.user.click(rendered.getByRole('checkbox'));
  return rendered;
}

/** Render the component and check the 'confirmation' checkbox and click the 'Generate Final Report' button. */
async function renderThenGenerateFinalReport(
  options: RenderOptions = {},
  mockGetReports: IReport[] = [],
  mockPublishReport = {},
) {
  vi.mocked(ApiService.getReports).mockResolvedValueOnce(mockGetReports);
  vi.mocked(ApiService.publishReport).mockResolvedValueOnce(mockPublishReport);

  const rendered = await renderThenCheckBox(options);
  await rendered.user.click(rendered.getByText('Generate Final Report'));
  await flushPromises();
  return rendered;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DraftReportPage', () => {
  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  describe('on mount', () => {
    it('sets the stepper stage to REVIEW', async () => {
      const { store } = await renderComponent();
      expect(store.setStage).toHaveBeenCalledWith('REVIEW');
    });
  });

  describe('beforeRouteEnter', () => {
    it('redirects to / when reportId is null', async () => {
      const { router } = await renderComponent({ reportId: null });
      expect(router.currentRoute.value.path).toBe('/dashboard');
    });

    it('does not redirect when reportId is present', async () => {
      const { router } = await renderComponent();
      expect(router.currentRoute.value.path).toBe('/draft-report');
    });
  });

  // -------------------------------------------------------------------------
  // Static elements
  // -------------------------------------------------------------------------

  describe('Static elements', () => {
    it('ReportStepper is always rendered', async () => {
      const { getByTestId } = await renderComponent();
      expect(getByTestId('report-stepper')).toBeVisible();
    });

    it('HtmlReport is always rendered', async () => {
      const { getByTestId } = await renderComponent();
      expect(getByTestId('html-report')).toBeVisible();
    });

    it('Back button is always rendered', async () => {
      const { getByText } = await renderComponent();
      expect(getByText('Back')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Bottom action banner (only shown after html-report-loaded is emitted)
  // -------------------------------------------------------------------------

  describe('bottom action banner', () => {
    it('is not rendered before HtmlReport emits html-report-loaded', async () => {
      await renderComponent();
      expect(screen.queryByText('Download PDF')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Generate Final Report'),
      ).not.toBeInTheDocument();
    });

    it('shows Download PDF button after html-report-loaded is emitted', async () => {
      const { getByText } = await renderWithReport();
      expect(getByText('Download PDF')).toBeVisible();
    });

    it('shows Generate Final Report button after html-report-loaded is emitted', async () => {
      const { getByText } = await renderWithReport();
      expect(getByText('Generate Final Report')).toBeVisible();
    });

    it('shows the checkbox after html-report-loaded is emitted', async () => {
      const { getByRole } = await renderWithReport();
      expect(getByRole('checkbox')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Generate Final Report button — enabled / disabled state
  // -------------------------------------------------------------------------

  describe('Generate Final Report button', () => {
    it('is disabled when the checkbox is unchecked', async () => {
      const { getByText } = await renderWithReport();
      const btn = getByText('Generate Final Report').closest('button')!;
      expect(btn).toBeDisabled();
    });

    it('is enabled after the checkbox is checked', async () => {
      const { getByText, getByRole, user } = await renderWithReport();
      await user.click(getByRole('checkbox'));
      const btn = getByText('Generate Final Report').closest('button')!;
      expect(btn).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Download PDF
  // -------------------------------------------------------------------------

  describe('downloadPdf', () => {
    it('calls ApiService.getPdfReport with the current reportId', async () => {
      const { getByText, user } = await renderWithReport();
      await user.click(getByText('Download PDF'));
      expect(ApiService.getPdfReport).toHaveBeenCalledWith(TEST_REPORT_ID);
    });

    it('calls ApiService.getPdfReport exactly once per click', async () => {
      const { getByText, user } = await renderWithReport();
      await user.click(getByText('Download PDF'));
      expect(ApiService.getPdfReport).toHaveBeenCalledTimes(1);
    });

    it('disables the Download PDF button while the request is in flight', async () => {
      vi.mocked(ApiService.getPdfReport).mockReturnValueOnce(
        new Promise<void>(() => {}),
      );

      const { getByText } = await renderWithReport();
      const btn = getByText('Download PDF').closest('button')!;

      // Use fireEvent rather than userEvent here: userEvent's async pointer
      // simulation makes it impossible to reliably pause mid-handler.
      // fireEvent dispatches synchronously, so the next await flushes exactly
      // the Vue re-render that sets isDownloadingPdf = true.
      fireEvent.click(btn);
      await flushPromises();
      expect(btn).toBeDisabled();
    });

    it('re-enables the Download PDF button after the request completes', async () => {
      const { getByText, user } = await renderWithReport();
      const btn = getByText('Download PDF').closest('button')!;
      await user.click(btn);
      expect(btn).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // tryGenerateReport — happy path (no existing published report)
  // -------------------------------------------------------------------------

  describe('tryGenerateReport', () => {
    it('calls ApiService.getReports to check for existing published reports', async () => {
      await renderThenGenerateFinalReport();

      expect(ApiService.getReports).toHaveBeenCalledWith({
        reporting_year: TEST_REPORTING_YEAR,
        report_status: 'Published',
      });
    });

    it('calls ApiService.publishReport with the current reportId when no existing report', async () => {
      await renderThenGenerateFinalReport();

      expect(ApiService.publishReport).toHaveBeenCalledWith(TEST_REPORT_ID);
    });

    it('calls store.setReportInfo with the data returned by publishReport', async () => {
      const reportData = { id: 'new-report', is_unlocked: true };
      const { store } = await renderThenGenerateFinalReport(
        undefined,
        undefined,
        reportData,
      );

      expect(store.setReportInfo).toHaveBeenCalledWith(reportData);
    });

    it('pushes a success notification after publishing', async () => {
      await renderThenGenerateFinalReport();

      expect(NotificationService.pushNotificationSuccess).toHaveBeenCalledWith(
        'You have created a pay transparency report.',
      );
    });

    it('navigates to /published-report after a successful publish', async () => {
      const { router } = await renderThenGenerateFinalReport();

      expect(router.currentRoute.value.path).toBe('/published-report');
    });
  });

  // -------------------------------------------------------------------------
  // tryGenerateReport — locked existing report
  // -------------------------------------------------------------------------

  describe('tryGenerateReport when a locked published report already exists', () => {
    it('shows an error notification and does not publish', async () => {
      await renderThenGenerateFinalReport(undefined, [
        { is_unlocked: false },
      ] as IReport[]);

      expect(NotificationService.pushNotificationError).toHaveBeenCalledWith(
        'A report for this time period already exists and cannot be updated.',
        undefined,
        5000,
      );
      expect(ApiService.publishReport).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // tryGenerateReport — unlocked existing report (replace confirmation)
  // -------------------------------------------------------------------------

  describe('tryGenerateReport when an unlocked published report already exists', () => {
    it('publishes when the user confirms the replace dialog', async () => {
      await renderThenGenerateFinalReport(undefined, [
        { is_unlocked: true },
      ] as IReport[]);

      expect(ApiService.publishReport).toHaveBeenCalled();
    });

    it('does not publish when the user declines the replace confirmation', async () => {
      openSpy.mockResolvedValueOnce(false);
      await renderThenGenerateFinalReport(undefined, [
        { is_unlocked: true },
      ] as IReport[]);

      expect(ApiService.publishReport).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Route leave guard
  // -------------------------------------------------------------------------

  describe('onBeforeRouteLeave', () => {
    it('allows navigation when the user confirms the leave dialog', async () => {
      // openSpy defaults to true — user clicks Yes
      const { router } = await renderComponent();
      await router.push('/generate-report-form');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/generate-report-form');
    });

    it('blocks navigation when the user declines the leave dialog', async () => {
      openSpy.mockResolvedValueOnce(false);

      const { router } = await renderComponent();
      await router.push('/generate-report-form');
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/draft-report');
    });

    it('allows navigation to the approved route (/published-report) without a dialog', async () => {
      // Approved route is only navigated after clicking.
      const { router } = await renderThenGenerateFinalReport();

      // The component navigated itself to /published-report via nextStage(),
      // which sets approvedRoute first — so the guard must not block it.
      await waitFor(() => {
        expect(router.currentRoute.value.path).toBe('/published-report');
      });
    });
  });
});
