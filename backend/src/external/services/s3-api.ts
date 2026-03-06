import {
  GetObjectCommand,
  ListObjectsCommand,
  DeleteObjectsCommand,
  S3Client,
  type ObjectIdentifier,
  type _Object,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import prisma from '../../v1/prisma/prisma-client.js';
import os from 'node:os';
import fs from 'node:fs';
import retry from 'async-retry';
import PATH from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../logger.js';
import {
  APP_ANNOUNCEMENTS_FOLDER,
  S3_BUCKET,
  S3_OPTIONS,
} from '../../constants/admin.js';

/*  */

const getFileList = async (s3Client: S3Client, key: string) => {
  const response = await s3Client.send(
    new ListObjectsCommand({
      Bucket: S3_BUCKET,
      Prefix: `${APP_ANNOUNCEMENTS_FOLDER}/${key}`,
    }),
  );
  return response.Contents ?? [];
};

const getMostRecentFile = async (s3Client: S3Client, key: string) => {
  try {
    const fileList = await getFileList(s3Client, key);
    const sortedData = fileList.sort((a, b) => {
      const modifiedDateA: any = new Date(a.LastModified);
      const modifiedDateB: any = new Date(b.LastModified);
      return modifiedDateB - modifiedDateA;
    });
    return sortedData[0];
  } catch {
    return undefined;
  }
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

/**
 * Delete multiple files from the object store that follow the 'keep-history-strategy'
 * @param ids
 * @returns A Set<string> of id's that are no longer in the object store
 */
export const deleteFiles = async (ids: string[]): Promise<Set<string>> => {
  const s3Client = new S3Client(S3_OPTIONS);
  try {
    // Get all the files stored under each id
    const filesPerId = await Promise.all(
      ids.map((id) => getFileList(s3Client, id)),
    );
    const idsWithNoFiles = ids.filter(
      (id, index) => filesPerId[index].length === 0,
    );
    const files = filesPerId.flat();

    // Group into 1000 items because DeleteObjectsCommand can only do 1000 at a time
    const groupedFiles: _Object[][] = [];
    for (let i = 0; i < files.length; i += 1000)
      groupedFiles.push(files.slice(i, i + 1000));

    // delete all files in object store
    const responsePerGroup = await Promise.all(
      groupedFiles.map((group) =>
        s3Client.send(
          new DeleteObjectsCommand({
            Bucket: S3_BUCKET,
            Delete: { Objects: group as ObjectIdentifier[] },
          }),
        ),
      ),
    );

    // report any errors
    responsePerGroup.forEach((r) =>
      r.Errors?.forEach((e) => {
        if (e.Code == 'NoSuchKey') idsWithNoFiles.push(getIdFromKey(e.Key));
        logger.error(e.Message);
      }),
    );

    // Return the id of all successful deleted
    const successfulIds = responsePerGroup.flatMap((r) =>
      r.Deleted?.reduce((acc, x) => {
        acc.push(getIdFromKey(x.Key));
        return acc;
      }, [] as string[]),
    );

    return new Set(idsWithNoFiles.concat(successfulIds)); //remove duplicates
  } catch (error) {
    logger.error(error);
    return new Set();
  }
};

/**
 * Uploads a file to S3 with retry logic
 * @param params - Upload parameters
 * @returns Promise that resolves when upload completes
 */
export const upload = async (
  filePath: string,
  fileName: string,
  contentType: string,
  folder: string,
  attachmentId: string,
): Promise<void> => {
  const ext = PATH.extname(fileName ?? '');
  const s3 = new S3Client(S3_OPTIONS);
  const stream = fs.createReadStream(filePath);

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: S3_BUCKET,
      Key: `${folder}/${attachmentId}/${uuidv4()}${ext}`,
      Body: stream,
      ContentType: contentType,
    },
  });

  await retry(
    async () => {
      const results = await upload.done();
      return results;
    },
    { retries: 3 },
  );
};

/**
 * Given a string in this format, return the 'id' portion of the string
 * ${APP_ANNOUNCEMENTS_FOLDER}/${id}/${file}
 */
function getIdFromKey(key: string): string {
  return key.replace(`${APP_ANNOUNCEMENTS_FOLDER}/`, '').split('/', 1)[0];
}
