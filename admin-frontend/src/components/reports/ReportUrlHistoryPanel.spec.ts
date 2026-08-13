import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ReportUrlHistoryPanel from './ReportUrlHistoryPanel.vue';
import { ReportUrlHistory } from '../../types/reports';

// --- Shared mocks ---

vi.mock('../../utils/date', () => ({
  formatIsoDateTimeAsLocalDate: vi.fn(() => 'Jan 1, 2024'),
  formatIsoDateTimeAsLocalTime: vi.fn(() => '10:00 AM'),
}));

// --- Helpers ---

const vuetify = createVuetify({ components, directives });

function renderComponent(reportUrlHistory: ReportUrlHistory[]) {
  return render(ReportUrlHistoryPanel, {
    global: { plugins: [vuetify] },
    props: { reportUrlHistory: reportUrlHistory },
  });
}

function buildHistoryItem(overrides: Partial<ReportUrlHistory> = {}) {
  return {
    url_id: '1',
    url_history_id: '2',
    update_date: '2024-01-01T10:00:00Z',
    report_url: 'https://example.com',
    ...overrides,
  } as ReportUrlHistory;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportUrlHistoryPanel', () => {
  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe('when reportUrlHistory is empty', () => {
    it('shows the empty state message', () => {
      renderComponent([]);
      expect(screen.getByText('No URLs to show')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Populated state
  // -------------------------------------------------------------------------

  describe('when reportUrlHistory has items', () => {
    it('does not show the empty state message', () => {
      renderComponent([buildHistoryItem()]);
      expect(screen.queryByText('No URLs to show')).not.toBeInTheDocument();
    });

    it('renders one row per history item', () => {
      renderComponent([
        buildHistoryItem({ url_history_id: '1' }),
        buildHistoryItem({ url_history_id: '2' }),
      ]);
      expect(screen.getAllByText('https://example.com')).toHaveLength(2);
    });

    it('renders the formatted date and time', () => {
      renderComponent([buildHistoryItem()]);
      expect(screen.getByText('Jan 1, 2024')).toBeVisible();
      expect(screen.getByText('10:00 AM')).toBeVisible();
    });

    it('renders the limited results message', () => {
      const items = Array.from({ length: 100 }, () => buildHistoryItem());
      renderComponent(items);
      expect(
        screen.getByText(
          'Results are limited to the 100 most recent items. Older items may not be shown.',
        ),
      ).toBeVisible();
    });
  });
});
