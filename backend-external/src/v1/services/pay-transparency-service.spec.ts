import { payTransparencyService } from './pay-transparency-service';

const mockGet = jest.fn();

jest.mock('../../utils', () => ({
  utils: {
    backendAxios: () => ({
      get: (...args) => mockGet(...args),
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
      expect(mockGet).toHaveBeenCalledWith('/external-consumer-api/v1/', {
        params: {
          startDate: 'start',
          endDate: 'end',
          offset: 0,
          limit: 1000,
        },
      });
    });
  });
});
