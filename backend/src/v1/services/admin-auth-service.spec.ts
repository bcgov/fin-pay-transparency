import { faker } from '@faker-js/faker';
import { adminAuth } from './admin-auth-service';
import { KEYCLOAK_IDP_HINT_AZUREIDIR } from '../../constants';
import { LocalDateTime, ZoneId, convert } from '@js-joda/core';
import prisma from '../prisma/prisma-client';

const mockGetSessionUser = jest.fn();
jest.mock('./utils-service', () => ({
  utils: {
    getSessionUser: () => mockGetSessionUser(),
  },
}));

jest.mock('../../config', () => ({
  config: {
    get: (key) => {
      const settings = {
        'oidc:adminClientId': '1234',
      };

      return settings[key];
    },
  },
}));

const mockJWTDecode = jest.fn();
jest.mock('jsonwebtoken', () => ({
  ...jest.requireActual('jsonwebtoken'),
  decode: () => {
    return mockJWTDecode();
  },
}));

const mockGetRolesByUser = jest.fn();
const mockAddRolesToUser = jest.fn();
const mockInitSSO = jest.fn();
jest.mock('./sso-service', () => ({
  SSO: {
    init: () => mockInitSSO(),
  },
}));

const mockFindFirst = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockAdminUserFindFirst = jest.fn();
const mockAdminUserCreate = jest.fn();
const mockAdminUserUpdate = jest.fn();
const mockAdminUserHistoryCreate = jest.fn();
jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client'),
  default: {
    admin_user_onboarding: {
      findFirst: (args) => mockFindFirst(args),
      create: (args) => mockCreate(args),
      update: (args) => mockUpdate(args),
    },
    admin_user: {
      findFirst: (args) => mockAdminUserFindFirst(args),
      create: (args) => mockAdminUserCreate(args),
      update: (args) => mockAdminUserUpdate(args),
    },
    admin_user_history: {
      create: (args) => mockAdminUserHistoryCreate(args),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
    $extends: jest.fn(),
  },
}));

describe('admin-auth-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('handleCallBackAzureIdir', () => {
    it('should return login error when jwt decode fails', async () => {
      mockGetSessionUser.mockReturnValue({});
      const result = await adminAuth.handleCallBackAzureIdir({} as any);
      expect(result).toBe('loginError');
    });
    it('should return login error when identity_provider is not KEYCLOAK_IDP_HINT_AZUREIDIR', async () => {
      mockGetSessionUser.mockReturnValue({});
      mockJWTDecode.mockReturnValue({
        idir_user_guid: faker.string.uuid(),
        email: faker.internet.email(),
        preferred_username: faker.internet.userName(),
      });
      const result = await adminAuth.handleCallBackAzureIdir({} as any);
      expect(result).toBe('loginError');
    });
    it('should return login error when audience validation fails', async () => {
      mockGetSessionUser.mockReturnValue({});
      mockJWTDecode.mockReturnValue({
        idir_user_guid: faker.string.uuid(),
        email: faker.internet.email(),
        preferred_username: faker.internet.userName(),
        identity_provider: KEYCLOAK_IDP_HINT_AZUREIDIR,
      });
      const result = await adminAuth.handleCallBackAzureIdir({} as any);
      expect(result).toBe('loginError');
    });

    describe('processUser', () => {
      beforeEach(() => {
        mockGetSessionUser.mockReturnValue({
          _json: { display_name: 'test' },
        });
        mockJWTDecode.mockReturnValue({
          idir_user_guid: faker.string.uuid(),
          email: faker.internet.email(),
          preferred_username: 'user123',
          identity_provider: KEYCLOAK_IDP_HINT_AZUREIDIR,
          aud: '1234',
        });
      });
      describe('when onboarding data', () => {
        it('should return invitation expired', async () => {
          mockFindFirst.mockResolvedValue({
            assigned_roles: 'admin',
            expiry_date: convert(
              LocalDateTime.now(ZoneId.UTC).minusDays(1),
            ).toDate(),
          });
          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('invitationExpired');
        });

        it('should return role changed reason', async () => {
          mockGetRolesByUser
            .mockResolvedValueOnce([]) // first time, this user will have no roles
            .mockResolvedValue([{ name: 'admin' }]); // second time is after the roles have already been set
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });
          mockFindFirst.mockResolvedValue({
            assigned_roles: 'admin',
            expiry_date: convert(
              LocalDateTime.now(ZoneId.UTC).plusDays(1),
            ).toDate(),
          });
          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('roleChanged');
        });
      });
      describe('when no onboarding data', () => {
        it('should return unauthorized if SSO has no permissions', async () => {
          mockFindFirst.mockResolvedValue(undefined);
          mockGetRolesByUser.mockResolvedValue([]);
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });

          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('notAuthorized');
        });
        it('should return success login if SSO gives permission', async () => {
          mockAdminUserFindFirst.mockResolvedValue(undefined);
          mockFindFirst.mockResolvedValue(undefined);
          mockGetRolesByUser.mockResolvedValue([{ name: 'user' }]);
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });

          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('login');
        });
        it('should update the admin user if it already exists and is inactive', async () => {
          mockAdminUserFindFirst.mockResolvedValue({
            display_name: 'test',
            preferred_username: 'user123',
            assigned_roles: 'user',
            is_active: false,
          });
          mockFindFirst.mockResolvedValue(undefined);
          mockGetRolesByUser.mockResolvedValue([{ name: 'user' }]);
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });

          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('login');
        });
        it('should modify last login time', async () => {
          mockFindFirst.mockResolvedValue(undefined);

          mockGetRolesByUser.mockResolvedValue([{ name: 'user' }]);
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });
          mockAdminUserFindFirst.mockResolvedValue({
            display_name: 'test',
            preferred_username: 'user123',
            assigned_roles: 'user',
            is_active: true,
          });

          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('login');
          expect(mockAdminUserUpdate).toHaveBeenCalled();
        });
      });
      describe('when SSO changes from keycload and not the Admin Portal', () => {
        it('should create a new admin user', async () => {
          mockFindFirst.mockResolvedValue(undefined);

          mockGetRolesByUser.mockResolvedValue([
            { name: 'admin' },
            { name: 'user' },
          ]);
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });
          mockAdminUserFindFirst.mockResolvedValue(undefined);

          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('login');
          expect(mockAdminUserCreate).toHaveBeenCalled();
        });
        it('should update history table if the user already exists', async () => {
          mockFindFirst.mockResolvedValue(undefined);

          mockGetRolesByUser.mockResolvedValue([
            { name: 'admin' },
            { name: 'user' },
          ]);
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });
          mockAdminUserFindFirst.mockResolvedValue({
            assigned_roles: 'user',
          });

          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('login');
          expect(mockAdminUserUpdate).toHaveBeenCalled();
          expect(mockAdminUserHistoryCreate).toHaveBeenCalled();
        });
      });
    });
  });
});
