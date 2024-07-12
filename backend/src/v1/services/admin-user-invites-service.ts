import { admin_user_onboarding } from '@prisma/client';
import prisma from '../prisma/prisma-client';
import { AdminUserService } from './admin-users-services';
import { convert, LocalDateTime, ZoneId } from '@js-joda/core';
import { config } from '../../config';
import { string } from 'zod';
import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin';
import emailService from '../../external/services/ches';
import { EMAIL_TEMPLATES } from '../email-templates';

/**
 * Create a new user invite and send email to user
 * @param email
 * @param role
 * @param firstname
 * @param createdBy
 */
const createInvite = async (
  email: string,
  role: string,
  firstname: string,
  createdBy: string,
) => {
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
  await sendUserEmailInvite(email, firstname);
};

/**
 * Resend a user invite email to user and reset expiry date
 * @param invitationId
 */
const resendInvite = async (invitationId: string) => {
  const pendingUserRequest =
    await prisma.admin_user_onboarding.findUniqueOrThrow({
      where: {
        admin_user_onboarding_id: invitationId,
      },
    });

  await sendUserEmailInvite(
    pendingUserRequest.email,
    pendingUserRequest.first_name,
  );

  const expiryDate = convert(
    LocalDateTime.now(ZoneId.UTC).plusHours(
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
};

const sendUserEmailInvite = async (email: string, firstname: string) => {
  const htmlEmail = emailService?.generateHtmlEmail(
    EMAIL_TEMPLATES.USER_INVITE.subject,
    [email],
    EMAIL_TEMPLATES.USER_INVITE.title,
    '',
    EMAIL_TEMPLATES.USER_INVITE.body(firstname),
  );
  await emailService?.sendEmailWithRetry(htmlEmail, 3);
};

/**
 * Get all pending user invites
 * @returns {Promise<admin_user_onboarding[]>} Promise object represents the list of pending user invites
 */
const getPendingInvites = async (): Promise<admin_user_onboarding[]> => {
  const userInvites = await prisma.admin_user_onboarding.findMany({
    where: {
      is_onboarded: false,
      expiry_date: { gt: new Date() },
    },
  });
  return userInvites;
};

/**
 * Delete a user invite
 * @param {string} id - The id of the user invite to delete
 * @returns {Promise<admin_user_onboarding>} Promise object represents the deleted user invite
 */
const deleteInvite = async (id: string): Promise<admin_user_onboarding> => {
  const deletedInvite = await prisma.admin_user_onboarding.delete({
    where: {
      admin_user_onboarding_id: id,
    },
  });
  return deletedInvite;
};

export { getPendingInvites, deleteInvite, resendInvite, createInvite };
