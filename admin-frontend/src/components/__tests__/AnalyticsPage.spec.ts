import { vi, describe, it, expect } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { render, screen } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import Analytics from '../AnalyticsPage.vue';
import ApiService from '../../services/apiService';
import { NotificationService } from '../../services/notificationService';
import { POWERBI_RESOURCE } from '../../utils/constant';
import { ZonedDateTime, ZoneId } from '@js-joda/core';

// --- Shared mocks ---

// mockEmbedInfo is referenced inside the factory via an arrow function so the
// variable is resolved at call time, not at hoist time.
const mockEmbedInfo = {
  accessToken: 'test-token',
  expiry: ZonedDateTime.now(ZoneId.UTC).plusHours(1).toString(),
  resources: [
    {
      name: POWERBI_RESOURCE.ANALYTICS,
      id: 'report-id-123',
      embedUrl: 'https://embed.powerbi.com/reportEmbed?reportId=report-id-123',
    },
  ],
};

vi.mock('../../services/apiService', () => ({
  default: {
    getPowerBiEmbedAnalytics: vi.fn(async () => mockEmbedInfo),
  },
}));
vi.mock('../../services/notificationService');

vi.mock('powerbi-client-vue-js', () => ({
  PowerBIReportEmbed: {
    name: 'PowerBIReportEmbed',
    props: ['embedConfig', 'style', 'eventHandlers'],
    template: '<div data-testid="powerbi-embed" />',
  },
}));

vi.mock('@braintree/sanitize-url', () => ({
  sanitizeUrl: vi.fn((url: string) => url),
}));

// --- Helpers ---

async function renderComponent() {
  const vuetify = createVuetify({ components, directives });

  const result = render(Analytics, {
    global: {
      plugins: [vuetify],
    },
  });

  await flushPromises();
  return result;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Analytics', () => {
  // -------------------------------------------------------------------------
  // Static elements
  // -------------------------------------------------------------------------

  describe('static elements', () => {
    it('renders the Web Traffic Analytics button', async () => {
      await renderComponent();
      expect(
        screen.getByRole('button', { name: 'Web Traffic Analytics' }),
      ).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // getPowerBiAccessToken — success path
  // -------------------------------------------------------------------------

  describe('getPowerBiAccessToken on mount', () => {
    it('calls ApiService.getPowerBiEmbedAnalytics with the ANALYTICS resource', async () => {
      await renderComponent();

      expect(ApiService.getPowerBiEmbedAnalytics).toHaveBeenCalledWith([
        POWERBI_RESOURCE.ANALYTICS,
      ]);
    });

    it('renders PowerBIReportEmbed after the embed config is loaded', async () => {
      await renderComponent();

      expect(screen.getByTestId('powerbi-embed')).toBeVisible();
    });

    it('does not render PowerBIReportEmbed before the embed URL is set', async () => {
      vi.mocked(ApiService.getPowerBiEmbedAnalytics).mockResolvedValueOnce(
        {} as Awaited<ReturnType<typeof ApiService.getPowerBiEmbedAnalytics>>,
      );

      const vuetify = createVuetify({ components, directives });
      render(Analytics, { global: { plugins: [vuetify] } });

      // Do NOT await flushPromises — we want the in-flight state.
      expect(screen.queryByTestId('powerbi-embed')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // getPowerBiAccessToken — error path
  // -------------------------------------------------------------------------

  describe('getPowerBiAccessToken error handling', () => {
    it('pushes an error notification when the API call fails', async () => {
      vi.mocked(ApiService.getPowerBiEmbedAnalytics).mockRejectedValueOnce(
        new Error('network error'),
      );

      await renderComponent();

      expect(NotificationService.pushNotificationError).toHaveBeenCalledWith(
        'Analytics failed to load. Please try again later or contact the helpdesk.',
        undefined,
        1000 * 60 * 3,
      );
    });

    it('does not push a notification on success', async () => {
      await renderComponent();
      expect(NotificationService.pushNotificationError).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Token refresh scheduling
  // -------------------------------------------------------------------------

  describe('token refresh scheduling', () => {
    it('schedules a token refresh before the token expires', async () => {
      vi.useFakeTimers();

      // Expiry 10 minutes from now; refresh fires at ~9 minutes (1 minute early).
      const expiry = ZonedDateTime.now(ZoneId.UTC).plusMinutes(9).toString();
      vi.mocked(ApiService.getPowerBiEmbedAnalytics).mockResolvedValue({
        ...mockEmbedInfo,
        expiry,
      });

      await renderComponent();
      vi.advanceTimersByTime(9 * 60 * 1000);

      // Called once on mount and once after the timeout.
      expect(ApiService.getPowerBiEmbedAnalytics).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});
