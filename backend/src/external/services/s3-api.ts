import {
  GetObjectCommand,
  ListObjectsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import prisma from '../../v1/prisma/prisma-client';
import os from 'os';
import fs from 'fs';
import { logger } from '../../logger';
import { APP_ANNOUNCEMENTS_FOLDER, S3_BUCKET, S3_OPTIONS } from '../../constants/admin';


const getMostRecentFile = async (s3Client: S3Client, key: string) => {
  const response = await s3Client.send(
    new ListObjectsCommand({
      Bucket: S3_BUCKET,
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

export const getFile = async (key: string) => {
  const s3Client = new S3Client(S3_OPTIONS);
  const object = await getMostRecentFile(s3Client, key);
  if (!object) {
    throw new Error('File not found');
  }

  const fileName = object.Key;

  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    }),
  );

  return { data: result, fileName };
};

export const downloadFile = async (res, fileId: string) => {
  try {
    const attachment = await prisma.announcement_resource.findFirstOrThrow({
      where: {
        announcement_resource_id: fileId,
        resource_type: 'ATTACHMENT',
      },
    });
    const { data, fileName } = await getFile(attachment.attachment_file_id);
    const tempFile = os.tmpdir() + '/' + attachment.attachment_file_id;
    const writeStream = fs.createWriteStream(tempFile);
    const x = await data.Body.transformToByteArray();
    const fileNameTokens = fileName.split('/');
    const name = fileNameTokens[fileNameTokens.length - 1];
    const extension = name.split('.')[name.split('.').length - 1];
    writeStream.write(x, (err) => {
      /* istanbul ignore next */
      if (err) {
        logger.error('Failed to write s3 download', err);
        return res.status(400).send('Failed to download file');
      }
      res.setHeader(
        'Content-Disposition',
        `inline; filename=${attachment.display_name}.${extension}`,
      );
      res.download(
        tempFile,
        `${attachment.display_name}.${extension}`,
        (err) => {
          /* istanbul ignore next */
          if (err) {
            logger.error('Failed to download file', err);
            if (!res.headersSent) {
              return res.status(400).send('Failed to download file');
            }
          }

          fs.unlink(tempFile, function (err) {
            /* istanbul ignore next */
            if (err) {
              logger.error(err);
            }
          });
        },
      );
    });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ message: 'Invalid request', error });
  }
};
