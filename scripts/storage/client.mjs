import '../lib/load-env.mjs';
import { S3Client } from '@aws-sdk/client-s3';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for storage operations.`);
  return value;
}

export function storageConfig() {
  return {
    bucket: process.env.STORAGE_BUCKET || 'portfolio-assets',
    endpoint: required('AWS_ENDPOINT_URL_S3'),
    region: required('AWS_REGION'),
    accessKeyId: required('AWS_ACCESS_KEY_ID'),
    secretAccessKey: required('AWS_SECRET_ACCESS_KEY'),
  };
}

export function createStorageClient(config) {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });
}
