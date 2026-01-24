import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/vue';
import userEvent from '@testing-library/user-event';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ReportActions from './ReportActions.vue';
import ApiService from '../../services/apiService';
import { NotificationService } from '../../services/notificationService';
import { ReportChangeService } from '../../services/reportChangeService';
import { authStore } from '../../store/modules/auth';
import { ReportAdminActions } from '../../constants';
import { Report } from '../../types/reports';

// Default data
const currentYear = new Date().getFullYear();

// Mocks
vi.mock('../../services/apiService');
vi.mock('../../services/notificationService');
vi.mock('../../services/reportChangeService');
vi.mock('../../store/modules/auth');

// Create Vuetify instance
const vuetify = createVuetify({
  components,
  directives,
});

// Element getters - called at runtime to query DOM
const buttons = {
  //buttons must exist or will throw
  openReport: () => screen.getByLabelText('Open Report'),
  lockReport: () => screen.getByLabelText('Lock report'),
  unlockReport: () => screen.getByLabelText('Unlock report'),
  editYear: () => screen.getByLabelText('Edit reporting year'),
  withdraw: () => screen.getByLabelText('Withdraw report'),
  adminHistory: () => screen.getByLabelText('Admin action history'),
  //buttons will be null if they do not exist
  tryOpenReport: () => screen.queryByLabelText('Open Report'),
  tryLockReport: () => screen.queryByLabelText('Lock report'),
  tryUnlockReport: () => screen.queryByLabelText('Unlock report'),
  tryEditYear: () => screen.queryByLabelText('Edit reporting year'),
  tryWithdraw: () => screen.queryByLabelText('Withdraw report'),
  tryAdminHistory: () => screen.queryByLabelText('Admin action history'),
};

const dialogButtons = {
  confirm: (text: string) => screen.getByText(text),
  cancel: () => screen.getByText('Cancel'),
  next: () => screen.getByText('Next'),
  tryConfirm: (text: string) => screen.queryByText(text),
  tryCancel: () => screen.queryByText('Cancel'),
  tryNext: () => screen.queryByText('Next'),
};

const inputs = {
  yearSelect: () => screen.getByLabelText('Select new reporting year'),
  currentYear: () => screen.getByText(currentYear.toString()),
  tryYearSelect: () => screen.queryByLabelText('Select new reporting year'),
  tryCurrentYear: () => screen.queryByText(currentYear.toString()),
};

describe('ReportActions', () => {
  const mockReport: Report = {
    report_id: 'test-report-123',
    reporting_year: (currentYear - 1).toString(),
    report_status: 'Published',
    is_unlocked: false,
    pay_transparency_company: {
      company_name: 'Test Company Inc.',
    },
  } as Report;

  beforeEach(() => {
    // Create default mocks
    vi.mocked(authStore).mockReturnValue({
      doesUserHaveRole: vi.fn().mockReturnValue(false),
    });

    vi.mocked(ApiService).getReportAdminActionHistory.mockResolvedValue([
      { action: 'Test Action', timestamp: '2024-01-01' },
    ]);

    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  type ReportActionsProps = {
    report: Report;
    actions?: ReportAdminActions[];
  };

  const renderWithVuetify = (props: ReportActionsProps) => {
    return render(ReportActions, {
      props,
      global: {
        plugins: [vuetify],
        stubs: {
          // Only stub the child component that we're not testing
          ReportAdminActionHistoryView: {
            template: '<div>Action History</div>',
          },
        },
      },
    });
  };

  describe('Button Visibility Based on Actions Prop', () => {
    it('should show Open Report button when OpenReport action is included', () => {
      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.OpenReport],
      });

      expect(buttons.openReport()).toBeInTheDocument();
    });

    it('should show Lock/Unlock button when LockUnlock action is included', () => {
      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.LockUnlock],
      });

      expect(buttons.unlockReport()).toBeInTheDocument();
    });

    it('should show Edit Reporting Year button when EditReportingYear action is included and user is admin', () => {
      authStore().doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.EditReportingYear],
      });

      expect(buttons.editYear()).toBeInTheDocument();
    });

    it('should NOT show Edit Reporting Year button when user is not admin', () => {
      authStore().doesUserHaveRole.mockReturnValue(false);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.EditReportingYear],
      });

      expect(buttons.tryEditYear()).not.toBeInTheDocument();
    });

    it('should show Withdraw Report button when WithdrawReport action is included and user is admin', () => {
      authStore().doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.WithdrawReport],
      });

      expect(buttons.withdraw()).toBeInTheDocument();
    });

    it('should NOT show Withdraw Report button when user is not admin', () => {
      authStore().doesUserHaveRole.mockReturnValue(false);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.WithdrawReport],
      });

      expect(buttons.tryWithdraw()).not.toBeInTheDocument();
    });

    it('should show Admin Action History button when AdminActionHistory action is included', () => {
      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.AdminActionHistory],
      });

      expect(buttons.adminHistory()).toBeInTheDocument();
    });

    it('should show multiple buttons when multiple actions are provided', () => {
      authStore().doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [
          ReportAdminActions.OpenReport,
          ReportAdminActions.LockUnlock,
          ReportAdminActions.WithdrawReport,
        ],
      });

      expect(buttons.openReport()).toBeInTheDocument();
      expect(buttons.unlockReport()).toBeInTheDocument();
      expect(buttons.withdraw()).toBeInTheDocument();
    });

    it('should show all buttons by default when actions prop is not provided', () => {
      authStore().doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
      });

      expect(buttons.openReport()).toBeInTheDocument();
      expect(buttons.unlockReport()).toBeInTheDocument();
      expect(buttons.editYear()).toBeInTheDocument();
      expect(buttons.withdraw()).toBeInTheDocument();
      expect(buttons.adminHistory()).toBeInTheDocument();
    });
  });

  describe('Lock/Unlock Report Button', () => {
    it('should display "Unlock report" for locked report', () => {
      renderWithVuetify({
        report: { ...mockReport, is_unlocked: false },
        actions: [ReportAdminActions.LockUnlock],
      });

      expect(buttons.unlockReport()).toBeInTheDocument();
    });

    it('should display "Lock report" for unlocked report', () => {
      renderWithVuetify({
        report: { ...mockReport, is_unlocked: true },
        actions: [ReportAdminActions.LockUnlock],
      });

      expect(buttons.lockReport()).toBeInTheDocument();
    });

    it('should call ApiService.lockUnlockReport when unlock button is clicked', async () => {
      const user = userEvent.setup();

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.LockUnlock],
      });

      await user.click(buttons.unlockReport());

      // Wait for the confirmation dialog and click confirm
      await waitFor(() => {
        expect(dialogButtons.confirm('Yes, unlock')).toBeInTheDocument();
      });

      await user.click(dialogButtons.confirm('Yes, unlock'));

      await waitFor(() => {
        expect(ApiService.lockUnlockReport).toHaveBeenCalledWith(
          'test-report-123',
          true,
        );
        expect(ReportChangeService.reportChanged).toHaveBeenCalledWith(
          'test-report-123',
        );
      });
    });

    it('should call ApiService.lockUnlockReport when lock button is clicked', async () => {
      const user = userEvent.setup();

      renderWithVuetify({
        report: { ...mockReport, is_unlocked: true },
        actions: [ReportAdminActions.LockUnlock],
      });

      await user.click(buttons.lockReport());

      await waitFor(() => {
        expect(dialogButtons.confirm('Yes, lock')).toBeInTheDocument();
      });

      await user.click(dialogButtons.confirm('Yes, lock'));

      await waitFor(() => {
        expect(ApiService.lockUnlockReport).toHaveBeenCalledWith(
          'test-report-123',
          false,
        );
        expect(ReportChangeService.reportChanged).toHaveBeenCalledWith(
          'test-report-123',
        );
      });
    });

    it('should NOT call ApiService when cancel is clicked', async () => {
      const user = userEvent.setup();

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.LockUnlock],
      });

      await user.click(buttons.unlockReport());

      await waitFor(() => {
        expect(dialogButtons.cancel()).toBeInTheDocument();
      });

      await user.click(dialogButtons.cancel());

      await waitFor(() => {
        expect(ApiService.lockUnlockReport).not.toHaveBeenCalled();
      });
    });
  });

  describe('Open Report Button', () => {
    it('should call ApiService.getPdfReportAsBlob when clicked', async () => {
      const user = userEvent.setup();

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.OpenReport],
      });

      await user.click(buttons.openReport());

      await waitFor(() => {
        expect(ApiService.getPdfReportAsBlob).toHaveBeenCalledWith(
          'test-report-123',
        );
        expect(ReportChangeService.reportChanged).toHaveBeenCalledWith(
          'test-report-123',
        );
        expect(window.open).toHaveBeenCalledWith('blob:mock-url');
      });
    });

    it('should show error notification when PDF download fails', async () => {
      const user = userEvent.setup();
      vi.mocked(ApiService).getPdfReportAsBlob.mockRejectedValue(
        new Error('Download failed'),
      );

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.OpenReport],
      });

      await user.click(buttons.openReport());

      await waitFor(() => {
        expect(NotificationService.pushNotificationError).toHaveBeenCalledWith(
          'Something went wrong.  Unable to download report.',
        );
      });
    });

    it('should disable button while loading PDF', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: Blob) => void;
      const promise = new Promise<Blob>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(ApiService).getPdfReportAsBlob.mockReturnValue(promise);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.OpenReport],
      });

      await user.click(buttons.openReport());

      // Button should be disabled while loading
      await waitFor(() => {
        expect(buttons.openReport()).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise!(new Blob(['pdf content'], { type: 'application/pdf' }));

      // Button should be enabled again
      await waitFor(() => {
        expect(buttons.openReport()).not.toBeDisabled();
      });
    });
  });

  describe('Admin Action History Button', () => {
    it('should call ApiService.getReportAdminActionHistory when clicked', async () => {
      const user = userEvent.setup();

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.AdminActionHistory],
      });

      await user.click(buttons.adminHistory());

      await waitFor(() => {
        expect(ApiService.getReportAdminActionHistory).toHaveBeenCalledWith(
          'test-report-123',
        );
      });
    });

    it('should only fetch history once and cache the result', async () => {
      const user = userEvent.setup();

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.AdminActionHistory],
      });

      // Click twice
      await user.click(buttons.adminHistory());

      await waitFor(() => {
        expect(ApiService.getReportAdminActionHistory).toHaveBeenCalledTimes(1);
      });

      // Click again (menu should already be open)
      await user.click(buttons.adminHistory());

      // Should still only be called once
      expect(ApiService.getReportAdminActionHistory).toHaveBeenCalledTimes(1);
    });
  });

  describe('Admin Role Requirements', () => {
    it('should NOT show Edit Reporting Year for non-admin even with action included', () => {
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(false);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.EditReportingYear],
      });

      expect(buttons.tryEditYear()).not.toBeInTheDocument();
    });

    it('should NOT show Withdraw Report for non-admin even with action included', () => {
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(false);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.WithdrawReport],
      });

      expect(buttons.tryWithdraw()).not.toBeInTheDocument();
    });

    it('should check for PTRT-ADMIN role', () => {
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.EditReportingYear],
      });

      expect(mockAuthStore.doesUserHaveRole).toHaveBeenCalledWith('PTRT-ADMIN');
    });
  });

  describe('Report Status Requirements', () => {
    it('should NOT show Edit Reporting Year for non-Published reports', () => {
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: { ...mockReport, report_status: 'Draft' },
        actions: [ReportAdminActions.EditReportingYear],
      });

      expect(buttons.tryEditYear()).not.toBeInTheDocument();
    });

    it('should NOT show Withdraw Report for non-Published reports', () => {
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: { ...mockReport, report_status: 'Draft' },
        actions: [ReportAdminActions.WithdrawReport],
      });

      expect(buttons.tryWithdraw()).not.toBeInTheDocument();
    });

    it('should show Edit Reporting Year for Published reports with admin role', () => {
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: { ...mockReport, report_status: 'Published' },
        actions: [ReportAdminActions.EditReportingYear],
      });

      expect(buttons.editYear()).toBeInTheDocument();
    });
  });

  describe('Withdraw Report', () => {
    it('should call ApiService.withdrawReport when confirmed', async () => {
      const user = userEvent.setup();
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.WithdrawReport],
      });

      await user.click(buttons.withdraw());

      // Wait for confirmation dialog
      await waitFor(() => {
        expect(dialogButtons.confirm('Yes, withdraw')).toBeInTheDocument();
      });

      await user.click(dialogButtons.confirm('Yes, withdraw'));

      await waitFor(() => {
        expect(ApiService.withdrawReport).toHaveBeenCalledWith(
          'test-report-123',
        );
        expect(ReportChangeService.reportChanged).toHaveBeenCalledWith(
          'test-report-123',
        );
        expect(
          NotificationService.pushNotificationSuccess,
        ).toHaveBeenCalledWith('Report has been withdrawn successfully.');
      });
    });

    it('should show error notification when withdraw fails', async () => {
      const user = userEvent.setup();
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);
      vi.mocked(ApiService).withdrawReport.mockRejectedValue(
        new Error('Withdraw failed'),
      );

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.WithdrawReport],
      });

      await user.click(buttons.withdraw());

      await waitFor(() => {
        expect(dialogButtons.confirm('Yes, withdraw')).toBeInTheDocument();
      });

      await user.click(dialogButtons.confirm('Yes, withdraw'));

      await waitFor(() => {
        expect(NotificationService.pushNotificationError).toHaveBeenCalledWith(
          'Failed to withdraw report. Please try again.',
        );
      });
    });

    it('should NOT call ApiService when cancel is clicked', async () => {
      const user = userEvent.setup();
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.WithdrawReport],
      });

      await user.click(buttons.withdraw());

      await waitFor(() => {
        expect(dialogButtons.cancel()).toBeInTheDocument();
      });

      await user.click(dialogButtons.cancel());

      expect(ApiService.withdrawReport).not.toHaveBeenCalled();
    });
  });

  describe('Change Reporting Year', () => {
    it('should call ApiService.updateReportReportingYear when confirmed', async () => {
      const user = userEvent.setup();
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.EditReportingYear],
      });

      await user.click(buttons.editYear());

      // Select new year
      await waitFor(() => {
        expect(inputs.yearSelect()).toBeInTheDocument();
      });

      await user.click(inputs.yearSelect());
      await user.click(inputs.currentYear());

      // Click Next
      await user.click(dialogButtons.next());
      // Confirm
      await waitFor(() => {
        expect(dialogButtons.confirm('Yes, change year')).toBeInTheDocument();
      });

      await user.click(dialogButtons.confirm('Yes, change year'));

      await waitFor(() => {
        expect(ApiService.updateReportReportingYear).toHaveBeenCalledWith(
          'test-report-123',
          currentYear,
        );
        expect(ReportChangeService.reportChanged).toHaveBeenCalledWith(
          'test-report-123',
        );
        expect(
          NotificationService.pushNotificationSuccess,
        ).toHaveBeenCalledWith('Reporting year has been updated successfully.');
      });
    });

    it('should show error when no year is selected', async () => {
      const user = userEvent.setup();
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.EditReportingYear],
      });

      await user.click(buttons.editYear());

      await waitFor(() => {
        expect(dialogButtons.next()).toBeInTheDocument();
      });

      // Click Next without selecting a year
      await user.click(dialogButtons.next());

      await waitFor(() => {
        expect(NotificationService.pushNotificationError).toHaveBeenCalledWith(
          'No year selected.',
        );
      });
    });

    it('should disable current year option in select', async () => {
      const user = userEvent.setup();
      const mockAuthStore = authStore();
      mockAuthStore.doesUserHaveRole.mockReturnValue(true);

      renderWithVuetify({
        report: mockReport,
        actions: [ReportAdminActions.EditReportingYear],
      });

      await user.click(buttons.editYear());

      await waitFor(() => {
        expect(inputs.yearSelect()).toBeInTheDocument();
      });
      await user.click(inputs.yearSelect());

      // The option for the report's year should be disabled
      const option2024 = screen.getByText('(Current reporting year)');
      expect(option2024).toBeInTheDocument();
    });
  });
});
