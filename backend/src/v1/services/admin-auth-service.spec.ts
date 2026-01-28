import { faker } from '@faker-js/faker';
import { convert, LocalDateTime, ZoneId } from '@js-joda/core';
import axios from 'axios';
import { KEYCLOAK_IDP_HINT_AZUREIDIR } from '../../constants';
import prisma from '../prisma/prisma-client';
import { adminAuth, IUserDetails } from './admin-auth-service';
import { ROLE_ADMIN_USER } from './sso-service';
import { utils } from './utils-service';

//Mock the entire axios module so we never inadvertently make real
//HTTP calls to remote services
jest.mock('axios');

const mockGetSessionUser = jest.fn();
jest.mock('./utils-service', () => {
  const actualUtils = jest.requireActual('./utils-service').utils;
  return {
    utils: {
      ...actualUtils,
      getSessionUser: () => mockGetSessionUser(),
      getOidcDiscovery: jest.fn(),
      getKeycloakPublicKey: jest.fn(),
    },
  };
});

jest.mock('../../config/config', () => {
  const actualConfig = jest.requireActual('../../config/config').config;
  return {
    config: {
      get: (key) => {
        const settings = {
          'oidc:adminClientId': '1234',
          'tokenGenerate:issuer': 'issuer',
          'server:adminFrontend': 'server-admin-frontend',
          'tokenGenerate:audience': 'audience',
          'tokenGenerate:privateKey': actualConfig.get(
            'tokenGenerate:privateKey',
          ),
        };
        return settings[key];
      },
    },
  };
});

const actualJsonWebToken = jest.requireActual('jsonwebtoken');

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

  describe('generateFrontendToken', () => {
    it('generates a new JWT token that expires in 30 minute (1800 seconds)', async () => {
      const token = adminAuth.generateFrontendToken();
      const payload: any = actualJsonWebToken.decode(token);

      const nowSeconds = Date.now().valueOf() / 1000;
      const ttlSeconds = payload.exp - nowSeconds;

      const expectedTtlSeconds = 1800; //30 minutes
      const ttlToleranceSeconds = 5;

      //Because a small (but non-zero) amount of time elapsed between when
      //the token was generated and when its expiration date was checked, we
      //must expect the time-to-live (TTL) to be slightly less than 30 minutes.
      //Check that the TTL is within a small tolerance of the expected TTL.
      expect(ttlSeconds).toBeLessThanOrEqual(expectedTtlSeconds);
      expect(ttlSeconds).toBeGreaterThanOrEqual(
        expectedTtlSeconds - ttlToleranceSeconds,
      );
    });
  });

  describe('renew', () => {
    describe('when the identity provider successfully refreshes the tokens', () => {
      it('responds with an object containing three new tokens (access, id and refresh)', async () => {
        //Mock the call made by auth.renew(...) to utils.getOidcDiscovery(...) so it doesn't
        //depend on a remote service.  The mocked return value must include a "token_endpoint"
        //property, but the value of that property isn't important because
        //we're also mocking the HTTP request (see below) that uses the return value
        const mockGetOidcDiscoveryResponse = { token_endpoint: null };
        (utils.getOidcDiscovery as jest.Mock).mockResolvedValueOnce(
          mockGetOidcDiscoveryResponse,
        );

        //Mock the HTTP post request made by auth.renew(...) to the identity provider to
        //refresh the token.
        const mockSuccessfulRefreshTokenResponse = {
          data: {
            access_token: 'new_access_token',
            refresh_token: 'new_refresh_token',
            id_token: 'new_id_token',
          },
        };
        (axios.post as jest.Mock).mockResolvedValueOnce(
          mockSuccessfulRefreshTokenResponse,
        );

        //We don't need a real refresh token because we're mocking the call to the
        //identity provider
        const dummyRefreshToken = 'old_refresh_token';

        const result = await adminAuth.renew(dummyRefreshToken);

        //Confirm that the auth.renew(...) function returns a response object
        //with the expected properties
        expect(result.jwt).toBe(
          mockSuccessfulRefreshTokenResponse.data.access_token,
        );
        expect(result.refreshToken).toBe(
          mockSuccessfulRefreshTokenResponse.data.refresh_token,
        );
        expect(result.idToken).toBe(
          mockSuccessfulRefreshTokenResponse.data.id_token,
        );
      });
    });
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
        preferred_username: faker.internet.username(),
      });
      const result = await adminAuth.handleCallBackAzureIdir({} as any);
      expect(result).toBe('loginError');
    });
    it('should return login error when audience validation fails', async () => {
      mockGetSessionUser.mockReturnValue({});
      mockJWTDecode.mockReturnValue({
        idir_user_guid: faker.string.uuid(),
        email: faker.internet.email(),
        preferred_username: faker.internet.username(),
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

  describe('storeUserInfoWithHistory', () => {
    describe('when there is no current record of the user', () => {
      it('adds the user', async () => {
        const userDetails: IUserDetails = {
          idirUserGuid: faker.string.uuid(),
          displayName: 'Mock user',
          preferredUsername: faker.internet.username(),
          email: faker.internet.email(),
          roles: [ROLE_ADMIN_USER],
        };
        mockAdminUserFindFirst.mockResolvedValue(null);
        await adminAuth.storeUserInfoWithHistory(userDetails);
        expect(mockAdminUserFindFirst).toHaveBeenCalledTimes(1);
        expect(mockAdminUserCreate).toHaveBeenCalledTimes(1);
        expect(mockAdminUserUpdate).toHaveBeenCalledTimes(0);
        expect(mockAdminUserHistoryCreate).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('handleGetUserInfo', () => {
    it('should return user info', async () => {
      const mockStatus = jest.fn();
      const mockJson = jest.fn();
      const res = {
        status: mockStatus.mockImplementation(() => {
          return {
            json: mockJson,
          };
        }),
      };
      mockAdminUserFindFirst.mockResolvedValue({ admin_user_id: '1234' });
      mockGetSessionUser.mockReturnValue({
        _json: { display_name: 'test' },
        jwt: { preferred_username: 'user123' },
      });
      await adminAuth.handleGetUserInfo({} as any, res as any);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        id: '1234',
        displayName: expect.any(String),
      });
    });

    it('should return 404 if user not found', async () => {
      const mockStatus = jest.fn();
      const mockJson = jest.fn();
      const res = {
        status: mockStatus.mockImplementation(() => {
          return {
            json: mockJson,
          };
        }),
      };
      mockGetSessionUser.mockReturnValue({});
      await adminAuth.handleGetUserInfo({} as any, res as any);
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({ message: 'No session data' });
    });
  });
});
