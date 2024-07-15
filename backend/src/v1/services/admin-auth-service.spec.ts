import { faker } from '@faker-js/faker';
import { adminAuth } from './admin-auth-service';
import { KEYCLOAK_IDP_HINT_AZUREIDIR } from '../../constants';
import { LocalDateTime, ZoneId, convert } from '@js-joda/core';

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
jest.mock('../prisma/prisma-client', () => ({
  __esModule: true,
  ...jest.requireActual('../prisma/prisma-client'),
  default: {
    admin_user_onboarding: {
      findFirst: (args) => mockFindFirst(args),
      create: (args) => mockCreate(args),
      update: (args) => mockUpdate(args),
    },
    $transaction: (tx) => {
      return jest.fn();
    },
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

    describe('processUserOnboarding', () => {
      it('should return invitation expired', async () => {
        mockGetSessionUser.mockReturnValue({ _json: { display_name: 'test' } });
        mockJWTDecode.mockReturnValue({
          idir_user_guid: faker.string.uuid(),
          email: faker.internet.email(),
          preferred_username: faker.internet.userName(),
          identity_provider: KEYCLOAK_IDP_HINT_AZUREIDIR,
          aud: '1234',
        });
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
        mockGetRolesByUser.mockResolvedValue([]);
        mockInitSSO.mockReturnValue({
          getRolesByUser: () => mockGetRolesByUser(),
          addRolesToUser: () => mockAddRolesToUser(),
        });
        mockGetSessionUser.mockReturnValue({ _json: { display_name: 'test' } });
        mockJWTDecode.mockReturnValue({
          idir_user_guid: faker.string.uuid(),
          email: faker.internet.email(),
          preferred_username: faker.internet.userName(),
          identity_provider: KEYCLOAK_IDP_HINT_AZUREIDIR,
          aud: '1234',
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
      describe('when no onboarding data', () => {
        it('should return unauthorized', async () => {
          mockFindFirst.mockResolvedValue(undefined);
          mockGetRolesByUser.mockResolvedValue([]);
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });
          mockGetSessionUser.mockReturnValue({
            _json: { display_name: 'test' },
          });
          mockJWTDecode.mockReturnValue({
            idir_user_guid: faker.string.uuid(),
            email: faker.internet.email(),
            preferred_username: faker.internet.userName(),
            identity_provider: KEYCLOAK_IDP_HINT_AZUREIDIR,
            aud: '1234',
          });

          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('notAuthorized');
        });

        it('should return success login', async () => {
          mockFindFirst.mockResolvedValue(undefined);
          mockGetRolesByUser.mockResolvedValue(['']);
          mockInitSSO.mockReturnValue({
            getRolesByUser: () => mockGetRolesByUser(),
            addRolesToUser: () => mockAddRolesToUser(),
          });
          mockGetSessionUser.mockReturnValue({
            _json: { display_name: 'test' },
          });
          mockJWTDecode.mockReturnValue({
            idir_user_guid: faker.string.uuid(),
            email: faker.internet.email(),
            preferred_username: faker.internet.userName(),
            identity_provider: KEYCLOAK_IDP_HINT_AZUREIDIR,
            aud: '1234',
          });

          const result = await adminAuth.handleCallBackAzureIdir({} as any);
          expect(result).toBe('login');
        });
      });
    });
  });
});
