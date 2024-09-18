export interface IConfigValue {
  deleteAnnouncementsDurationInDays: number;
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
