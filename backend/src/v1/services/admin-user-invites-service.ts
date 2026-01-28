import { convert, ZonedDateTime, ZoneId } from '@js-joda/core';
import { admin_user_onboarding } from '@prisma/client';
import { config } from '../../config/config';
import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin';
import emailService from '../../external/services/ches';
import { EMAIL_TEMPLATES } from '../email-templates';
import prisma from '../prisma/prisma-client';
import { UserInputError } from '../types/errors';

export const adminUserInvitesService = {
  /**
   * Create a new user invite and send email to user
   * @param email
   * @param role
   * @param firstname
   * @param createdBy
   */
  async createInvite(
    email: string,
    role: string,
    firstname: string,
    createdBy: string,
  ) {
    const existingActiveUser = await prisma.admin_user.findFirst({
      where: {
        email: email,
        is_active: true,
      },
    });
    if (existingActiveUser) {
      throw new UserInputError(
        `There is already a user associated with email address '${email}'.`,
      );
    }
    const pendingUserRequest = await prisma.admin_user_onboarding.findFirst({
      where: {
        email: email,
        is_onboarded: false,
        expiry_date: { lte: convert(ZonedDateTime.now(ZoneId.UTC)).toDate() },
      },
    });

    const expiryDate = convert(
      ZonedDateTime.now(ZoneId.UTC).plusHours(
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
  },

  /**
   * Resend a user invite email to user and reset expiry date
   * @param invitationId
   */
  async resendInvite(invitationId: string) {
    const pendingUserRequest =
      await prisma.admin_user_onboarding.findUniqueOrThrow({
        where: {
          admin_user_onboarding_id: invitationId,
        },
      });

    await this.sendUserEmailInvite(
      pendingUserRequest.email,
      pendingUserRequest.first_name,
    );

    const expiryDate = convert(
      ZonedDateTime.now(ZoneId.UTC).plusHours(
        config.get('server:adminInvitationDurationInHours'),
      ),
    ).toDate();

    await prisma.admin_user_onboarding.update({
      where: {
        admin_user_onboarding_id: invitationId,
      },
      data: {
        expiry_date: expiryDate,
      },
    });
  },

  async sendUserEmailInvite(email: string, firstname: string) {
    const htmlEmail = emailService?.generateHtmlEmail(
      EMAIL_TEMPLATES.USER_INVITE.subject,
      [email],
      EMAIL_TEMPLATES.USER_INVITE.title,
      '',
      EMAIL_TEMPLATES.USER_INVITE.body(firstname),
    );
    await emailService?.sendEmailWithRetry(htmlEmail, 3);
  },

  /**
   * Get all pending user invites
   * @returns {Promise<admin_user_onboarding[]>} Promise object represents the list of pending user invites
   */
  async getPendingInvites(): Promise<admin_user_onboarding[]> {
    const userInvites = await prisma.admin_user_onboarding.findMany({
      where: {
        is_onboarded: false,
        expiry_date: { gt: new Date() },
      },
    });
    return userInvites;
  },

  /**
   * Delete a user invite
   * @param {string} id - The id of the user invite to delete
   * @returns {Promise<admin_user_onboarding>} Promise object represents the deleted user invite
   */
  async deleteInvite(id: string): Promise<admin_user_onboarding> {
    const deletedInvite = await prisma.admin_user_onboarding.delete({
      where: {
        admin_user_onboarding_id: id,
      },
    });
    return deletedInvite;
  },
};
