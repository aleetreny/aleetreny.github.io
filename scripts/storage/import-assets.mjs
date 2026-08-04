import { PutObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createStorageClient, storageConfig } from './client.mjs';

const input = process.argv.find((value) => value.startsWith('--input='))?.slice(8);
if (!input) throw new Error('Pass --input=backups/storage-<timestamp>.');

const directory = resolve(input);
const manifest = JSON.parse(await readFile(resolve(directory, 'manifest.json'), 'utf8'));
if (manifest.format !== 'aleetreny-portfolio-storage-export' || manifest.version !== 1) {
  throw new Error('Unsupported storage export format or version.');
}

const config = storageConfig();
const client = createStorageClient(config);

for (const object of manifest.objects || []) {
  const body = await readFile(resolve(directory, 'objects', object.file));
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: object.key,
      Body: body,
      ContentType: object.contentType,
      Metadata: object.metadata,
    }),
  );
  console.log(`uploaded ${object.key}`);
}

console.log(`Imported ${(manifest.objects || []).length} objects into ${config.bucket}.`);
