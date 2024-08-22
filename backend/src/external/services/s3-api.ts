import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { config } from '../../config';

export const APP_ANNOUNCEMENTS_FOLDER = 'app/announcements';

const accessKeyId = config.get('s3:accessKeyId');
const secretAccessKey = config.get('s3:secretAccessKey');
const region = config.get('s3:region');
const endpoint = config.get('s3:endpoint');
export const bucket = config.get('s3:bucket');

export const S3_OPTIONS = {
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  endpoint,
  forcePathStyle: true,
  region,
};

const getMostRecentFile = async (s3Client: S3Client, key: string) => {
  const response = await s3Client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      Prefix: `${APP_ANNOUNCEMENTS_FOLDER}/${key}`,
    }),
  );
  const sortedData: any = response.Contents.sort((a: any, b: any) => {
    const modifiedDateA: any = new Date(a.LastModified);
    const modifiedDateB: any = new Date(b.LastModified);
    return modifiedDateB - modifiedDateA;
  });
  return sortedData[0];
};

const getObjectsInFolder = async (s3Client: S3Client, folderKey: string) => {
  const response = await s3Client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      Prefix: folderKey,
    }),
  );
  return response.Contents.map((object) => object.Key);
};

export const downloadFile = async (key: string) => {
  const s3Client = new S3Client(S3_OPTIONS);
  const object = await getMostRecentFile(s3Client, key);
  if (!object) {
    throw new Error('File not found');
  }

  const fileName = object.Key;

  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: fileName,
    }),
  );

  return { data: result, fileName };
};

export const deleteFiles = async (folder: string) => {
  const s3Client = new S3Client(S3_OPTIONS);
  const files = await getObjectsInFolder(s3Client, folder);

  await s3Client.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: files.map((file) => ({ Key: file })),
      },
    }),
  );
};
