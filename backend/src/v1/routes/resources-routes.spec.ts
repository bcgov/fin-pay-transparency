import { vi, describe, it, expect, beforeEach } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import resourcesRouter from './resources-routes.js';

const mockGetAnnouncementResource = vi.fn();
vi.mock('../services/announcements-service', () => ({
  announcementService: {
    getAnnouncementResource: (...args: any[]) =>
      mockGetAnnouncementResource(...args),
  },
}));

describe('resources-routes', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/resources', resourcesRouter);
  });

  describe('GET /resources/:fileId', () => {
    it('should set download headers and pipe the stream to the response', async () => {
      const mockStream = {
        pipe: vi.fn((target: any) => {
          target.end('test-stream');
          return target;
        }),
        on: vi.fn(),
      };

      mockGetAnnouncementResource.mockResolvedValue({
        filename: 'test-file.pdf',
        contentLength: '11',
        data: mockStream,
      });

      const fileId = 'fileId';
      const res = await request(app).get(`/resources/${fileId}`);

      expect(mockGetAnnouncementResource).toHaveBeenCalledWith(fileId);
      expect(res.status).toBe(200);
      expect(mockStream.pipe).toHaveBeenCalled();
      expect(res.headers['content-disposition']).toContain(
        'filename=test-file.pdf',
      );
      expect(res.headers['content-type']).toBe('application/octet-stream');
      expect(res.headers['content-length']).toBe('11');
    });

    it('should return 400 for error service', async () => {
      mockGetAnnouncementResource.mockRejectedValue(new Error('Service error'));

      const fileId = 'fileId';
      const res = await request(app).get(`/resources/${fileId}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: 'Could not send file.' });
    });

    it('should return 400 for error during pipe', async () => {
      const mockStream = {
        pipe: vi.fn(),
        on: vi.fn((status, listener) => listener()),
      };

      mockGetAnnouncementResource.mockResolvedValue({
        filename: 'test-file.pdf',
        contentLength: '11',
        data: mockStream,
      });

      const fileId = 'fileId';
      const res = await request(app).get(`/resources/${fileId}`);
      expect(res.status).toBe(500);
    });
  });
});
