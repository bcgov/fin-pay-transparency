import { faker } from '@faker-js/faker';
import { downloadFile, deleteFiles, upload } from './s3-api';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { APP_ANNOUNCEMENTS_FOLDER } from '../../constants/admin';
import path from 'node:path';
import os from 'node:os';

const mockFindFirstOrThrow = jest.fn();
jest.mock('../../v1/prisma/prisma-client', () => ({
  __esModule: true,
  default: {
    announcement_resource: {
      findFirstOrThrow: () => mockFindFirstOrThrow(),
    },
  },
}));

const mockStreamWrite = jest.fn();
const mockCreateReadStream = jest.fn();

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  createWriteStream: () => ({
    write: (...args) => mockStreamWrite(...args),
  }),
  createReadStream: (...args) => mockCreateReadStream(...args),
  unlink: jest.fn(),
}));

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  ...jest.requireActual('@aws-sdk/client-s3'),
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
}));

const mockUploadDone = jest.fn();
jest.mock('@aws-sdk/lib-storage', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    done: mockUploadDone,
  })),
}));

const mockAsyncRetry = jest.fn((fn, options) => fn());
jest.mock('async-retry', () => ({
  __esModule: true,
  default: async (fn, options) => mockAsyncRetry(fn, options),
}));

describe('S3Api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadFile', () => {
    it('should download a file', async () => {
      mockFindFirstOrThrow.mockResolvedValue({
        attachment_file_id: faker.string.uuid(),
        display_name: faker.lorem.word(),
      });

      mockSend.mockImplementation((...args) => {
        const [command] = args;
        if (command instanceof GetObjectCommand) {
          return {
            Body: {
              transformToByteArray: jest
                .fn()
                .mockResolvedValue(faker.lorem.words(10)),
            },
          };
        }

        if (command instanceof ListObjectsCommand) {
          return {
            Contents: [
              {
                Key: faker.system.filePath(),
                LastModified: faker.date.recent(),
              },
              {
                Key: faker.system.filePath(),
                LastModified: faker.date.recent(),
              },
            ],
          };
        }
      });

      mockStreamWrite.mockImplementation((data, cb) => {
        cb();
      });

      // Arrange
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        download: jest.fn().mockImplementation((...args) => {
          const [tempFile, fileName, cb] = args;
          cb();
        }),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const fileId = 'fileId';
      // Act
      await downloadFile(res, fileId);
      // Assert
      expect(res.download).toHaveBeenCalled();
    });

    describe('file not found', () => {
      it('should return 400', async () => {
        mockFindFirstOrThrow.mockResolvedValue({
          attachment_file_id: faker.string.uuid(),
          display_name: faker.lorem.word(),
        });
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        mockSend.mockResolvedValue({
          Contents: [],
        });

        const fileId = 'fileId';
        await downloadFile(res, fileId);
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    describe('get most recent file fails', () => {
      it('should return 400', async () => {
        mockFindFirstOrThrow.mockResolvedValue({
          attachment_file_id: faker.string.uuid(),
          display_name: faker.lorem.word(),
        });
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        mockSend.mockRejectedValue(new Error('error'));

        const fileId = 'fileId';
        await downloadFile(res, fileId);
        expect(res.status).toHaveBeenCalledWith(400);
      });
    });

    it('should return 400', async () => {
      mockFindFirstOrThrow.mockRejectedValue(new Error('error'));

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const fileId = 'fileId';
      await downloadFile(res, fileId);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('deleteFiles', () => {
    it('should handle multiple ids, ids that dont exist, and ids that have already been deleted', async () => {
      const ids = ['id1', 'id2', 'id3', 'id4'];
      const fileId1a = { Key: `${APP_ANNOUNCEMENTS_FOLDER}/id1/file1a` };
      const fileId1b = { Key: `${APP_ANNOUNCEMENTS_FOLDER}/id1/file1b` };
      const fileId1c = { Key: `${APP_ANNOUNCEMENTS_FOLDER}/id1/file1c` };
      const fileId2 = {
        Key: `${APP_ANNOUNCEMENTS_FOLDER}/id2/file2`,
        Code: 'NoSuchKey',
      };
      const fileId3 = {
        Key: `${APP_ANNOUNCEMENTS_FOLDER}/id3/file3`,
        Code: 'OtherError',
      };

      mockSend.mockImplementation((...args) => {
        const [command] = args;
        if (command instanceof ListObjectsCommand) {
          // test: multiple files in id1. id4 doesn't exist
          if (command.input.Prefix == `${APP_ANNOUNCEMENTS_FOLDER}/id1`)
            return { Contents: [fileId1a, fileId1b, fileId1c] };
          if (command.input.Prefix == `${APP_ANNOUNCEMENTS_FOLDER}/id2`)
            return { Contents: [fileId2] };
          if (command.input.Prefix == `${APP_ANNOUNCEMENTS_FOLDER}/id3`)
            return { Contents: [fileId3] };
          return {};
        }
        if (command instanceof DeleteObjectsCommand) {
          return {
            Deleted: [fileId1a, fileId1b, fileId1c],
            Errors: [fileId2, fileId3],
          };
        }
      });

      const result = await deleteFiles(ids);

      //id3 had a file that failed to delete, so it shouldn't say that id3 was deleted
      expect(result).toEqual(new Set(['id1', 'id2', 'id4']));
    });
  });

  describe('upload', () => {
    const mockStream = { pipe: jest.fn(), on: jest.fn() };

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

      mockUploadDone.mockResolvedValue({ ETag: '"abc"' });

      const uploadCalls: string[] = [];
      (Upload as unknown as jest.Mock).mockImplementation((config) => {
        uploadCalls.push(config.params.Key);
        return { done: mockUploadDone };
      });

      await upload(filePath, fileName, contentType, folder, attachmentId);
      await upload(filePath, fileName, contentType, folder, attachmentId);

      expect(uploadCalls).toHaveLength(2);
      expect(uploadCalls[0]).not.toBe(uploadCalls[1]);
    });
  });
});
