import { vi, describe, it, expect } from 'vitest';
import { faker } from '@faker-js/faker';
import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin.js';
import { UserInputError } from '../types/errors.js';
import { adminUserInvitesService } from './admin-user-invites-service.js';
import prisma from '../prisma/__mocks__/prisma-client.js';

const mockCreate = prisma.admin_user_onboarding.create;
const mockDelete = prisma.admin_user_onboarding.delete;
const mockFindMany = prisma.admin_user_onboarding.findMany;
const mockOnboardingFindFirst = prisma.admin_user_onboarding.findFirst;
const mockUpdate = prisma.admin_user_onboarding.update;
const mockFindUniqueOrThrow = prisma.admin_user_onboarding.findUniqueOrThrow;
const mockAdminUserFindFirst = prisma.admin_user.findFirst;
vi.mock('../prisma/prisma-client');

const mockSendEmailWithRetry = vi.fn();
vi.mock('../../external/services/ches/ches', () => ({
  default: {
    sendEmailWithRetry: () => mockSendEmailWithRetry(),
    generateHtmlEmail: () => vi.fn(),
  },
}));

describe('admin-user-invite-service', () => {
  describe('createInvite', () => {
    describe('when invitation does not exist', () => {
      it('should send a new invitation', async () => {
        await adminUserInvitesService.createInvite(
          faker.internet.email(),
          PTRT_USER_ROLE_NAME,
          faker.internet.username(),
          faker.internet.username(),
        );
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
      });

      it('should send a new invitation for admin', async () => {
        await adminUserInvitesService.createInvite(
          faker.internet.email(),
          PTRT_ADMIN_ROLE_NAME,
          faker.internet.username(),
          faker.internet.username(),
        );
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockCreate).toHaveBeenCalledWith({
          data: expect.objectContaining({
            assigned_roles: `${PTRT_ADMIN_ROLE_NAME},${PTRT_USER_ROLE_NAME}`,
          }),
        });
        expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
      });
    });
    describe('when invitation exists', () => {
      it('should send a update invitation and send email', async () => {
        mockOnboardingFindFirst.mockResolvedValue({});
        await adminUserInvitesService.createInvite(
          faker.internet.email(),
          PTRT_ADMIN_ROLE_NAME,
          faker.internet.username(),
          faker.internet.username(),
        );
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
      });
    });
    describe('when inviting a user that already exists in the system', () => {
      it('should throw a UserInputError', async () => {
        mockAdminUserFindFirst.mockResolvedValue({});
        await expect(
          adminUserInvitesService.createInvite(
            faker.internet.email(),
            PTRT_ADMIN_ROLE_NAME,
            faker.internet.username(),
            faker.internet.username(),
          ),
        ).rejects.toThrow(UserInputError);
        expect(mockUpdate).toHaveBeenCalledTimes(0);
        expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('getPendingInvites', () => {
    it('should return the pending user invites', async () => {
      const userInvites = [{ id: '1' }, { id: '2' }];
      mockFindMany.mockResolvedValue(userInvites);

      const result = await adminUserInvitesService.getPendingInvites();

      expect(result).toEqual(userInvites);
      expect(mockFindMany).toHaveBeenCalledTimes(1);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          is_onboarded: false,
          expiry_date: { gt: expect.any(Date) },
        },
      });
    });
  });

  describe('deleteInvite', () => {
    it('should delete the user invite', async () => {
      const id = '1';
      const deletedInvite = { id };
      mockDelete.mockResolvedValue(deletedInvite);

      const result = await adminUserInvitesService.deleteInvite(id);

      expect(result).toEqual(deletedInvite);
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith({
        where: {
          admin_user_onboarding_id: id,
        },
      });
    });
  });

  describe('resendInvite', () => {
    it('should send a new invitation', async () => {
      mockFindUniqueOrThrow.mockResolvedValue({});
      await adminUserInvitesService.resendInvite(faker.string.uuid());
      expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
    });
  });
});
