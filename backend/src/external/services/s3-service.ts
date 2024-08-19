import { S3Client } from '@aws-sdk/client-s3';
import { config } from '../../config';

export const getS3Client = () => {
  const accessKeyId = config.get('s3:accessKeyId');
  const secretAccessKey = config.get('s3:secretAccessKey');
  const region = config.get('s3:region');
  const endpoint = config.get('s3:endpoint');

  return new S3Client({
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
    },
    endpoint: endpoint,
    forcePathStyle: true,
    region: region,
  });
};
