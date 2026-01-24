import fs from 'node:fs';
import os from 'node:os';
import PATH from 'node:path';
import { logger } from '../../../logger';
import { upload } from '../../../external/services/s3-api';

interface Options {
  folder: string;
}

export const useUpload = (options: Options) => {
  return async (req, res, next) => {
    const { file, ...data } = req.body;

    if (!file || !data.attachmentId) {
      return next();
    }

    logger.log('info', 'Uploading file to S3');

    const { path, name, type } = file;

    if (!path.startsWith(os.tmpdir())) {
      logger.error('File not uploaded to temp directory');
      return res.status(400).json({ message: 'Invalid request' });
    }

    try {
      const filePath = fs.realpathSync(PATH.resolve(os.tmpdir(), path));

      if (!filePath.startsWith(os.tmpdir())) {
        logger.error('File path is not starting with temp directory.');
        res.statusCode = 403;
        res.end();
        return;
      }

      await upload(filePath, name, type, options.folder, data.attachmentId);

      next();
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  };
};
