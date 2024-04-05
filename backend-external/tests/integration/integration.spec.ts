import { agent } from 'supertest';
import { config } from '../../src/config';

const request = agent(config.get('server:baseURL'));

describe('/ GET', () => {
  it('the service should be running', () => {
    request.get('').expect(200);
  });
});

describe('/v1/docs/ GET', () => {
  it('the service should be running', () => {
    request.get('/v1/docs/').expect(200);
  });
});

describe('/v1/pay-transparency/ GET', () => {
  it('returns error if secret key is not set', () => {
    request.get('/v1/pay-transparency').expect(400);
  });
  it('returns error if secret key is wrong', () => {
    request
      .get('/v1/pay-transparency')
      .set('x-api-key', 'wrong_key')
      .expect(401);
  });
  it('returns data if secret key is provided', () => {
    //note: this test requires both backend-external and backend to be running.
    request
      .get('/v1/pay-transparency')
      .set('x-api-key', config.get('server:apiKey'))
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveProperty('totalRecords');
      });
  });
});
