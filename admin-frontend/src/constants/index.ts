export const ADMIN_ROLE_NAME = 'PTRT-ADMIN';
export const USER_ROLE_NAME = 'PTRT-USER';

export type RoleType = 'PTRT-ADMIN' | 'PTRT-USER' | undefined;

export const RoleLabels = {
  'PTRT-ADMIN': 'Manager',
  'PTRT-USER': 'User',
};

export const RoleOptions = [
  { label: RoleLabels['PTRT-ADMIN'], value: 'PTRT-ADMIN' },
  { label: RoleLabels['PTRT-USER'], value: 'PTRT-USER' },
];
