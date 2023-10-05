import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream } from 'fs';

import { config } from './config';
import { wLogger } from './winston';

export const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

/**
 * @see https://aws.amazon.com/blogs/developer/generate-presigned-url-modular-aws-sdk-javascript/
 */
export async function getPresignedUrl(
  bucket = config.EVENT.BUCKET_NAME,
  key: string,
  expires: number,
) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expires });
}

export async function downloadS3File(
  bucket = config.EVENT.BUCKET_NAME,
  key: string,
  dist_path: string,
) {
  const params = {
    Bucket: bucket,
    Key: key,
  };

  try {
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    // Create a write stream to save the file locally
    const fileStream = createWriteStream(dist_path);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    response.Body.pipe(fileStream);

    return new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  } catch (err) {
    wLogger.error(err);
  }
}
