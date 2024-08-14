import { getEmbedInfo, PowerBiResource } from './analytic-service';

const mockGetEmbedParamsForReports = jest.fn();
jest.mock('../../external/services/powerbi-service', () => {
  return {
    PowerBiService: jest.fn().mockImplementation(() => {
      return {
        getEmbedParamsForReports: mockGetEmbedParamsForReports,
      };
    }),
  };
});

describe('getEmbedInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return json', async () => {
    const output = {
      id: 123,
      accessToken: 'asdf-asdf',
      embedUrl: 'foo.bar.ca',
      expiry: '2024',
    };
    mockGetEmbedParamsForReports.mockResolvedValue({
      resources: [{ id: output.id, embedUrl: output.embedUrl }],
      embedToken: { token: output.accessToken, expiration: output.expiry },
    });
    let json = await getEmbedInfo(PowerBiResource.SubmissionAnalytics);
    json = await getEmbedInfo(PowerBiResource.DataAnalytics);
    json = await getEmbedInfo(PowerBiResource.UserBehaviour);
    expect(mockGetEmbedParamsForReports).toHaveBeenCalledTimes(3);
    expect(json).toMatchObject(output);
  });
});
