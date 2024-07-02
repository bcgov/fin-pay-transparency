import { config } from '../../config';
import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin';
import emailService from '../../external/services/ches';
import prisma from '../prisma/prisma-client';
import { LocalDateTime, ZoneId, convert } from '@js-joda/core';

export class AdminUserService {
  async addNewUser(
    email: string,
    role: string,
    firstname: string,
    createdBy: string,
  ) {
    const pendingUserRequest = await prisma.admin_user_onboarding.findFirst({
      where: {
        email: email,
        is_onboarded: false,
        expiry_date: { lte: convert(LocalDateTime.now(ZoneId.UTC)).toDate() },
      },
    });

    const expiryDate = convert(
      LocalDateTime.now(ZoneId.UTC).plusHours(
        config.get('server:adminInvitationDurationInHours'),
      ),
    ).toDate();

    if (pendingUserRequest) {
      await prisma.admin_user_onboarding.update({
        where: {
          admin_user_onboarding_id: pendingUserRequest.admin_user_onboarding_id,
        },
        data: {
          expiry_date: expiryDate,
        },
      });
    } else {
      const roles =
        role === PTRT_ADMIN_ROLE_NAME
          ? [PTRT_ADMIN_ROLE_NAME, PTRT_USER_ROLE_NAME]
          : [PTRT_USER_ROLE_NAME];
      await prisma.admin_user_onboarding.create({
        data: {
          email: email,
          first_name: firstname,
          assigned_roles: roles.join(','),
          is_onboarded: false,
          created_by: createdBy,
          expiry_date: expiryDate,
        },
      });
    }
    await this.sendUserEmailInvite(email, firstname);
  }

  async sendUserEmailInvite(email: string, firstname: string) {
    const htmlEmail = emailService?.generateHtmlEmail(
      'Pay Transparency Admin Portal Onboarding',
      [email],
      'Pay Transparency Admin Portal Onboarding',
      `Hello ${firstname}, <br><br> You have been invited to join the Pay Transparency Admin Portal as an User. Please click the link below to complete your registration and access the application. <br><br> <a href="${config.get('adminFrontend')}">Click here to complete your registration</a>`,
      `You have been invited to join the Pay Transparency Admin Portal as an Admin User. Please click the link below to complete your registration and access the application.<a href="${config.get('adminFrontend')}">Click here to complete your registration</a>`,
    );
    await emailService?.sendEmailWithRetry(htmlEmail, 3);
  }
}
