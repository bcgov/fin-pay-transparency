import { vi, describe, it, expect, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { render, fireEvent, screen } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createTestingPinia } from '@pinia/testing';
import { createRouter, createWebHistory } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import PublishedReportPage from '../PublishedReportPage.vue';
import ApiService from '../../common/apiService';
import {
  useReportStepperStore,
  ReportMode,
} from '../../store/modules/reportStepper';

// --- Shared mocks ---

vi.mock('../../common/apiService');

// Stub child components so tests focus on PublishedReportPage behaviour.
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

// --- Helpers ---

const TEST_REPORT_ID = 'report-123';

function buildRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/published-report', component: PublishedReportPage },
      { path: '/generate-report-form', component: { template: '<div />' } },
    ],
  });
}

interface RenderOptions {
  mode?: ReportMode;
  reportId?: string;
  reportData?: { is_unlocked: boolean } | null;
}

async function renderComponent({
  mode = ReportMode.View,
  reportId = TEST_REPORT_ID,
  reportData = null,
}: RenderOptions = {}) {
  const user = userEvent.setup();
  const router = buildRouter();

  const vuetify = createVuetify({
    components,
    directives,
  });

  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      reportStepper: { reportId, mode, reportData },
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

  // Navigate after render so the component mounts inside the router-view
  await router.push('/published-report');
  await flushPromises();

  const store = useReportStepperStore();
  return { ...result, store, router, user };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PublishedReportPage', () => {
  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  describe('on mount', () => {
    it('sets the stepper stage to FINAL', async () => {
      const { store } = await renderComponent();
      expect(store.setStage).toHaveBeenCalledWith('FINAL');
    });
  });

  // -------------------------------------------------------------------------
  // ReportStepper visibility
  // -------------------------------------------------------------------------

  describe('ReportStepper', () => {
    it('is hidden when mode is View', async () => {
      await renderComponent({ mode: ReportMode.View });
      expect(screen.queryByTestId('report-stepper')).not.toBeInTheDocument();
    });

    it('is visible when mode is Edit', async () => {
      await renderComponent({ mode: ReportMode.Edit });
      expect(screen.getByTestId('report-stepper')).toBeVisible();
    });

    it('is visible when mode is New', async () => {
      await renderComponent({ mode: ReportMode.New });
      expect(screen.getByTestId('report-stepper')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Bottom action banner (only shown after html report is loaded)
  // -------------------------------------------------------------------------

  describe('bottom action banner', () => {
    it('is not rendered before HtmlReport emits html-report-loaded', async () => {
      await renderComponent();
      // Neither button should be present yet
      expect(screen.queryByText('Download PDF')).not.toBeInTheDocument();
    });

    it('shows the Download PDF button after html-report-loaded is emitted', async () => {
      const { getByTestId, getByText, user } = await renderComponent();
      await user.click(getByTestId('emit-html-report-loaded'));
      expect(getByText('Download PDF')).toBeVisible();
    });

    it('does not show Edit button when reportData is null', async () => {
      const { getByTestId, queryByTestId, user } = await renderComponent({
        reportData: null,
      });
      await user.click(getByTestId('emit-html-report-loaded'));
      expect(
        queryByTestId('published-report-edit-button'),
      ).not.toBeInTheDocument();
    });

    it('does not show Edit button when report is locked (is_unlocked = false)', async () => {
      const { getByTestId, queryByTestId, user } = await renderComponent({
        reportData: { is_unlocked: false },
      });
      await user.click(getByTestId('emit-html-report-loaded'));
      expect(
        queryByTestId('published-report-edit-button'),
      ).not.toBeInTheDocument();
    });

    it('shows Edit button when report is unlocked', async () => {
      const { getByTestId, user } = await renderComponent({
        reportData: { is_unlocked: true },
      });
      await user.click(getByTestId('emit-html-report-loaded'));
      expect(getByTestId('published-report-edit-button')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Download PDF
  // -------------------------------------------------------------------------

  describe('downloadPdf', () => {
    async function setup() {
      const rendered = await renderComponent({
        reportData: { is_unlocked: true },
      });
      await rendered.user.click(
        rendered.getByTestId('emit-html-report-loaded'),
      );
      return rendered;
    }

    it('calls ApiService.getPdfReport with the current reportId', async () => {
      const { getByText, user } = await setup();
      await user.click(getByText('Download PDF'));
      expect(ApiService.getPdfReport).toHaveBeenCalledWith(TEST_REPORT_ID);
    });

    it('calls ApiService.getPdfReport exactly once per click', async () => {
      const { getByText, user } = await setup();
      await user.click(getByText('Download PDF'));
      expect(ApiService.getPdfReport).toHaveBeenCalledTimes(1);
    });

    it('disables the Download PDF button while the request is in flight', async () => {
      // Make the API call hang so we can inspect the in-flight state.
      vi.mocked(ApiService.getPdfReport).mockReturnValueOnce(
        new Promise<void>(() => {}),
      );

      const { getByText } = await setup();
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
      const { getByText, user } = await setup();
      const btn = getByText('Download PDF').closest('button')!;

      await user.click(btn);
      expect(btn).not.toBeDisabled();
    });
  });

  // -------------------------------------------------------------------------
  // Edit report
  // -------------------------------------------------------------------------

  describe('editReport', () => {
    async function setup() {
      const rendered = await renderComponent({
        reportData: { is_unlocked: true },
      });
      await rendered.user.click(
        rendered.getByTestId('emit-html-report-loaded'),
      );
      return rendered;
    }

    it('sets the store mode to Edit', async () => {
      const { getByTestId, store, user } = await setup();
      await user.click(getByTestId('published-report-edit-button'));
      expect(store.setMode).toHaveBeenCalledWith(ReportMode.Edit);
    });

    it('calls setReportInfo with the current reportData', async () => {
      const reportData = { is_unlocked: true };
      const { getByTestId, store, user } = await renderComponent({
        reportData,
      });
      await user.click(getByTestId('emit-html-report-loaded'));
      await user.click(getByTestId('published-report-edit-button'));
      expect(store.setReportInfo).toHaveBeenCalledWith(reportData);
    });

    it('navigates to /generate-report-form', async () => {
      const { getByTestId, router, user } = await setup();
      await user.click(getByTestId('published-report-edit-button'));
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/generate-report-form');
    });
  });

  // -------------------------------------------------------------------------
  // Route leave guard
  // -------------------------------------------------------------------------

  describe('onBeforeRouteLeave', () => {
    it('resets the store when navigating to anywhere other than /generate-report-form', async () => {
      const { router, store } = await renderComponent();
      await router.push('/');
      expect(store.reset).toHaveBeenCalled();
    });

    it('does NOT reset the store when navigating to /generate-report-form', async () => {
      const { router, store } = await renderComponent();
      await router.push('/generate-report-form');
      expect(store.reset).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // HtmlReport child
  // -------------------------------------------------------------------------

  describe('HtmlReport', () => {
    it('is always rendered regardless of mode', async () => {
      const { getByTestId } = await renderComponent({ mode: ReportMode.View });
      expect(getByTestId('html-report')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Back button
  // -------------------------------------------------------------------------

  describe('Back button', () => {
    it('is always rendered', async () => {
      const { getByText } = await renderComponent();
      expect(getByText('Back')).toBeVisible();
    });
  });
});
