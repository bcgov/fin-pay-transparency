import { AxiosError } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncementStatus } from '../../types/announcements';
import ApiService from '../apiService';
import { de } from '@faker-js/faker';

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

const originalWindow = {...window}

describe('ApiService', () => {
  beforeEach(() => {});

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

  describe('deleteAnnouncements', () => {
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

        await expect(ApiService.deleteAnnouncements(announcementIdsToDelete))
          .resolves;

        const expectedPatchBody = announcementIdsToDelete?.map((id) => {
          return {
            id: id,
            status: 'DELETED',
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
          ApiService.deleteAnnouncements(announcementIdsToDelete),
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
          describe: 'test',
          status: 'PUBLISHED',
          expires_on: '2021-12-31',
          published_on: '2021-12-31',
          linkUrl: 'https://example.com',
          linkDisplayName: 'example',
          attachment: 'test',
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
        const payload: any = { title: 'test' };
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
          }
        };
        global.URL.createObjectURL = vi.fn().mockReturnValueOnce("test.pdf");
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
          }
        };
        global.URL.createObjectURL = vi.fn().mockReturnValueOnce("test.jpg");
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

        await expect(
          ApiService.downloadFile(mockFileId),
        ).rejects.toThrow();
      });
    });
  });
});
