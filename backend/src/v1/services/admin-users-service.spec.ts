import { faker } from '@faker-js/faker';
import { AdminUserService } from './admin-users-services';
import {
  PTRT_ADMIN_ROLE_NAME,
  PTRT_USER_ROLE_NAME,
} from '../../constants/admin';

const mockFindFirst = jest.fn();
const mockFindFirstOrThrow = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client'),
  default: {
    admin_user_onboarding: {
      findFirst: (args) => mockFindFirst(args),
      findFirstOrThrow: (args) => mockFindFirstOrThrow(args),
      create: (args) => mockCreate(args),
      update: (args) => mockUpdate(args),
    },
    $extends: jest.fn(),
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

const service = new AdminUserService();

describe('admin-users-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addNewUser', () => {
    describe('when invitation does not exist', () => {
      it('should send a new invitation', async () => {
        await service.addNewUser(
          faker.internet.email(),
          PTRT_USER_ROLE_NAME,
          faker.internet.userName(),
          faker.internet.userName(),
        );
        expect(mockCreate).toHaveBeenCalledTimes(1);
        expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
      });
    });
    describe('when invitation exists', () => {
      it('should send a update invitation and send email', async () => {
        mockFindFirst.mockResolvedValue({});
        await service.addNewUser(
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

  describe('resendInvite', () => {
    it('should send a new invitation', async () => {
      mockFindFirstOrThrow.mockResolvedValue({});
      await service.resendInvite(faker.string.uuid());
      expect(mockSendEmailWithRetry).toHaveBeenCalledTimes(1);
    });
  });
});
