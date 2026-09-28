import {
  GetObjectCommand,
  DeleteObjectsCommand,
  S3Client,
  type _Object,
  paginateListObjectsV2,
} from '@aws-sdk/client-s3';
import fs from 'node:fs';
import PATH from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../logger.js';
import { S3_BUCKET, S3_OPTIONS } from '../../constants/admin.js';
import { NodeJsClient } from '@smithy/types';
import { Upload } from '@aws-sdk/lib-storage';
import AsyncRetry from 'async-retry';

/* This module provides functions to interact with an S3-compatible object store.
 * Upload files with a given {folder} and {id} and {extention}.
 * Replacing a file by uploading with the same {folder} and {id} will not delete the previous file, but will keep it in the object store.
 * Getting a file will return the most recent file.
 * Delete files will delete the history of any {id}.
 */

/* Internal notes:
 * Keeping multiple files for the same id is accomplished by this module creating its own uuid for every file uploaded.
 * For example, ${folder}/${id}/${uuidv4()}${ext} is the key for every file uploaded.
 * The same {id} history could look like this in the object store:
 * app/1234/qwer.pdf -> metadata: { LastModified: 2024-06-01T12:00:00Z }
 * app/1234/asdf.pdf -> metadata: { LastModified: 2024-06-02T12:00:00Z }
 * app/1234/zxcv.pdf -> metadata: { LastModified: 2024-06-03T12:00:00Z }
 * The {id} is 1234 and the most recent file is determined by the LastModified property of the S3 object.
 */

const getFileList = async (s3Client: S3Client, folder: string, id: string) => {
  const paginator = paginateListObjectsV2(
    { client: s3Client, pageSize: 1000 },
    {
      Bucket: S3_BUCKET,
      Prefix: `${folder}/${id}/`,
    },
  );

  const files: _Object[] = [];
  for await (const page of paginator) {
    files.push(...(page.Contents ?? []));
  }

  return files;
};

const getMostRecentFile = async (
  s3Client: S3Client,
  folder: string,
  id: string,
) => {
  const fileList = await getFileList(s3Client, folder, id);
  if (fileList.length === 0) return undefined;
  return fileList.reduce((latest, current) =>
    current.LastModified > latest.LastModified ? current : latest,
  );
};

/**
 * @returns the file streaming data and extenstion (eg. ".pdf")
 */
export const getFile = async (folder: string, id: string) => {
  const s3Client = new S3Client(S3_OPTIONS) as NodeJsClient<S3Client>; // "as NodeJs..." ensures that TypeScript uses NodeJs types instead of Browser types
  const s3File = await getMostRecentFile(s3Client, folder, id);
  if (!s3File || !s3File.Key) {
    throw new Error('File not found');
  }

  const ext = PATH.extname(s3File.Key);

  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3File.Key,
    }),
  );

  return { data: result, ext };
};

/**
 * Delete multiple files from the object store that follow the 'keep-history-strategy'
 * @param ids
 * @returns A Set<string> of id's that are no longer in the object store
 */
export const deleteFiles = async (
  folder: string,
  ids: string[],
): Promise<Set<string>> => {
  const s3Client = new S3Client(S3_OPTIONS) as NodeJsClient<S3Client>;

  const listResults = await Promise.allSettled(
    ids.map((id) => getFileList(s3Client, folder, id)),
  );

  const idsWithNoFiles = new Set<string>();
  const idsWithFiles = new Set<string>();
  const files: _Object[] = [];

  listResults.forEach((result, index) => {
    const id = ids[index];
    if (result.status === 'fulfilled') {
      if (result.value.length === 0) {
        idsWithNoFiles.add(id);
      } else {
        idsWithFiles.add(id);
        files.push(...result.value);
      }
    } else {
      logger.error(
        `Failed to list files for id "${id}" in folder "${folder}": ${result.reason}`,
      );
    }
  });

  const groupedFiles: _Object[][] = [];
  for (let i = 0; i < files.length; i += 1000)
    groupedFiles.push(files.slice(i, i + 1000));

  const deleteResults = await Promise.allSettled(
    groupedFiles.map((group) =>
      s3Client.send(
        new DeleteObjectsCommand({
          Bucket: S3_BUCKET,
          Delete: {
            Objects: group
              .filter((o): o is _Object & { Key: string } => !!o.Key)
              .map((o) => ({ Key: o.Key })),
          },
        }),
      ),
    ),
  );

  const failedIds = new Set<string>();

  deleteResults.forEach((result, index) => {
    const group = groupedFiles[index];

    if (result.status === 'fulfilled') {
      result.value.Errors?.forEach((e) => {
        if (!e.Key) return;
        logger.error(`Failed to delete "${e.Key}": ${e.Message}`);
        if (e.Code === 'NoSuchKey') return; // already gone — treat as success
        failedIds.add(getIdFromKey(e.Key, folder));
      });
    } else {
      // Promise failed — treat all keys in the group as failed
      logger.error(
        `Failed to delete batch ${index} in folder "${folder}": ${result.reason}`,
      );
      group.forEach((o) => {
        if (o.Key) failedIds.add(getIdFromKey(o.Key, folder));
      });
    }
  });

  const successfulIds = [...idsWithFiles].filter((id) => !failedIds.has(id));

  return new Set([...idsWithNoFiles, ...successfulIds]);
};

/**
 * Uploads a file to S3 with retry logic
 * @returns Promise that resolves when upload completes
 */
export const upload = async (
  filePath: string,
  fileName: string,
  contentType: string,
  folder: string,
  attachmentId: string,
): Promise<void> => {
  const ext = PATH.extname(fileName);
  const s3 = new S3Client(S3_OPTIONS);

  await AsyncRetry(
    async () => {
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
      const results = await upload.done();
      return results;
    },
    { retries: 3 },
  );
};

/**
 * Given a string in this format, return the 'id' portion of the string
 * ANY/PATH/.../${id}/${file}
 */
function getIdFromKey(key: string, folder: string): string {
  return key.slice(folder.length + 1, key.lastIndexOf('/'));
}
