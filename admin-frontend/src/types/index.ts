export interface IConfigValue {
  deleteAnnouncementsDurationInDays: number;
  reportUnlockDurationInDays: number;
}

export type User = {
  id: string;
  displayName: string;
  effectiveRole: string;
};

export type CreateUserInviteInput = {
  firstName: string;
  email: string;
  role: string;
};

export type UserInvite = {
  admin_user_onboarding_id: string;
  first_name: string;
  email: string;
  role: string;
};

export interface INaicsCode {
  naics_code: string;
  naics_label: string;
}

export interface IEmployeeCountRange {
  employee_count_range_id: string;
  employee_count_range: string;
}
