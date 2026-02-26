import { config } from '../../config/config.js';

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
  ANNOUNCEMENT_ALERT: {
    subject: (envPrefix: string) =>
      `${envPrefix}Pay Transparency | Expiring Announcement`,
    title: '',
    body: (title: string, expiryStr: string) => `
        <p>Please be advised that the announcement titled <b>${title}</b> will 
        expire on <b>${expiryStr}</b> If you want to extend or change this 
        announcement, please log into the Admin Portal to make the change. 
        Otherwise, the announcement will be automatically removed from the 
        Pay Transparency Reporting Tool site on the expiry date. This announcement will be permanently deleted from the database ${config.get('server:deleteAnnouncementsDurationInDays')} days after it has expired.</p>`,
  },
};
