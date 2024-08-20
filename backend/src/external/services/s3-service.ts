import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../../config';

const accessKeyId = config.get('s3:accessKey');
const secretAccessKey = config.get('s3:secretAccessKey');
const region = config.get('s3:region');
const endpoint = config.get('s3:endpoint');
const bucket = config.get('s3:bucket');

export const multerS3StorageOptions = {
  s3: new S3Client({
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    endpoint: endpoint,
    forcePathStyle: true,
    region,
  }),
  bucket,
  metadata: function (req, file, cb) {
    console.log('metadata', file);
    cb(null, { fileName: file.originalname });
  },
  key: function (req, file, cb) {
    console.log('getkey', file);
    cb(null, req.body.attachmentId);
  },
};

