export const ADMIN_ROLE_NAME = 'PTRT-ADMIN';
export const USER_ROLE_NAME = 'PTRT-USER';

export type RoleType = 'PTRT-ADMIN' | 'PTRT-USER' | undefined;

export const RoleLabels = {
  'PTRT-ADMIN': 'Manager',
  'PTRT-USER': 'User',
};

export const NextRoleTransitions = {
  'PTRT-ADMIN': 'PTRT-USER',
  'PTRT-USER': 'PTRT-ADMIN',
};

export const RoleOptions = [
  { label: RoleLabels['PTRT-ADMIN'], value: 'PTRT-ADMIN' },
  { label: RoleLabels['PTRT-USER'], value: 'PTRT-USER' },
];

export const FILE_DOWNLOAD_ERROR =
  'There is a problem with this link/file, please try again later or contact the helpdesk.';

export enum ReportAdminActions {
  OpenReport = 'openReport',
  LockUnlock = 'lockUnlock',
  EditReportingYear = 'editReportingYear',
  WithdrawReport = 'withdrawReport',
  AdminActionHistory = 'adminActionHistory',
}
