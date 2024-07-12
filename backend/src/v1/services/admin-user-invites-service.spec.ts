import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin';
import {
  createInvite,
  deleteInvite,
  getPendingInvites,
  resendInvite,
} from './admin-user-invites-service';
import { faker } from '@faker-js/faker';

const mockCreate = jest.fn();
const mockDelete = jest.fn();
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockFindUniqueOrThrow = jest.fn();
jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    admin_user_onboarding: {
      findMany: (...args) => mockFindMany(...args),
      delete: (...args) => mockDelete(...args),
      create: (...args) => mockCreate(...args),
      update: (...args) => mockUpdate(...args),
      findFirst: (...args) => mockFindFirst(...args),
      findUniqueOrThrow: (...args) => mockFindUniqueOrThrow(...args),
    },
  },
}));

const mockSendEmailWithRetry = jest.fn();
jest.mock('../../external/services/ches', () => ({
  __esModule: true,
  default: {
    sendEmailWithRetry: () => mockSendEmailWithRetry(),
    generateHtmlEmail: () => jest.fn(),
  },
}));

describe('admin-user-invite-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    describe('when invitation does not exist', () => {
      it('should send a new invitation', async () => {
        await createInvite(
          faker.internet.email(),
          PTRT_USER_ROLE_NAME,
          faker.internet.userName(),
          faker.internet.userName(),
        );
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
      });

      it('should send a new invitation for admin', async () => {
        await createInvite(
          faker.internet.email(),
          PTRT_ADMIN_ROLE_NAME,
          faker.internet.userName(),
          faker.internet.userName(),
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
        mockFindFirst.mockResolvedValue({});
        await createInvite(
          faker.internet.email(),
          PTRT_ADMIN_ROLE_NAME,
          faker.internet.userName(),
          faker.internet.userName(),
        );
        expect(mockUpdate).toHaveBeenCalledTimes(1);
        expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('getPendingInvites', () => {
    it('should return the pending user invites', async () => {
      const userInvites = [{ id: '1' }, { id: '2' }];
      mockFindMany.mockResolvedValue(userInvites);

      const result = await getPendingInvites();

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

      const result = await deleteInvite(id);

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
      await resendInvite(faker.string.uuid());
      expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
    });
  });
});
