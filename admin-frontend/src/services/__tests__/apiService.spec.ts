import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementStatus } from '../../types/announcements';
import { EmployerMetrics, IEmployerSearchResult } from '../../types/employers';
import { ReportMetrics } from '../../types/reports';
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

const mockSaveAs = vi.fn();
vi.mock('file-saver', async () => {
  return { saveAs: (...args) => mockSaveAs(...args) };
});

describe('ApiService', () => {
  beforeEach(() => {});

  // Reusable mock helpers
  const mockAxiosError = new AxiosError();

  afterEach(() => {
    vi.restoreAllMocks();
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

  describe('getUsers', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns an array of users', async () => {
        const mockBackendResponse = [{ name: 'test' }];
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.getUsers();
        expect(resp.data).toEqual(mockBackendResponse);
      });
    });
  });

  describe('setAuthHeader', () => {
    it('sets the Authorization header when token is provided', () => {
      ApiService.setAuthHeader('test-token');
      expect(ApiService.apiAxios.defaults.headers.common['Authorization']).toBe(
        'Bearer test-token',
      );
    });
    it('removes the Authorization header when token is not provided', () => {
      ApiService.setAuthHeader(undefined);
      expect(
        ApiService.apiAxios.defaults.headers.common['Authorization'],
      ).toBeUndefined();
    });
  });

  describe('setCorrelationID', () => {
    it('sets the x-correlation-id header when correlationID is provided', () => {
      ApiService.setCorrelationID('test-correlation');
      expect(
        ApiService.apiAxios.defaults.headers.common['x-correlation-id'],
      ).toBe('test-correlation');
    });
    it('removes the x-correlation-id header when correlationID is not provided', () => {
      ApiService.setCorrelationID(undefined);
      expect(
        ApiService.apiAxios.defaults.headers.common['x-correlation-id'],
      ).toBeUndefined();
    });
  });

  describe('getEmployeeCountRanges', () => {
    it('returns employee count ranges', async () => {
      const mockResp = { data: [1, 2, 3] };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(mockResp);
      const resp = await ApiService.getEmployeeCountRanges();
      expect(resp).toEqual([1, 2, 3]);
    });
    it('throws error when API fails', async () => {
      vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
        mockAxiosError,
      );
      await expect(ApiService.getEmployeeCountRanges()).rejects.toEqual(
        mockAxiosError,
      );
    });
  });

  describe('getNaicsCodes', () => {
    it('returns NAICS codes', async () => {
      const mockResp = { data: ['A', 'B'] };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(mockResp);
      const resp = await ApiService.getNaicsCodes();
      expect(resp).toEqual(['A', 'B']);
    });
    it('throws error when API fails', async () => {
      vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
        mockAxiosError,
      );
      await expect(ApiService.getNaicsCodes()).rejects.toEqual(mockAxiosError);
    });
  });

  describe('getReports', () => {
    it('returns report search results', async () => {
      const mockResp = { data: { reports: [], total: 1 } };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(mockResp);
      const resp = await ApiService.getReports();
      expect(resp).toEqual({ reports: [], total: 1 });
    });
    it('throws error when API fails', async () => {
      vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
        mockAxiosError,
      );
      await expect(ApiService.getReports()).rejects.toEqual(mockAxiosError);
    });
  });

  describe('getReportAdminActionHistory', () => {
    it('returns admin action history', async () => {
      const mockResp = { data: [{ action: 'edit' }] };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(mockResp);
      const resp = await ApiService.getReportAdminActionHistory('1');
      expect(resp).toEqual([{ action: 'edit' }]);
    });
    it('throws error when API fails', async () => {
      vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
        mockAxiosError,
      );
      await expect(ApiService.getReportAdminActionHistory('1')).rejects.toEqual(
        mockAxiosError,
      );
    });
  });

  describe('getAnnouncements', () => {
    it('returns announcement search results', async () => {
      const mockResp = { data: { announcements: [], total: 1 } };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(mockResp);
      const resp = await ApiService.getAnnouncements();
      expect(resp).toEqual({ announcements: [], total: 1 });
    });
    it('throws error when API fails', async () => {
      vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
        mockAxiosError,
      );
      await expect(ApiService.getAnnouncements()).rejects.toEqual(
        mockAxiosError,
      );
    });
  });

  describe('addAnnouncement', () => {
    it('returns a promise that resolves when successful', async () => {
      vi.spyOn(ApiService.apiAxios, 'post').mockResolvedValueOnce({
        data: {},
        status: 201,
      });
      await expect(
        ApiService.addAnnouncement({
          title: 'test',
          description: 'test',
          status: 'PUBLISHED',
          active_on: '2021-12-31',
          expires_on: '2021-12-31',
        }),
      ).resolves;
    });
    it('returns a promise that rejects when unsuccessful', async () => {
      vi.spyOn(ApiService.apiAxios, 'post').mockRejectedValueOnce(
        mockAxiosError,
      );
      await expect(
        ApiService.addAnnouncement({
          title: '',
          description: '',
          status: 'DRAFT',
          active_on: '',
          expires_on: '',
        }),
      ).rejects.toEqual(mockAxiosError);
    });
  });

  describe('lockUnlockReport', () => {
    it('returns true when report is unlocked', async () => {
      const mockResp = { data: { is_unlocked: true } };
      vi.spyOn(ApiService.apiAxios, 'patch').mockResolvedValueOnce(mockResp);
      const resp = await ApiService.lockUnlockReport('1', true);
      expect(resp).toBe(true);
    });
    it('returns false when report is locked', async () => {
      const mockResp = { data: { is_unlocked: false } };
      vi.spyOn(ApiService.apiAxios, 'patch').mockResolvedValueOnce(mockResp);
      const resp = await ApiService.lockUnlockReport('1', false);
      expect(resp).toBe(false);
    });
    it('throws error when API fails', async () => {
      vi.spyOn(ApiService.apiAxios, 'patch').mockRejectedValueOnce(
        mockAxiosError,
      );
      await expect(ApiService.lockUnlockReport('1', true)).rejects.toEqual(
        mockAxiosError,
      );
    });
  });

  describe('withdrawReport', () => {
    it('returns response data when successful', async () => {
      const mockResp = { data: { is_withdrawn: true } };
      vi.spyOn(ApiService.apiAxios, 'patch').mockResolvedValueOnce(mockResp);
      const resp = await ApiService.withdrawReport('1');
      expect(resp).toEqual({ is_withdrawn: true });
    });
    it('throws error when API fails', async () => {
      vi.spyOn(ApiService.apiAxios, 'patch').mockRejectedValueOnce(
        mockAxiosError,
      );
      await expect(ApiService.withdrawReport('1')).rejects.toEqual(
        mockAxiosError,
      );
    });
  });

  describe('inviteUser', () => {
    describe('when the data are successfully saved in the backend', () => {
      it('200 - success', async () => {
        const mockBackendResponse = [{ message: 'success' }];
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'post').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.inviteUser({
          firstName: 'test',
          email: 'user@example.com',
          role: 'admin',
        });
        expect(resp!.data).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully saved in the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'post').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(
          ApiService.inviteUser({
            firstName: 'test',
            email: 'test@example.com',
            role: 'admin',
          }),
        ).rejects.toEqual(mockAxiosError);
      });
    });
  });

  describe('getPendingUserInvites', () => {
    it('returns an array of pending user invites', async () => {
      const mockBackendResponse = [{ name: 'test' }];
      const mockAxiosResponse = {
        data: mockBackendResponse,
      };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
        mockAxiosResponse,
      );

      const resp = await ApiService.getPendingUserInvites();
      expect(resp!.data).toEqual(mockBackendResponse);
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        await expect(ApiService.getPendingUserInvites()).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('deleteUserInvite', () => {
    it('200 - success', async () => {
      const mockBackendResponse = [{ message: 'success' }];
      const mockAxiosResponse = {
        data: mockBackendResponse,
      };
      vi.spyOn(ApiService.apiAxios, 'delete').mockResolvedValueOnce(
        mockAxiosResponse,
      );

      const resp = await ApiService.deleteUserInvite('1');
      expect(resp!.data).toEqual(mockBackendResponse);
    });

    describe('when the data are not successfully deleted in the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'delete').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.deleteUserInvite('1')).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('resendUserInvite', () => {
    it('200 - success', async () => {
      const mockBackendResponse = [{ message: 'success' }];
      const mockAxiosResponse = {
        data: mockBackendResponse,
      };
      vi.spyOn(ApiService.apiAxios, 'patch').mockResolvedValueOnce(
        mockAxiosResponse,
      );

      const resp = await ApiService.resendUserInvite('1');
      expect(resp!.data).toEqual(mockBackendResponse);
    });

    describe('when the data are not successfully saved in the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'patch').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.resendUserInvite('1')).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('assignUserRole', () => {
    describe('when the data are successfully saved in the backend', () => {
      it('200 - success', async () => {
        const mockBackendResponse = [{ message: 'success' }];
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'patch').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.assignUserRole('1', 'admin');
        expect(resp!.data).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully saved in the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'patch').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.assignUserRole('1', 'admin')).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('deleteUser', () => {
    describe('when the data are successfully deleted in the backend', () => {
      it('200 - success', async () => {
        const mockBackendResponse = [{ message: 'success' }];
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'delete').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp = await ApiService.deleteUser('1');
        expect(resp!.data).toEqual(mockBackendResponse);
      });
    });

    describe('when the data are not successfully deleted in the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'delete').mockRejectedValueOnce(
          mockAxiosError,
        );

        expect(ApiService.deleteUser('1')).rejects.toEqual(mockAxiosError);
      });
    });
  });

  describe('downloadReportsCsv', () => {
    describe('when valid filter and sort are passed, and the backend returns a valid response', () => {
      it('the browser saves the downloaded file', async () => {
        const filter = [
          { key: 'reporting_year', operation: 'eq', value: 2024 },
        ];
        const sort = [{ company_name: 'asc' }];
        const mockAxiosResp = {
          data: 'A,B,C\na,b,c\n',
          headers: {
            'content-type': 'text/csv',
          },
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResp,
        );

        await ApiService.downloadReportsCsv(filter, sort);
        expect(mockSaveAs).toHaveBeenCalledOnce();
        const savedBlob = mockSaveAs.mock.calls[0][0];
        expect(savedBlob.type).toBe(mockAxiosResp.headers['content-type']);
      });
    });
    describe('when the backend returns an error response', () => {
      it('throws an error', async () => {
        const filter = [
          { key: 'reporting_year', operation: 'eq', value: 2024 },
        ];
        const sort = [{ company_name: 'asc' }];
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValue(
          new Error('Some backend error occurred'),
        );

        await expect(
          ApiService.downloadReportsCsv(filter, sort),
        ).rejects.toThrow();
        expect(mockSaveAs).toHaveBeenCalledTimes(0);
      });
    });
    describe('when the backend returns an invalid response with a success code', () => {
      it('throws an error', async () => {
        const filter = [
          { key: 'reporting_year', operation: 'eq', value: 2024 },
        ];
        const sort = [{ company_name: 'asc' }];
        const mockAxiosResp = {};
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValue(mockAxiosResp);

        await expect(
          ApiService.downloadReportsCsv(filter, sort),
        ).rejects.toThrow();
        expect(mockSaveAs).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('getPdfReportAsBlob', () => {
    describe('when the given report id is valid', () => {
      it('returns a blob', async () => {
        const mockReportId = 1;
        const mockResponse = {
          data: new Blob([], { type: 'application/pdf' }),
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockResponse,
        );

        const resp = await ApiService.getPdfReportAsBlob(mockReportId);
        expect(resp).toEqual(mockResponse.data);
      });
    });
  });

  describe('archiveAnnouncements', () => {
    describe('when the API request to the backend is successful', () => {
      it('returns a promise that eventually resolves', async () => {
        const announcementIdsToDelete = ['1', '2'];
        const mockResponse = {
          data: {},
          status: 201,
        };
        const patchSpy = vi
          .spyOn(ApiService.apiAxios, 'patch')
          .mockResolvedValueOnce(mockResponse);

        await expect(ApiService.archiveAnnouncements(announcementIdsToDelete))
          .resolves;

        const expectedPatchBody = announcementIdsToDelete?.map((id) => {
          return {
            id: id,
            status: 'ARCHIVED',
          };
        });
        expect(patchSpy).toHaveBeenCalledOnce();
        expect(patchSpy.mock.calls[0][1]).toEqual(expectedPatchBody);
      });
    });
    describe('when the API request to the backend is unsuccessful', () => {
      it('returns a promise that eventually rejects', async () => {
        const announcementIdsToDelete = ['1', '2'];
        const mockResponse = {
          data: {},
          status: 400,
        };
        vi.spyOn(ApiService.apiAxios, 'patch').mockResolvedValueOnce(
          mockResponse,
        );

        await expect(
          ApiService.archiveAnnouncements(announcementIdsToDelete),
        ).rejects.toThrow();
      });
    });
  });

  describe('unpublishAnnouncement', () => {
    describe('when the API request to the backend is successful', () => {
      it('returns a promise that eventually resolves', async () => {
        const announcementIdToUnpublish = '234243';
        const mockResponse = {
          data: {},
          status: 201,
        };
        const patchSpy = vi
          .spyOn(ApiService.apiAxios, 'patch')
          .mockResolvedValueOnce(mockResponse);

        await expect(
          ApiService.unpublishAnnouncement(announcementIdToUnpublish),
        ).resolves;

        const expectedPatchBody = [
          {
            id: announcementIdToUnpublish,
            status: AnnouncementStatus.Draft,
          },
        ];
        expect(patchSpy).toHaveBeenCalledOnce();
        expect(patchSpy.mock.calls[0][1]).toEqual(expectedPatchBody);
      });
    });
    describe('when the API request to the backend is unsuccessful', () => {
      it('returns a promise that eventually rejects', async () => {
        const announcementIdToUnpublish = '234243';
        const mockResponse = {
          data: {},
          status: 400,
        };
        vi.spyOn(ApiService.apiAxios, 'patch').mockResolvedValueOnce(
          mockResponse,
        );

        await expect(
          ApiService.unpublishAnnouncement(announcementIdToUnpublish),
        ).rejects.toThrow();
      });
    });
  });

  describe('addAnnouncement', () => {
    describe('when the API request to the backend is successful', () => {
      it('returns a promise that eventually resolves', async () => {
        const payload: any = {
          title: 'test',
          description: 'test',
          status: 'PUBLISHED',
          expires_on: '2021-12-31',
          active_on: '2021-12-31',
          linkUrl: 'https://example.com',
          linkDisplayName: 'example',
          attachment: 'test',
          fileDisplayName: 'test',
          attachmentId: '1',
        };
        const mockResponse = {
          data: {},
          status: 201,
        };
        const putSpy = vi
          .spyOn(ApiService.apiAxios, 'put')
          .mockResolvedValueOnce(mockResponse);

        await expect(ApiService.updateAnnouncement(`1`, payload));

        expect(putSpy).toHaveBeenCalledOnce();
      });
    });
    describe('when the API request to the backend is unsuccessful', () => {
      it('returns a promise that eventually rejects', async () => {
        const payload = {} as any;
        const mockResponse = {
          data: {},
          status: 400,
        };
        vi.spyOn(ApiService.apiAxios, 'put').mockRejectedValueOnce(
          mockResponse,
        );

        await expect(
          ApiService.updateAnnouncement('', payload),
        ).rejects.toThrow();
      });
    });
  });
  describe('updateAnnouncements', () => {
    describe('when the API request to the backend is successful', () => {
      it('returns a promise that eventually resolves', async () => {
        const payload: any = { title: 'test', description: 'test' };
        const mockResponse = {
          data: {},
          status: 201,
        };
        const putSpy = vi
          .spyOn(ApiService.apiAxios, 'put')
          .mockResolvedValueOnce(mockResponse);

        await expect(ApiService.updateAnnouncement(`1`, payload));

        expect(putSpy).toHaveBeenCalledOnce();
      });
    });
    describe('when the API request to the backend is unsuccessful', () => {
      it('returns a promise that eventually rejects', async () => {
        const payload = {} as any;
        const mockResponse = {
          data: {},
          status: 400,
        };
        vi.spyOn(ApiService.apiAxios, 'put').mockRejectedValueOnce(
          mockResponse,
        );

        await expect(
          ApiService.updateAnnouncement('', payload),
        ).rejects.toThrow();
      });
    });
  });

  describe('getAnnouncement', () => {
    it('returns an announcement', async () => {
      const mockBackendResponse = { title: 'test' };
      const mockAxiosResponse = {
        data: mockBackendResponse,
      };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
        mockAxiosResponse,
      );

      const resp = await ApiService.getAnnouncement('1');
      expect(resp).toEqual(mockBackendResponse);
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        await expect(ApiService.getAnnouncement('1')).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('clamavScanFile', () => {
    describe('when the given file is valid', () => {
      it('returns a response', async () => {
        const mockFile = new File([], 'test.pdf');
        const mockResponse = {
          data: { message: 'success' },
        };
        vi.spyOn(ApiService.apiAxios, 'post').mockResolvedValueOnce(
          mockResponse,
        );

        const resp = await ApiService.clamavScanFile(mockFile);
        expect(resp).toEqual(mockResponse.data);
      });
    });
    describe('when the given file is invalid', () => {
      it('throws an error', async () => {
        const mockFile = new File([], 'test.pdf');
        vi.spyOn(ApiService.apiAxios, 'post').mockRejectedValueOnce(
          new Error('Some backend error occurred'),
        );

        await expect(ApiService.clamavScanFile(mockFile)).rejects.toThrow();
      });
    });
  });
  describe('downloadFile', () => {
    describe('when the given file id is valid', () => {
      it('opens pdf in new tab', async () => {
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

        expect(resp.mode).toEqual('open');
      });
      it('download file', async () => {
        const mockFileId = '1';
        const mockResponse = {
          data: new File([], 'test.pdf'),
          headers: {
            'content-disposition': 'attachment; filename="test.jpg"',
          },
        };
        global.URL.createObjectURL = vi.fn().mockReturnValueOnce('test.jpg');
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockResponse,
        );

        const resp = await ApiService.downloadFile(mockFileId);

        expect(resp.mode).toEqual('download');
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

  describe('getReportMetrics', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns a list of metrics by reporting year', async () => {
        const mockBackendResponse = {
          report_metrics: [{ reporting_year: 2024, num_published_reports: 4 }],
        };
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp: ReportMetrics = await ApiService.getReportMetrics();
        expect(resp).toEqual(mockBackendResponse);
      });
    });
  });

  describe('getEmployerMetrics', () => {
    describe('when the data are successfully retrieved from the backend', () => {
      it('returns an object with the expected metrics', async () => {
        const mockBackendResponse = {
          num_employers_logged_on_to_date: 8,
        };
        const mockAxiosResponse = {
          data: mockBackendResponse,
        };
        vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
          mockAxiosResponse,
        );

        const resp: EmployerMetrics = await ApiService.getEmployerMetrics();
        expect(resp).toEqual(mockBackendResponse);
      });
    });
  });

  describe('getAnnouncementsMetrics', () => {
    it('returns an announcement metrics', async () => {
      const mockBackendResponse = {
        draft: { count: 1 },
        published: { count: 2 },
      };
      const mockAxiosResponse = {
        data: mockBackendResponse,
      };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
        mockAxiosResponse,
      );

      const resp = await ApiService.getAnnouncementsMetrics();
      expect(resp).toEqual(mockBackendResponse);
    });

    describe('when the data are not successfully retrieved from the backend', () => {
      it('returns a rejected promise', async () => {
        const mockAxiosError = new AxiosError();
        vi.spyOn(ApiService.apiAxios, 'get').mockRejectedValueOnce(
          mockAxiosError,
        );

        await expect(ApiService.getAnnouncementsMetrics()).rejects.toEqual(
          mockAxiosError,
        );
      });
    });
  });

  describe('getEmployers', () => {
    it('returns search results', async () => {
      const mockBackendResponse: IEmployerSearchResult = {
        limit: 100,
        offset: 0,
        total: 400,
        totalPages: 4,
        employers: [],
      };
      const mockAxiosResponse = {
        data: mockBackendResponse,
      };
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
        mockAxiosResponse,
      );

      const resp: IEmployerSearchResult = await ApiService.getEmployers();
      expect(resp).toEqual(mockBackendResponse);
    });
    it('throws error', async () => {
      const mockAxiosResponse = {};
      vi.spyOn(ApiService.apiAxios, 'get').mockResolvedValueOnce(
        mockAxiosResponse,
      );
      expect(ApiService.getEmployers()).rejects.toThrow();
    });
  });
});
