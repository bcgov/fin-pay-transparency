import {
  analyticsService,
  PowerBiEmbedInfo,
  PowerBiResourceName,
} from './analytic-service.js';

const mockgetEmbedParamsForReportsByName = jest.fn();
jest.mock('../../external/services/powerbi-service', () => {
  const actual = jest.requireActual('../../external/services/powerbi-service');
  return {
    ...actual,
    PowerBiService: jest.fn().mockImplementation(() => {
      return {
        getEmbedParamsForReportsByName: mockgetEmbedParamsForReportsByName,
      };
    }),
  };
});

describe('getEmbedInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return json when given multiple resources to embed', async () => {
    const output: PowerBiEmbedInfo = {
      resources: [
        {
          name: PowerBiResourceName.Analytics,
          id: '123',
          embedUrl: 'foo.bar.ca',
        },
        {
          name: PowerBiResourceName.Analytics,
          id: '123',
          embedUrl: 'foo.bar.ca',
        },
      ],
      accessToken: 'asdf-asdf',
      expiry: '2024',
    };

    mockgetEmbedParamsForReportsByName.mockResolvedValue({
      resources: [
        { id: output.resources[0].id, embedUrl: output.resources[0].embedUrl },
        { id: output.resources[1].id, embedUrl: output.resources[1].embedUrl },
      ],
      embedToken: { token: output.accessToken, expiration: output.expiry },
    });
    const json = await analyticsService.getEmbedInfo([
      PowerBiResourceName.Analytics,
      PowerBiResourceName.Analytics,
    ]);
    expect(mockgetEmbedParamsForReportsByName).toHaveBeenCalledTimes(1);
    expect(json).toMatchObject(output);
  });

  it('should throw error if invalid resource names', async () => {
    await expect(
      analyticsService.getEmbedInfo([
        PowerBiResourceName.Analytics,
        'invalid' as never,
      ]),
    ).rejects.toThrow('Invalid resource names');
    expect(mockgetEmbedParamsForReportsByName).not.toHaveBeenCalled();
  });
});
