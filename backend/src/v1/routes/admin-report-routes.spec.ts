import express, { Application } from 'express';
import router from './admin-report-routes';
import request from 'supertest';

const mockSearchReport = jest.fn();
jest.mock('../services/report-search-service', () => ({
  reportSearchService: {
    searchReport: (...args) => mockSearchReport(...args),
  },
}));

let app: Application;
describe('admin-report-routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(router);
  });

  it('should default offset=0 and limit=20', async () => {
    await request(app).get('').expect(200);
    expect(mockSearchReport).toHaveBeenCalledWith(
        0,
        20,
        undefined,
        undefined
    )
  });
  
  it('should resolve query params', async () => {
    await request(app).get('')
    .query({offset: 1, limit: 50, filter: 'naics_code=11', sort: 'field=naics_code,direction=asc'}).expect(200);
    expect(mockSearchReport).toHaveBeenCalledWith(
      1,
      50,
      'field=naics_code,direction=asc',
      'naics_code=11',
    );
  });
});
