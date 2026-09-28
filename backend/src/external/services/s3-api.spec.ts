import { vi, describe, it, expect, beforeEach } from 'vitest';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import path from 'node:path';
import os from 'node:os';
import { APP_ANNOUNCEMENTS_FOLDER } from '../../constants/admin.js';
import { getFile, deleteFiles, upload } from './s3-api.js';
import { Upload } from '@aws-sdk/lib-storage';

vi.mock('../../constants/admin', () => ({
  APP_ANNOUNCEMENTS_FOLDER: 'path/to/announcements',
  S3_BUCKET: 'test-bucket',
  S3_OPTIONS: {
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    },
  },
}));

const mockCreateReadStream = vi.fn();
const mockSend = vi.fn();
const mockPaginateListObjectsV2 = vi.fn();

const mockUploadDone = vi.fn();
vi.mock('@aws-sdk/lib-storage', async () => ({
  Upload: vi.fn(function (config) {
    return { done: () => mockUploadDone(config) };
  }),
}));

const mockAsyncRetry = vi.fn((fn, options) => fn(options));
vi.mock('async-retry', () => ({
  default: (fn, options) => mockAsyncRetry(fn, options),
}));

vi.mock('node:fs', () => ({
  default: {
    createReadStream: vi.fn((...args) => mockCreateReadStream(...args)),
  },
}));

vi.mock('@aws-sdk/client-s3', async () => ({
  S3Client: vi.fn(function () {
    return { send: mockSend };
  }),
  GetObjectCommand: vi.fn(function (input) {
    this.input = input;
  }),
  DeleteObjectsCommand: vi.fn(function (input) {
    this.input = input;
  }),
  PutObjectCommand: vi.fn(function (input) {
    this.input = input;
  }),
  paginateListObjectsV2: (...args) => mockPaginateListObjectsV2(...args),
}));

describe('S3Api', () => {
  const folder = APP_ANNOUNCEMENTS_FOLDER;
  const mockStream = { pipe: vi.fn(), on: vi.fn() };

  beforeEach(() => {
    mockCreateReadStream.mockReturnValue(mockStream);
  });

  describe('getFile', () => {
    it('paginates through all object pages and returns the most recent file extension', async () => {
      mockPaginateListObjectsV2.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield {
            Contents: [
              {
                Key: `${folder}/file-id/page-1.docx`,
                LastModified: new Date('2024-01-01T00:00:00.000Z'),
              },
            ],
          };
          yield {
            Contents: [
              {
                Key: `${folder}/file-id/page-2.pdf`,
                LastModified: new Date('2024-03-01T00:00:00.000Z'),
              },
            ],
          };
          yield {
            Contents: [
              {
                Key: `${folder}/file-id/page-3.txt`,
                LastModified: new Date('2024-02-01T00:00:00.000Z'),
              },
            ],
          };
          yield {
            Contents: undefined,
          };
        },
      });
      mockSend.mockResolvedValue({ Body: {} });

      const result = await getFile(folder, 'file-id');

      expect(result.ext).toBe('.pdf');
      expect(mockPaginateListObjectsV2).toHaveBeenCalledWith(
        { client: expect.any(Object), pageSize: 1000 },
        expect.objectContaining({ Prefix: `${folder}/file-id/` }),
      );
    });

    it('throws when no matching object is found', async () => {
      mockPaginateListObjectsV2.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { Contents: [] };
        },
      });

      await expect(getFile(folder, 'missing-id')).rejects.toThrow(
        'File not found',
      );
    });

    it('propagates the error when fetching the object body fails', async () => {
      mockPaginateListObjectsV2.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield {
            Contents: [
              {
                Key: `${folder}/file-id/page-1.pdf`,
                LastModified: new Date('2024-01-01T00:00:00.000Z'),
              },
            ],
          };
        },
      });
      mockSend.mockRejectedValue(new Error('network error'));

      await expect(getFile(folder, 'file-id')).rejects.toThrow('network error');
    });

    it('keeps the earlier file when two entries share the same LastModified', async () => {
      mockPaginateListObjectsV2.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield {
            Contents: [
              {
                Key: `${folder}/file-id/first.pdf`,
                LastModified: new Date('2024-01-01T00:00:00.000Z'),
              },
              {
                Key: `${folder}/file-id/second.docx`,
                LastModified: new Date('2024-01-01T00:00:00.000Z'),
              },
            ],
          };
        },
      });
      mockSend.mockResolvedValue({ Body: {} });

      const result = await getFile(folder, 'file-id');

      // reduce() only replaces on strict `>`, so a tie keeps the first-seen entry
      expect(result.ext).toBe('.pdf');
    });
  });

  describe('deleteFiles', () => {
    it('removes deleted ids from the result set and preserves failures', async () => {
      const ids = ['id1', 'id2', 'id3', 'id4'];
      const fileId1a = { Key: `${folder}/id1/file1a` };
      const fileId1b = { Key: `${folder}/id1/file1b` };
      const fileId1c = { Key: `${folder}/id1/file1c` };
      const fileId2 = {
        Key: `${folder}/id2/file2`,
        Code: 'NoSuchKey',
      };
      const fileId3 = {
        Key: `${folder}/id3/file3`,
        Code: 'OtherError',
      };

      mockPaginateListObjectsV2.mockImplementation((_config, input) => ({
        async *[Symbol.asyncIterator]() {
          if (input.Prefix.includes('/id1/')) {
            yield { Contents: [fileId1a, fileId1b, fileId1c] };
          } else if (input.Prefix.includes('/id2/')) {
            yield { Contents: [fileId2] };
          } else if (input.Prefix.includes('/id3/')) {
            yield { Contents: [fileId3] };
          } else {
            yield { Contents: [] };
          }
        },
      }));
      mockSend.mockResolvedValueOnce({
        Deleted: [fileId1a, fileId1b, fileId1c],
        Errors: [fileId2, fileId3],
      });

      const result = await deleteFiles(folder, ids);

      expect(result).toEqual(new Set(['id1', 'id2', 'id4']));
    });

    it('returns an empty set when there is an error', async () => {
      mockPaginateListObjectsV2.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { Contents: [{ Key: `${folder}/id1/file1a` }] };
        },
      });
      mockSend.mockRejectedValue(new Error('boom'));

      const result = await deleteFiles(folder, ['id1']);

      expect(result).toEqual(new Set());
    });

    it('returns only ids with no files when a list lookup rejects', async () => {
      const ids = ['id1', 'id2'];

      mockPaginateListObjectsV2.mockImplementation((_config, input) => ({
        async *[Symbol.asyncIterator]() {
          if (input.Prefix.includes('/id1/')) {
            yield { Contents: [] };
          } else if (input.Prefix.includes('/id2/')) {
            throw new Error('list failed');
          }
        },
      }));
      mockSend.mockResolvedValue({ Deleted: [], Errors: [] });

      const result = await deleteFiles(folder, ids);

      expect(result).toEqual(new Set(['id1']));
    });

    it('ignores delete errors with undefined Key and still returns successful ids', async () => {
      const ids = ['id1'];
      const file1 = { Key: `${folder}/id1/file1` };

      mockPaginateListObjectsV2.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { Contents: [file1] };
        },
      });
      mockSend.mockResolvedValue({
        Deleted: [file1],
        Errors: [{ Key: undefined, Code: 'OtherError', Message: 'ignored' }],
      });

      const result = await deleteFiles(folder, ids);

      expect(result).toEqual(new Set(['id1']));
    });

    it('splits deletions into batches of 1000 objects', async () => {
      mockSend.mockClear();
      (
        DeleteObjectsCommand as unknown as { mockClear: () => void }
      ).mockClear();

      const files = Array.from({ length: 1500 }, (_, i) => ({
        Key: `${folder}/id1/file-${i}`,
      }));

      mockPaginateListObjectsV2.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { Contents: files };
        },
      });
      mockSend.mockResolvedValue({ Deleted: [], Errors: [] });

      const result = await deleteFiles(folder, ['id1']);

      expect(DeleteObjectsCommand).toHaveBeenCalledTimes(2);
      expect(mockSend).toHaveBeenCalledTimes(2);
      const calls = (
        DeleteObjectsCommand as unknown as { mock: { calls: any[][] } }
      ).mock.calls;
      expect(calls[0][0].Delete.Objects).toHaveLength(1000);
      expect(calls[1][0].Delete.Objects).toHaveLength(500);
      expect(result).toEqual(new Set(['id1']));
    });

    it('does not issue any delete call when no ids have files', async () => {
      mockSend.mockClear();
      (
        DeleteObjectsCommand as unknown as { mockClear: () => void }
      ).mockClear();

      mockPaginateListObjectsV2.mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield { Contents: [] };
        },
      });

      const result = await deleteFiles(folder, ['id1', 'id2']);

      expect(DeleteObjectsCommand).not.toHaveBeenCalled();
      expect(mockSend).not.toHaveBeenCalled();
      expect(result).toEqual(new Set(['id1', 'id2']));
    });

    it('returns an empty set immediately for an empty ids array', async () => {
      mockSend.mockClear();
      mockPaginateListObjectsV2.mockClear();

      const result = await deleteFiles(folder, []);

      expect(mockPaginateListObjectsV2).not.toHaveBeenCalled();
      expect(mockSend).not.toHaveBeenCalled();
      expect(result).toEqual(new Set());
    });
  });
  describe('upload', () => {
    const mockStream = { pipe: vi.fn(), on: vi.fn() };

    beforeEach(() => {
      mockCreateReadStream.mockReturnValue(mockStream);
    });

    it('should upload a file successfully', async () => {
      const filePath = path.join(os.tmpdir(), 'test.jpg');
      const fileName = 'test.jpg';
      const contentType = 'image/jpeg';
      const folder = 'app';
      const attachmentId = '123';

      mockUploadDone.mockResolvedValue({ ETag: '"abc123"' });

      await upload(filePath, fileName, contentType, folder, attachmentId);

      expect(mockCreateReadStream).toHaveBeenCalledWith(filePath);
      expect(S3Client).toHaveBeenCalled();
      expect(Upload).toHaveBeenCalledWith({
        client: expect.any(Object),
        params: {
          Bucket: expect.any(String),
          Key: expect.stringMatching(
            new RegExp(`^${folder}/${attachmentId}/[a-f0-9-]+\\.jpg$`),
          ),
          Body: mockStream,
          ContentType: contentType,
        },
      });
      expect(mockUploadDone).toHaveBeenCalled();
    });

    it('should use retry logic with 3 retries', async () => {
      const filePath = path.join(os.tmpdir(), 'test.png');
      const fileName = 'test.png';
      const contentType = 'image/png';
      const folder = 'uploads';
      const attachmentId = 'abc-456';

      mockUploadDone.mockResolvedValue({ ETag: '"def456"' });

      await upload(filePath, fileName, contentType, folder, attachmentId);

      expect(mockAsyncRetry).toHaveBeenCalledWith(expect.any(Function), {
        retries: 3,
      });
    });

    it('should extract file extension correctly', async () => {
      const filePath = path.join(os.tmpdir(), 'document.pdf');
      const fileName = 'document.pdf';
      const contentType = 'application/pdf';
      const folder = 'documents';
      const attachmentId = 'doc-789';

      mockUploadDone.mockResolvedValue({ ETag: '"ghi789"' });

      await upload(filePath, fileName, contentType, folder, attachmentId);

      expect(Upload).toHaveBeenCalledWith({
        client: expect.any(Object),
        params: expect.objectContaining({
          Key: expect.stringMatching(/\.pdf$/),
        }),
      });
    });

    it('should handle files without extensions', async () => {
      const filePath = path.join(os.tmpdir(), 'README');
      const fileName = 'README';
      const contentType = 'text/plain';
      const folder = 'docs';
      const attachmentId = 'readme-001';

      mockUploadDone.mockResolvedValue({ ETag: '"jkl012"' });

      await upload(filePath, fileName, contentType, folder, attachmentId);

      expect(Upload).toHaveBeenCalledWith({
        client: expect.any(Object),
        params: expect.objectContaining({
          Key: expect.stringMatching(
            new RegExp(`^${folder}/${attachmentId}/[a-f0-9-]+$`),
          ),
        }),
      });
    });

    it('should retry on upload failure and eventually succeed', async () => {
      const filePath = path.join(os.tmpdir(), 'retry-test.txt');
      const fileName = 'retry-test.txt';
      const contentType = 'text/plain';
      const folder = 'test';
      const attachmentId = 'retry-123';

      let attempts = 0;
      mockUploadDone.mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Network timeout'));
        }
        return Promise.resolve({ ETag: '"success"' });
      });

      mockAsyncRetry.mockImplementation(async (fn, options) => {
        // Simulate retry behavior
        for (let i = 0; i <= options.retries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === options.retries) throw error;
          }
        }
      });

      await upload(filePath, fileName, contentType, folder, attachmentId);

      expect(attempts).toBeGreaterThan(1);
    });

    it('should throw error after max retries exceeded', async () => {
      const filePath = path.join(os.tmpdir(), 'fail-test.txt');
      const fileName = 'fail-test.txt';
      const contentType = 'text/plain';
      const folder = 'test';
      const attachmentId = 'fail-123';

      const uploadError = new Error('S3 service unavailable');
      mockUploadDone.mockRejectedValue(uploadError);

      mockAsyncRetry.mockImplementation(async (fn, options) => {
        // Simulate all retries failing
        for (let i = 0; i <= options.retries; i++) {
          try {
            await fn();
          } catch (error) {
            if (i === options.retries) throw error;
          }
        }
      });

      await expect(
        upload(filePath, fileName, contentType, folder, attachmentId),
      ).rejects.toThrow('S3 service unavailable');
    });

    it('should generate unique keys for multiple uploads', async () => {
      const filePath = path.join(os.tmpdir(), 'test.jpg');
      const fileName = 'test.jpg';
      const contentType = 'image/jpeg';
      const folder = 'app';
      const attachmentId = '123';

      const uploadCalls: string[] = [];
      mockUploadDone.mockImplementation((config) => {
        uploadCalls.push(config.params.Key);
        return Promise.resolve({ ETag: '"abc"' });
      });

      await upload(filePath, fileName, contentType, folder, attachmentId);
      await upload(filePath, fileName, contentType, folder, attachmentId);

      expect(uploadCalls).toHaveLength(2);
      expect(uploadCalls[0]).not.toBe(uploadCalls[1]);
    });
  });
});
