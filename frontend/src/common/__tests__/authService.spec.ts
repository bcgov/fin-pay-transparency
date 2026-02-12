// Import the necessary modules
import authService from '../authService.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import { mock } from 'node:test';

vi.mock('axios', async () => {
  const actual: any = await vi.importActual('axios');
  return {
    ...actual,
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
});

describe('Auth Service', () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('getAuthToken', () => {
    // check for valid scenario , that api returns token
    it('should return token if api respond is OK.', async () => {
      vi.spyOn(axios, 'get').mockResolvedValueOnce({
        data: {
          jwtFrontend: 'testToken',
          correlationID: 'testCorrelationID',
        },
      });
      const data = await authService.getAuthToken();
      expect(data.jwtFrontend).toBe('testToken');
      expect(data.correlationID).toBe('testCorrelationID');
    });
    it('should reject if api respond is unauthorized.', async () => {
      const mockAxiosError = new AxiosError();
      vi.spyOn(axios, 'get').mockRejectedValueOnce(mockAxiosError);

      expect(authService.getAuthToken()).rejects.toEqual(mockAxiosError);
    });
  });
  describe('refreshAuthToken', () => {
    // check for valid scenario , that api returns token
    it('should return token if api respond is OK.', async () => {
      const mockData = {
        jwtFrontend: '0.eyJpYXQiOjE1MTYyMzkwMjIsImVhdCI6MTUxODAzOTAyMn0.0',
        correlationID: 'testCorrelationID',
      };
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: mockData,
      });
      const data = await authService.refreshAuthToken(
        'testToken',
        'testCorrelationID',
      );
      const expectedData = {
        ...mockData,
        eat: 1518039022,
        iat: 1516239022,
      };
      expect(data).toEqual(expectedData);
    });
    it('should return error if api respond contains error.', async () => {
      vi.spyOn(axios, 'post').mockResolvedValueOnce({
        data: {
          error: 'failed to refresh token',
          error_description: 'refresh token expired.',
        },
      });
      const data = await authService.refreshAuthToken(
        'testToken',
        'testCorrelationID',
      );
      expect(data.error).toBe('refresh token expired.');
    });
    it('should reject if api respond is unauthorized.', async () => {
      const mockAxiosError = new AxiosError();
      vi.spyOn(axios, 'post').mockRejectedValueOnce(mockAxiosError);

      expect(authService.refreshAuthToken()).rejects.toEqual(mockAxiosError);
    });
  });
});
