import { multerS3StorageOptions } from './s3-service';

describe('S3Service', () => {
  describe('multerS3StorageOptions', () => {
    describe('metadata', () => {
      it('should call cb with null and object with fileName as key', () => {
        // Arrange
        const cb = jest.fn();
        const req = {};
        const file = { originalname: 'originalname' };
        // Act
        multerS3StorageOptions.metadata(req, file, cb);
        // Assert
        expect(cb).toHaveBeenCalledWith(null, { fileName: file.originalname });
      });
    });

    describe('key', () => {
        it('should call cb with null and req.body.attachmentId', () => {
            // Arrange
            const cb = jest.fn();
            const req = { body: { attachmentId: 'attachmentId' } };
            const file = {};
            // Act
            multerS3StorageOptions.key(req, file, cb);
            // Assert
            expect(cb).toHaveBeenCalledWith(null, req.body.attachmentId);
        });
    });
  });
});
