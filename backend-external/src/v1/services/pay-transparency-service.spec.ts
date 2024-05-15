import { payTransparencyService } from './pay-transparency-service';

const mockGet = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../utils', () => ({
  utils: {
    backendAxios: () => ({
      get: (...args) => mockGet(...args),
      delete: (...args) => mockDelete(...args),
    }),
  },
}));

describe('pay-transparency-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('getPayTransparencyData', () => {
    it('should forward to request  to the backend api', async () => {
      mockGet.mockReturnValue({});
      await payTransparencyService.getPayTransparencyData(
        'start',
        'end',
        0,
        1000,
      );
      expect(mockGet).toHaveBeenCalledWith('/external-consumer-api/v1/reports', {
        params: {
          startDate: 'start',
          endDate: 'end',
          offset: 0,
          limit: 1000,
        },
      });
    });
  });

  describe('deleteReports', () => {
    it('should delete reports', async () => {
      mockDelete.mockReturnValue({});
      await payTransparencyService.deleteReports({
        params: { companyId: '1234567890' },
      } as any);

      expect(mockDelete).toHaveBeenCalledWith(
        '/external-consumer-api/v1/reports',
        {
          params: { companyId: '1234567890' },
          headers: {
            'x-api-key': 'api-key',
          },
        },
      );
    });
  });
});
