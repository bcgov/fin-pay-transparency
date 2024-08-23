import { faker } from '@faker-js/faker';
import { downloadFile } from './s3-api';
import { GetObjectCommand, ListObjectsCommand } from '@aws-sdk/client-s3';

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
});
