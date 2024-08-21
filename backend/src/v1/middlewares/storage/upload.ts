import fs from 'fs';
import { logger } from '../../../logger';
import { config } from '../../../config';
import {
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import os from 'os';

export const APP_ANNOUNCEMENTS_FOLDER = 'app/announcements';

interface Options {
  folder: string;
}

const accessKeyId = config.get('s3:accessKeyId');
const secretAccessKey = config.get('s3:secretAccessKey');
const region = config.get('s3:region');
const endpoint = config.get('s3:endpoint');
const bucket = config.get('s3:bucket');

export const useUpload = (options: Options) => {
  return async (req, res, next) => {
    const { file, ...data } = req.body;
    if (!file || !data.attachmentId) {
      return next();
    }
    logger.log('info', 'Uploading file to S3');

    const { path, name, type, size } = file;

    if (!path.startsWith(os.tmpdir())) {
      logger.error('File not uploaded to temp directory');
      return res.status(400).json({ message: 'Invalid request' });
    }

    try {
      const s3 = new S3Client({
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        endpoint,
        forcePathStyle: true,
        region,
      });
      const stream = fs.createReadStream(path);
      const uploadParams: PutObjectCommandInput = {
        Bucket: bucket,
        Key: `${options.folder}/${data.attachmentId}/${name}`,
        Body: stream,
        ContentType: type,
        ContentLength: size,
      };
      const command = new PutObjectCommand(uploadParams);
      const results = await s3.send(command);
      logger.info('Upload results', results);
      next();
    } catch (error) {
      logger.error(error);
      res.status(400).json({ message: 'Invalid request', error });
    }
  };
};
