import { beforeEach, describe, expect, it, Mock, vi, afterEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { authStore } from '../auth';
import AuthService from '../../../common/authService';
import ApiService from '../../../common/apiService';

vi.mock('../../../common/authService', async (importOriginal) => {
  const mod: any = await importOriginal();
  const resp: any = {
    default: {
      ...mod.default,
      getAuthToken: vi.fn(),
      refreshAuthToken: vi.fn(),
    },
  };
  return resp;
});

vi.mock('../../../common/apiService', async (importOriginal) => {
  const mod: any = await importOriginal();
  return {
    default: {
      ...mod.default,
      setAuthHeader: vi.fn(),
      setCorrelationID: vi.fn(),
      getUserInfo: vi.fn(),
    },
  };
});

describe('AuthStore', () => {
  let auth: any;
  let pinia;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllTimers();
    vi.clearAllMocks();

    pinia = createTestingPinia({
      stubActions: false,
      fakeApp: true,
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    auth = authStore(pinia);
    vi.useFakeTimers();
  });

  afterEach(() => {
    auth.stopKeepAlive();
    vi.useRealTimers();
  });

  describe('setJwtToken', () => {
    it('should set token, mark as authenticated, and store in localStorage when token provided', () => {
      auth.setJwtToken('testToken');

      expect(auth.isAuthenticated).toBe(true);
      expect(auth.jwtToken).toBe('testToken');
      expect(localStorage.getItem('jwtToken')).toBe('testToken');
    });

    it('should clear token, mark as unauthenticated, and remove from localStorage when no token provided', () => {
      auth.setJwtToken('testToken');
      auth.setJwtToken();

      expect(auth.isAuthenticated).toBe(false);
      expect(auth.jwtToken).toBeNull();
      expect(localStorage.getItem('jwtToken')).toBeNull();
    });
  });

  describe('setCorrelationID', () => {
    it('should set correlationID in localStorage when provided', () => {
      auth.setCorrelationID('testCorrelationID');
      expect(localStorage.getItem('correlationID')).toBe('testCorrelationID');
    });

    it('should remove correlationID from localStorage when not provided', () => {
      auth.setCorrelationID('testCorrelationID');
      auth.setCorrelationID();
      expect(localStorage.getItem('correlationID')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear token and userInfo', () => {
      auth.setJwtToken('testToken');
      auth.userInfo = { name: 'Test User' };

      auth.logout();

      expect(auth.isAuthenticated).toBe(false);
      expect(auth.jwtToken).toBeNull();
      expect(auth.userInfo).toBeNull();
      expect(localStorage.getItem('jwtToken')).toBeNull();
    });
  });

  describe('getUserInfo', () => {
    it('should fetch and store user info', async () => {
      const mockUserInfo = { name: 'Test User', email: 'test@example.com' };
      (ApiService.getUserInfo as Mock).mockResolvedValueOnce({
        data: mockUserInfo,
      });

      await auth.getUserInfo();

      expect(auth.userInfo).toEqual(mockUserInfo);
      expect(ApiService.getUserInfo).toHaveBeenCalledTimes(1);
    });
  });

  describe('getJwtToken - Initial Login', () => {
    it('should call getAuthToken and set token, correlationID, and API headers', async () => {
      const now = Date.now();
      const mockResponse = {
        jwtFrontend: 'newToken',
        correlationID: 'newCorrelationID',
        exp: Math.floor(now / 1000) + 1800,
        iat: Math.floor(now / 1000),
      };

      (AuthService.getAuthToken as Mock).mockResolvedValueOnce(mockResponse);

      await auth.getJwtToken();

      expect(AuthService.getAuthToken).toHaveBeenCalledTimes(1);
      expect(auth.jwtToken).toBe('newToken');
      expect(localStorage.getItem('jwtToken')).toBe('newToken');
      expect(localStorage.getItem('correlationID')).toBe('newCorrelationID');
      expect(ApiService.setAuthHeader).toHaveBeenCalledWith('newToken');
      expect(ApiService.setCorrelationID).toHaveBeenCalledWith(
        'newCorrelationID',
      );
    });

    it('should throw error if API returns no jwtFrontend on initial login', async () => {
      (AuthService.getAuthToken as Mock).mockResolvedValueOnce({
        correlationID: 'correlationID',
      });

      await expect(auth.getJwtToken()).rejects.toThrow('No jwtFrontend');
    });
  });

  describe('getJwtToken - Token Refresh', () => {
    it('should call refreshAuthToken with existing token and correlationID, then update store', async () => {
      const now = Date.now();
      auth.setJwtToken('existingToken');
      localStorage.setItem('correlationID', 'existingCorrelationID');

      const mockResponse = {
        jwtFrontend: 'refreshedToken',
        correlationID: 'refreshedCorrelationID',
        exp: Math.floor(now / 1000) + 1800,
        iat: Math.floor(now / 1000),
      };

      (AuthService.refreshAuthToken as Mock).mockResolvedValueOnce(
        mockResponse,
      );

      await auth.getJwtToken();

      expect(AuthService.refreshAuthToken).toHaveBeenCalledWith(
        'existingToken',
        'existingCorrelationID',
      );
      expect(auth.jwtToken).toBe('refreshedToken');
      expect(localStorage.getItem('jwtToken')).toBe('refreshedToken');
      expect(localStorage.getItem('correlationID')).toBe(
        'refreshedCorrelationID',
      );
      expect(ApiService.setAuthHeader).toHaveBeenCalledWith('refreshedToken');
      expect(ApiService.setCorrelationID).toHaveBeenCalledWith(
        'refreshedCorrelationID',
      );
    });

    it('should set expiryTime and issuedTime from response', async () => {
      const now = Date.now();
      const exp = Math.floor(now / 1000) + 1800;
      const iat = Math.floor(now / 1000);

      auth.setJwtToken('existingToken');

      const mockResponse = {
        jwtFrontend: 'refreshedToken',
        correlationID: 'correlationID',
        exp,
        iat,
      };

      (AuthService.refreshAuthToken as Mock).mockResolvedValueOnce(
        mockResponse,
      );

      await auth.getJwtToken();

      expect(auth.expiryTime).toEqual(new Date(exp * 1000));
      expect(auth.issuedTime).toEqual(new Date(iat * 1000));
    });

    it('should throw error if refresh returns no jwtFrontend', async () => {
      auth.setJwtToken('existingToken');

      (AuthService.refreshAuthToken as Mock).mockResolvedValueOnce({
        correlationID: 'correlationID',
      });

      await expect(auth.getJwtToken()).rejects.toThrow('No jwtFrontend');
    });
  });

  describe('_updateActivity', () => {
    it('should update lastActivity to current date', () => {
      const before = new Date();

      auth._updateActivity();

      expect(auth.lastActivity).toBeInstanceOf(Date);
      expect(auth.lastActivity.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });
  });

  describe('_refreshOnActivity', () => {
    it('should call getJwtToken when lastActivity is after issuedTime', async () => {
      const now = Date.now();
      auth.setJwtToken('existingToken');
      auth.issuedTime = new Date(now - 10000);
      auth.lastActivity = new Date(now - 5000);
      auth.expiryTime = new Date(now + 20 * 60 * 1000);

      const getJwtTokenSpy = vi
        .spyOn(auth, 'getJwtToken')
        .mockResolvedValue(undefined);

      await auth._refreshOnActivity();

      expect(getJwtTokenSpy).toHaveBeenCalled();
    });

    it('should not call getJwtToken when lastActivity is before issuedTime', async () => {
      const now = Date.now();
      auth.setJwtToken('existingToken');
      auth.issuedTime = new Date(now - 5000);
      auth.lastActivity = new Date(now - 10000);
      auth.expiryTime = new Date(now + 20 * 60 * 1000);

      const getJwtTokenSpy = vi.spyOn(auth, 'getJwtToken');

      await auth._refreshOnActivity();

      expect(getJwtTokenSpy).not.toHaveBeenCalled();
    });

    it('should schedule next timeout for 10 minutes when token has more than 11 minutes remaining', async () => {
      const now = Date.now();
      auth.setJwtToken('existingToken');
      auth.issuedTime = new Date(now);
      auth.lastActivity = new Date(now - 10000);
      auth.expiryTime = new Date(now + 30 * 60 * 1000);

      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      await auth._refreshOnActivity();

      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        10 * 60 * 1000,
      );
    });

    it('should schedule next timeout for time until 1 min before expiry when less than 10 minutes remaining', async () => {
      const now = Date.now();
      auth.setJwtToken('existingToken');
      auth.issuedTime = new Date(now);
      auth.lastActivity = new Date(now - 10000);
      auth.expiryTime = new Date(now + 5 * 60 * 1000);

      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      await auth._refreshOnActivity();

      const expectedDuration = 4 * 60 * 1000;
      expect(setTimeoutSpy).toHaveBeenCalledWith(
        expect.any(Function),
        expectedDuration,
      );
    });

    it('should call stopKeepAlive when less than 1 minute until expiry', async () => {
      const now = Date.now();
      auth.setJwtToken('existingToken');
      auth.issuedTime = new Date(now);
      auth.lastActivity = new Date(now - 10000);
      auth.expiryTime = new Date(now + 30 * 1000); // 30 seconds from now

      const stopKeepAliveSpy = vi.spyOn(auth, 'stopKeepAlive');

      await auth._refreshOnActivity();

      expect(stopKeepAliveSpy).toHaveBeenCalled();
    });
  });

  describe('keepAlive', () => {
    it('should add event listeners and call _refreshOnActivity', async () => {
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      const refreshOnActivitySpy = vi
        .spyOn(auth, '_refreshOnActivity')
        .mockResolvedValue(undefined);

      await auth.keepAlive();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        auth._updateActivity,
        { passive: true },
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        auth._updateActivity,
        { passive: true },
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        auth._updateActivity,
        { passive: true },
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        auth._updateActivity,
        { passive: true },
      );
      expect(refreshOnActivitySpy).toHaveBeenCalled();
    });
  });

  describe('stopKeepAlive', () => {
    it('should clear timeout and remove event listeners', () => {
      auth.keepAliveTimeoutId = setTimeout(() => {}, 1000);

      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

      auth.stopKeepAlive();

      expect(clearTimeoutSpy).toHaveBeenCalledWith(auth.keepAliveTimeoutId);
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousedown',
        auth._updateActivity,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        auth._updateActivity,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        auth._updateActivity,
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        auth._updateActivity,
      );
    });

    describe('Integration - Full Keep Alive Flow', () => {
      it('should refresh token and reschedule when user is active', async () => {
        const now = Date.now();
        vi.setSystemTime(now);

        // Initial token
        auth.setJwtToken('existingToken');
        auth.issuedTime = new Date(now - 5000);
        auth.expiryTime = new Date(now + 30 * 60 * 1000);

        const mockResponse = {
          jwtFrontend: 'refreshedToken',
          correlationID: 'correlationID',
          exp: Math.floor((now + 30 * 60 * 1000) / 1000),
          iat: Math.floor(now / 1000),
        };

        (AuthService.refreshAuthToken as Mock).mockResolvedValue(mockResponse);

        // Start keep alive
        await auth.keepAlive();

        // Simulate user activity
        document.dispatchEvent(new Event('mousedown'));

        // Fast forward 10 minutes
        await vi.advanceTimersByTimeAsync(10 * 60 * 1000);

        // Token should have been refreshed
        expect(AuthService.refreshAuthToken).toHaveBeenCalled();
      });

      it('should stop refreshing when token expires', async () => {
        const now = Date.now();
        vi.setSystemTime(now);

        auth.setJwtToken('existingToken');
        auth.issuedTime = new Date(now);
        auth.lastActivity = new Date(now - 10000);
        auth.expiryTime = new Date(now + 2 * 60 * 1000); // 2 minutes

        await auth.keepAlive();

        const stopKeepAliveSpy = vi.spyOn(auth, 'stopKeepAlive');

        // Fast forward past expiry
        await vi.advanceTimersByTimeAsync(3 * 60 * 1000);

        expect(stopKeepAliveSpy).toHaveBeenCalled();
      });
    });
  });
});
