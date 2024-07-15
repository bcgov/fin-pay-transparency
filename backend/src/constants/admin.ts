import { RoleType } from '../v1/types/users';

export const PTRT_ADMIN_ROLE_NAME = 'PTRT-ADMIN';
export const PTRT_USER_ROLE_NAME = 'PTRT-USER';

export const EFFECTIVE_ROLES: { [key in RoleType]: RoleType[] } = {
  [PTRT_ADMIN_ROLE_NAME]: [PTRT_ADMIN_ROLE_NAME, PTRT_USER_ROLE_NAME],
  [PTRT_USER_ROLE_NAME]: [PTRT_USER_ROLE_NAME],
};
