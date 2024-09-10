import { DateTimeFormatter, ZonedDateTime, nativeJs } from '@js-joda/core';
import { AxiosError } from 'axios';
import { saveAs } from 'file-saver';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementStatus } from '../../types/announcements';
import { REPORT_STATUS } from '../../utils/constant';
import ApiService, { ApiServicePrivate } from '../apiService';

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

  describe('getReports', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns a list of objects in the expected format', async () => {
        // Internally getReportsByStatus() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = [
          {
            report_id: '32655fd3-22b7-4b9a-86de-2bfc0fcf9102',
            report_start_date: new Date(),
            report_end_date: new Date(),
            create_date: new Date(),
            update_date: new Date(),
            revision: 1,
          },
          {
            report_id: '0cf3a2dd-4fa2-450e-a291-e9b44940e5ec',
            report_start_date: new Date(),
            report_end_date: new Date(),
            create_date: new Date(),
            update_date: new Date(),
            revision: 4,
          },
        ];
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.getReports({
          report_status: REPORT_STATUS.DRAFT,
        });

        // Expect getReports() to return the exact response that it
        // received from the backend
        expect(resp).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        // Simulate an HTTP error response when getReports() tries to
        // fetch data from the backend
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(
          ApiService.getReports({ report_status: REPORT_STATUS.PUBLISHED }),
        ).rejects.toEqual(mockAxiosError);
      });
    });
  });

  describe('getReport', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns a list of objects in the expected format', async () => {
        // Internally getReport() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = {
          report_id: '32655fd3-22b7-4b9a-86de-2bfc0fcf9102',
          report_start_date: new Date(),
          report_end_date: new Date(),
          create_date: new Date(),
          update_date: new Date(),
          revision: 1,
        };
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.getReport(REPORT_STATUS.DRAFT);

        // Expect getReport() to return the exact response that it
        // received from the backend
        expect(resp).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        // Simulate an HTTP error response when getReport() tries to
        // fetch data from the backend
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.getReport('invalid_guid')).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });
  describe('getConfig', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns configuration', async () => {
        // Internally getReport() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = { maxUploadFileSize: 8000000 };
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.getConfig();
        expect(resp).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        // Simulate an HTTP error response when getReport() tries to
        // fetch data from the backend
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.getConfig()).rejects.toEqual(mockAxiosError);
      });
    });
  });
  describe('getUserInfo', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns configuration', async () => {
        // Internally getReport() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = { name: 'test' };
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.getUserInfo();
        expect(resp.data).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        // Simulate an HTTP error response when getReport() tries to
        // fetch data from the backend
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.getUserInfo()).rejects.toEqual(mockAxiosError);
      });
    });
  });

  describe('getHtmlReport', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns a list of objects in the expected format', async () => {
        // Internally getHtmlReport() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = '<html></html';
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.getHtmlReport(REPORT_STATUS.DRAFT);

        // Expect getHtmlReport() to return the exact response that it
        // received from the backend
        expect(resp).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        // Simulate an HTTP error response when getHtmlReport() tries to
        // fetch data from the backend
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.getHtmlReport('invalid_guid')).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('getPdfReport', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('saves the pdf', async () => {
        // Internally getPdfReport() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = 'test';
        const mockAxiosResponse = {
          headers: {
            'content-disposition':
              'application/pdf;filename=pay_transparency_report_2023-01_2024-01.pdf',
          },
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );
        const spySaveAs = vi
          .spyOn(saveAs, 'saveAs')
          .mockImplementation(() => 0);

        await ApiService.getPdfReport(REPORT_STATUS.DRAFT);

        // Expect
        expect(spySaveAs).toBeCalledWith(
          mockAxiosResponse.data,
          'pay_transparency_report_2023-01_2024-01.pdf',
          { type: 'application/pdf' },
        );
      });

      it('without a filename, it still saves the pdf', async () => {
        // Internally getPdfReport() makes an API call to the backend.
        // Mock the call and its response to remove dependency of this test
        // on a remote service.
        const mockBackendResponse = 'test';
        const mockAxiosResponse = {
          headers: {},
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );
        const spySaveAs = vi
          .spyOn(saveAs, 'saveAs')
          .mockImplementation(() => 0);

        await ApiService.getPdfReport(REPORT_STATUS.DRAFT);

        // Expect
        expect(spySaveAs).toBeCalledWith(
          mockAxiosResponse.data,
          'pay_transparency_report.pdf',
          { type: 'application/pdf' },
        );
      });
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        // Simulate an HTTP error response when getPdfReport() tries to
        // fetch data from the backend
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.getPdfReport('invalid_guid')).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('publishReport', () => {
    describe('when the operation is successful', () => {
      it('returns the expected response', async () => {
        const mockAxiosResp = { data: '<html></html>' };
        const mockReportId = '1';
        vi.spyOn(ApiService.apiAxios, 'put').mockResolvedValue(mockAxiosResp);
        const resp = await ApiService.publishReport(mockReportId);
        expect(resp).toEqual(mockAxiosResp.data);
      });
    });
    describe('when the operation is not successful', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        const mockReportId = '1';
        vi.spyOn(ApiService.apiAxios, 'put').mockRejectedValueOnce(
          mockAxiosError,
        );
        expect(ApiService.publishReport(mockReportId)).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('getAnnouncements', () => {
    describe('when data are successfully retrieved from the backend', () => {
      it('returns a list of objects in the expected format', async () => {
        const mockBackendResponse = {
          items: [
            {
              announcement_id: '1',
              title: 'mock announcement 1',
              description: 'desc 1',
            },
            {
              announcement_id: '2',
              title: 'mock announcement 2',
              description: 'desc 2',
            },
          ],
        };
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        const axiosGetSpy = vi
          .spyOn(ApiService.apiAxios, 'get')
          .mockResolvedValueOnce(mockAxiosResponse);
        const offset = 1;
        const limit = 2;
        const filter = [];
        const sort = [];
        const resp = await ApiService.getAnnouncements(
          offset,
          limit,
          filter,
          sort,
        );
        const queryParamsToBackend: any = axiosGetSpy.mock.calls[0][1];
        expect(queryParamsToBackend.params.sort).toBe(sort);
        expect(queryParamsToBackend.params.filters).toBe(filter);
        expect(queryParamsToBackend.params.offset).toBe(offset);
        expect(queryParamsToBackend.params.limit).toBe(limit);
        expect(resp).toEqual(mockBackendResponse);
      });
    });
    describe('when data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );
        expect(ApiService.getAnnouncements(1, 2, [], [])).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('getPublishedAnnouncements', () => {
    it('request filters by status, active_on and expired_on', async () => {
      const mockTimeNow = '1234';
      const dateSpy = vi
        .spyOn(ApiServicePrivate, 'dateToApiDateTimeString')
        .mockReturnValue(mockTimeNow);
      const getAnnouncementsSpy = vi
        .spyOn(ApiService, 'getAnnouncements')
        .mockResolvedValue({ items: [], total: 0 });
      await ApiService.getPublishedAnnouncements();

      const filter = getAnnouncementsSpy.mock.calls[0][2];
      const statusFilter = filter?.filter((f) => f.key == 'status');
      const activeOnFilter: any = filter?.filter(
        (f) => f.key == 'active_on',
      )[0];
      const expiresOnFilter: any = filter?.filter(
        (f) => f.key == 'expires_on',
      )[0];
      expect(dateSpy).toHaveBeenCalled();
      expect(statusFilter).toStrictEqual([
        {
          key: 'status',
          operation: 'in',
          value: [AnnouncementStatus.Published],
        },
      ]);
      expect(activeOnFilter).toStrictEqual({
        key: 'active_on',
        operation: 'lte',
        value: mockTimeNow,
      });
      expect(expiresOnFilter).toStrictEqual({
        key: 'expires_on',
        operation: 'gt',
        value: mockTimeNow,
      });
    });
  });

  describe('downloadFile', () => {
    describe('when the given file id is valid', () => {
      it('returns a blob', async () => {
        const mockFileId = '1';
        const mockResponse = {
          data: new File([], 'test.pdf'),
          headers: {
            'content-disposition': 'attachment; filename="test.pdf"',
          },
        };
        global.URL.createObjectURL = vi.fn().mockReturnValueOnce('test.pdf');
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockResponse,
        );

        const resp = await ApiService.downloadFile(mockFileId);
        expect(resp).toEqual('test.pdf');
      });
    });
    describe('when the given file id is invalid', () => {
      it('throws an error', async () => {
        const mockFileId = '1';
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          new Error('Some backend error occurred'),
        );

        await expect(ApiService.downloadFile(mockFileId)).rejects.toThrow();
      });
    });
  });
});

describe('ApiServicePrivate', () => {
  describe('dateToApiDateTimeString', () => {
    it('converts the given date object into a date time string in the format expected by the API', () => {
      const date = new Date(
        2019, //year
        0, //month (0=January)
        1, //day
        0, //hour
        0, //minute
        0, //seconds
        0, //ms
      );

      const result = ApiServicePrivate.dateToApiDateTimeString(date);

      //expect the result to be an ISO 8601 datetime string in the local timezone
      //(with timezone offset included).  For example: '2011-12-03T10:15:30+01:00'
      const expected = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(
        ZonedDateTime.from(nativeJs(date)),
      );

      expect(result).toBe(expected);
    });
  });
});
