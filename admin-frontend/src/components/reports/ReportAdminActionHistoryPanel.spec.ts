import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ReportAdminActionHistoryPanel from './ReportAdminActionHistoryPanel.vue';
import {
  AdminModifiedReason,
  AdminModifiedReasonDisplay,
} from '../../types/reports';

// --- Shared mocks ---

vi.mock('../../utils/date', () => ({
  formatIsoDateTimeAsLocalDate: vi.fn(() => 'Jan 1, 2024'),
  formatIsoDateTimeAsLocalTime: vi.fn(() => '10:00 AM'),
}));

// --- Helpers ---

const vuetify = createVuetify({ components, directives });

function renderComponent(reportAdminActionHistory: any[]) {
  return render(ReportAdminActionHistoryPanel, {
    global: { plugins: [vuetify] },
    props: { reportAdminActionHistory },
  });
}

function buildHistoryItem(overrides = {}) {
  return {
    report_history_id: '1',
    action: AdminModifiedReason.UNLOCK,
    admin_modified_date: '2024-01-01T10:00:00Z',
    admin_user_display_name: 'Admin User',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ReportAdminActionHistoryPanel', () => {
  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe('when reportAdminActionHistory is empty', () => {
    it('shows the empty state message', () => {
      renderComponent([]);
      expect(screen.getByText('No admin events to show')).toBeVisible();
    });

    it('does not render any history items', () => {
      renderComponent([]);
      expect(screen.queryByText('By Admin User')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Populated state
  // -------------------------------------------------------------------------

  describe('when reportAdminActionHistory has items', () => {
    it('does not show the empty state message', () => {
      renderComponent([buildHistoryItem()]);
      expect(
        screen.queryByText('No admin events to show'),
      ).not.toBeInTheDocument();
    });

    it('renders one row per history item', () => {
      renderComponent([
        buildHistoryItem({ report_history_id: '1' }),
        buildHistoryItem({ report_history_id: '2' }),
      ]);
      expect(
        screen.getAllByText(
          AdminModifiedReasonDisplay[AdminModifiedReason.UNLOCK],
        ),
      ).toHaveLength(2);
    });

    it('renders the formatted date and time', () => {
      renderComponent([buildHistoryItem()]);
      expect(screen.getByText('Jan 1, 2024')).toBeVisible();
      expect(screen.getByText('10:00 AM')).toBeVisible();
    });

    it('renders the admin user display name', () => {
      renderComponent([
        buildHistoryItem({ admin_user_display_name: 'Jane Doe' }),
      ]);
      expect(screen.getByText('By Jane Doe')).toBeVisible();
    });

    it('does not render the "By" line when admin_user_display_name is absent', () => {
      renderComponent([
        buildHistoryItem({ admin_user_display_name: undefined }),
      ]);
      expect(screen.queryByText(/^By /)).not.toBeInTheDocument();
    });

    it('does not render the date/time block when admin_modified_date is absent', () => {
      renderComponent([buildHistoryItem({ admin_modified_date: undefined })]);
      expect(screen.queryByText('Jan 1, 2024')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Action labels
  // -------------------------------------------------------------------------

  describe('action label', () => {
    it.each([
      AdminModifiedReason.UNLOCK,
      AdminModifiedReason.LOCK,
      AdminModifiedReason.YEAR,
      AdminModifiedReason.WITHDRAW,
    ])('displays the correct label for action %s', (action) => {
      renderComponent([buildHistoryItem({ action })]);
      expect(
        screen.getByText(AdminModifiedReasonDisplay[action]),
      ).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Icon colour
  // -------------------------------------------------------------------------

  describe('icon colour', () => {
    it('uses success colour for UNLOCK', () => {
      const { container } = renderComponent([
        buildHistoryItem({ action: AdminModifiedReason.UNLOCK }),
      ]);
      expect(container.querySelector('.text-success')).not.toBeNull();
    });

    it('uses success colour for YEAR', () => {
      const { container } = renderComponent([
        buildHistoryItem({ action: AdminModifiedReason.YEAR }),
      ]);
      expect(container.querySelector('.text-success')).not.toBeNull();
    });

    it('uses error colour for LOCK', () => {
      const { container } = renderComponent([
        buildHistoryItem({ action: AdminModifiedReason.LOCK }),
      ]);
      expect(container.querySelector('.text-error')).not.toBeNull();
    });

    it('uses warning colour for WITHDRAW', () => {
      const { container } = renderComponent([
        buildHistoryItem({ action: AdminModifiedReason.WITHDRAW }),
      ]);
      expect(container.querySelector('.text-warning')).not.toBeNull();
    });
  });
});
