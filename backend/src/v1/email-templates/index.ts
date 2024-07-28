import { config } from '../../config';

export const EMAIL_TEMPLATES = {
  USER_INVITE: {
    subject: 'Pay Transparency Admin Portal Onboarding',
    title: 'Pay Transparency Admin Portal Onboarding',
    body: (firstname: string) => `
        <p>Hello ${firstname},</p>
        <p>
        You are invited to join the Pay Transparency Admin Portal as an Admin User.
        Please click the link
        <a href="${config.get('server:adminFrontendUrl')}">here</a>
        to complete your registration and access the application. This invitation
        expires in
        ${config.get('server:adminInvitationDurationInHours')}
        hours after which the Admin Portal Manager will need to add you again.
        </p>
        <p>
        Upon first login, you will be logged out to allow the system to confirm your
        access. You will then need to log in again.
        </p>`,
  },
};
