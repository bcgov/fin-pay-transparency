import express, { Application } from 'express';
import request from 'supertest';
import { router } from './config-routes';

let app: Application;

const mockConfigGet = jest.fn();

jest.mock('../../config/config', () => ({
  config: {
    get: (key) => mockConfigGet(key),
  },
}));

describe('config-routes', () => {
  beforeEach(() => {
    app = express();
    app.set('query parser', 'extended');
    app.use('/config', router);
  });

  it('should setup the route', () => {
    return request(app).get('/config').expect(200);
  });
  it('should correct config values', () => {
    mockConfigGet.mockReturnValue(800000);

    return request(app)
      .get('/config')
      .expect(({ body }) => {
        expect(body.deleteAnnouncementsDurationInDays).not.toBeNull();
        expect(body.maxUploadFileSize).not.toBeNull();
        expect(body.reportEditDurationInDays).not.toBeNull();
        expect(body.reportingYearOptions.length).toBeGreaterThanOrEqual(1);
      });
  });
});
