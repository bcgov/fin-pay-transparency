import { faker } from '@faker-js/faker';
import { downloadFile, deleteFiles } from './s3-api';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
} from '@aws-sdk/client-s3';
import { APP_ANNOUNCEMENTS_FOLDER } from '../../constants/admin';

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

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: () => ({
    write: (...args) => mockStreamWrite(...args),
  }),
  unlink: jest.fn(),
}));

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  ...jest.requireActual('@aws-sdk/client-s3'),
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
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
});
