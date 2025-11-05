import bodyParser from 'body-parser';
import express, { Application } from 'express';
import request from 'supertest';
import docGenRoute from './doc-gen-route';

const mock_generateReport = jest.fn();
jest.mock('../services/doc-gen-service', () => ({
  generateReport: (...args) => mock_generateReport(...args),
}));

let app: Application;

describe('doc-gen-route', () => {
  beforeEach(() => {
    app = express();
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use('/', docGenRoute);
  });

  describe('[POST] - Generate document request received for Correlation ID', () => {
    it('should generate report', () => {
      mock_generateReport.mockImplementation(() => '<p>Report generated</p>');
      return request(app)
        .post('')
        .send({ test: 1234 })
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('x-correlation-id', '100')
        .query({ reportType: 'html' })
        .expect('Content-Type', /html/)
        .expect('x-correlation-id', '100')
        .then((res) => {
          expect(res.text).toContain('<p>Report generated</p>');
          expect(mock_generateReport).toHaveBeenCalledWith(
            'html',
            {
              test: 1234,
            },
            '100',
          );
        });
    });
    it('should catch error and return 500', () => {
      mock_generateReport.mockImplementation(() => {
        throw new Error('Test error');
      });
      return request(app)
        .post('')
        .send({ test: 1234 })
        .set('content-type', 'application/json')
        .set('accept', 'application/json')
        .set('x-correlation-id', '100')
        .expect(500);
    });
  });
});
