import {
  getEmbedInfo,
  PowerBiEmbedInfo,
  PowerBiResourceName,
} from './analytic-service';

const mockGetEmbedParamsForReports = jest.fn();
jest.mock('../../external/services/powerbi-service', () => {
  const actual = jest.requireActual('../../external/services/powerbi-service');
  return {
    ...actual,
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
    const output: PowerBiEmbedInfo = {
      resources: [
        {
          name: PowerBiResourceName.SubmissionAnalytics,
          id: '123',
          embedUrl: 'foo.bar.ca',
        },
        {
          name: PowerBiResourceName.DataAnalytics,
          id: '123',
          embedUrl: 'foo.bar.ca',
        },
      ],
      accessToken: 'asdf-asdf',
      expiry: '2024',
    };

    mockGetEmbedParamsForReports.mockResolvedValue({
      resources: [
        { id: output.resources[0].id, embedUrl: output.resources[0].embedUrl },
        { id: output.resources[1].id, embedUrl: output.resources[1].embedUrl },
      ],
      embedToken: { token: output.accessToken, expiration: output.expiry },
    });
    const json = await getEmbedInfo([
      PowerBiResourceName.SubmissionAnalytics,
      PowerBiResourceName.DataAnalytics,
    ]);
    expect(mockGetEmbedParamsForReports).toHaveBeenCalledTimes(1);
    expect(json).toMatchObject(output);
  });
});
