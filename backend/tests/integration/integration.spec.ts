import {
  analyticsService,
  PowerBiResourceName,
} from '../../src/v1/services/analytic-service';

// Integration tests to verify that the powerbi report
// can be fetched successfully in each environment.
describe('/ GET', () => {
  it('should return 200 OK', async () => {
    const info = await analyticsService.getEmbedInfo([
      PowerBiResourceName.Analytics,
    ]);
    expect(info).toHaveProperty('accessToken');
    expect(info).toHaveProperty('expiry');
    expect(info).toHaveProperty('resources');
    expect(Array.isArray(info.resources)).toBe(true);
    info.resources.forEach((resource) => {
      expect(resource).toHaveProperty('id');
      expect(resource).toHaveProperty('embedUrl');
    });
  });
});
