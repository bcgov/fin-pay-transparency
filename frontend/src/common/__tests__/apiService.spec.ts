import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ApiService from '../apiService';

//Mock the interceptor used by the ApiService so it no longer depends on
//HTTP calls to the backend.
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

describe('ApiService', () => {
  beforeEach(() => {});

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getEmployeeCountRanges', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns a list of objects in the expected format', async () => {
        // Internally getEmployeeCountRanges() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = [
          {
            employee_count_range_id: 'ea8b2547-4e93-4bfa-aec1-3e90f91027dd',
            employee_count_range: '1-99',
          },
          {
            employee_count_range_id: 'c7e1c454-7db9-46c6-b250-1567a543d22f',
            employee_count_range: '100-499',
          },
          {
            employee_count_range_id: '5f26cc90-7960-4e14-9700-87ecd75f0a0f',
            employee_count_range: '500+',
          },
        ];
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.getEmployeeCountRanges();

        // Expect getEmployeeCountRanges() to return the exact response that it
        // received from the backend
        expect(resp).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        // Simulate an HTTP error response when getEmployeeCountRanges() tries to
        // fetch data from the backend
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.getEmployeeCountRanges()).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('getNaicsCodes', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns a list of objects in the expected format', async () => {
        // Internally getNaicsCodes() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = [
          {
            naics_code: '1',
            naics_label: 'test1',
          },
          {
            naics_code: '2',
            naics_label: 'test2',
          },
          {
            naics_code: '3',
            naics_label: 'test3',
          },
        ];
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.getNaicsCodes();

        // Expect getNaicsCodes() to return the exact response that it
        // received from the backend
        expect(resp).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        // Simulate an HTTP error response when getNaicsCodes() tries to
        // fetch data from the backend
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.getNaicsCodes()).rejects.toEqual(mockAxiosError);
      });
    });
  });
});
