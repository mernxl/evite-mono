import * as Minio from 'minio';

import { config } from './config';
import { wLogger } from './winston';

export const minioClient = new Minio.Client({
  endPoint: config.minio.endpoint,
  port: config.minio.port,
  region: config.MINIO_REGION,
  useSSL: !!config.MINIO_USE_SSL,
  accessKey: config.minio.accessKey,
  secretKey: config.minio.secretKey,
});

export const setupBucket = (bucketName: string) => {
  minioClient.bucketExists(bucketName).then((exists) => {
    if (!exists) {
      minioClient.makeBucket(bucketName, '').catch((reason) => wLogger.error(reason));
    }
  });
};
