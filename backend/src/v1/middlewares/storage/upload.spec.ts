import { vi, describe, it, expect } from 'vitest';
import { useUpload } from './upload.js';
import path from 'node:path';
import os from 'node:os';

const mockS3ApiUpload = vi.fn();
vi.mock('../../../external/services/s3-api', () => ({
  upload: (...args) => mockS3ApiUpload(...args),
}));

const realpathSyncMock = vi.fn();
vi.mock('node:fs', () => ({
  default: {
    realpathSync: (...args) => realpathSyncMock(...args),
  },
}));

describe('upload', () => {
  it('should upload a file', async () => {
    const req = {
      body: {
        attachmentId: '123',
        file: {
          path: path.join(os.tmpdir(), 'test.jpg'),
          name: 'test.jpg',
          size: 100,
          type: 'image/jpeg',
        },
      },
    };

    realpathSyncMock.mockReturnValue(path.join(os.tmpdir(), 'test.jpg'));

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    mockS3ApiUpload.mockResolvedValue(undefined);

    await useUpload({ folder: 'app' })(req, res, next);

    expect(mockS3ApiUpload).toHaveBeenCalledWith(
      path.join(os.tmpdir(), 'test.jpg'),
      'test.jpg',
      'image/jpeg',
      'app',
      '123',
    );
    expect(next).toHaveBeenCalled();
  });

  it('should not upload a file when file is missing', async () => {
    const req = {
      body: {},
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    mockS3ApiUpload.mockResolvedValue(undefined);

    await useUpload({ folder: 'app' })(req, res, next);

    expect(mockS3ApiUpload).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('should not upload a file when attachmentId is missing', async () => {
    const req = {
      body: {
        file: {
          path: path.join(os.tmpdir(), 'test.jpg'),
          name: 'test.jpg',
          size: 100,
          type: 'image/jpeg',
        },
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();

    mockS3ApiUpload.mockResolvedValue(undefined);

    await useUpload({ folder: 'app' })(req, res, next);

    expect(mockS3ApiUpload).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  describe('file not uploaded to temp directory', () => {
    it('should return 400', async () => {
      const req = {
        body: {
          attachmentId: '123',
          file: {
            path: '/invalid/test.jpg',
          },
        },
      };

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await useUpload({ folder: 'app' })(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid request' });
    });
  });

  describe('file path resolves outside temp directory', () => {
    it('should return 403', async () => {
      const req = {
        body: {
          attachmentId: '123',
          file: {
            path: path.join(os.tmpdir(), 'test.jpg'),
            name: 'test.jpg',
            size: 100,
            type: 'image/jpeg',
          },
        },
      };

      realpathSyncMock.mockReturnValue('/malicious/path/test.jpg');

      const res = {
        statusCode: 0,
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        end: vi.fn(),
      };

      const next = vi.fn();

      await useUpload({ folder: 'app' })(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.end).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  it('should handle upload error', async () => {
    const req = {
      body: {
        attachmentId: '123',
        file: {
          path: path.join(os.tmpdir(), 'test.jpg'),
          name: 'test.jpg',
          size: 100,
          type: 'image/jpeg',
        },
      },
    };

    realpathSyncMock.mockReturnValue(path.join(os.tmpdir(), 'test.jpg'));

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    const next = vi.fn();
    const uploadError = new Error('S3 upload failed');

    mockS3ApiUpload.mockRejectedValue(uploadError);

    await useUpload({ folder: 'app' })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Invalid request',
      error: uploadError,
    });
    expect(next).not.toHaveBeenCalled();
  });
});
