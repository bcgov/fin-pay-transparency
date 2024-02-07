import request from 'supertest';
import * as Config from './config';
const mock_generateReport = jest.fn();
jest.mock('./v1/services/doc-gen-service', () => ({
  generateReport: (...args) => mock_generateReport(...args),
}));

jest.mock('./config');
Config.config.get = (key) => {
  if (key === 'server:apiKey') return 'api-key';
  
  return true
}
import { app } from './app';

describe('app', () => {

  beforeEach(() => {
  })
  describe('globalMiddleWare', () => {
    it('[400] - should fail if correlationId and apiToken is not found', () => {
      return request(app).post('/api').send({}).expect(400);
    });
    it('[401] - should fail api token validation', () => {
      return request(app)
        .post('/api')
        .send({})
        .set('x-correlation-id', '1000')
        .set('x-api-key', 'invalid-api-key')
        .expect(401);
    });

    it('should pass all check and execute route handler', () => {
      return request(app)
        .post('/api/doc-gen')
        .send({})
        .set('x-correlation-id', '1000')
        .set('x-api-key', 'api-key')
        .expect(200);
    });
  });

  describe('health check', () => {
    it('/ [GET]', () => {
      return request(app)
        .get('/')
        .set('x-correlation-id', '1000')
        .set('x-api-key', 'api-key')
        .expect(200);
    });
  });

  it('should handle errors', () => {
    app.get('/api/error', (req, res, next) => {
      const error: any = new Error('Forced error');
      error.status = 500;
      error.stack = 'Stacktrace...';
      return next(error);
    });

    return request(app)
      .get('/api/error')
      .set('x-correlation-id', '1000')
      .set('x-api-key', 'api-key')
      .expect(500);
  });
});
