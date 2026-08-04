import { createHash } from 'node:crypto';
import { GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createStorageClient, storageConfig } from './client.mjs';

const requestedOutput = process.argv.find((value) => value.startsWith('--output='))?.slice(9);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(requestedOutput || `backups/storage-${timestamp}`);
const objectDirectory = resolve(output, 'objects');
const config = storageConfig();
const client = createStorageClient(config);
const manifest = {
  format: 'aleetreny-portfolio-storage-export',
  version: 1,
  exportedAt: new Date().toISOString(),
  sourceBucket: config.bucket,
  objects: [],
};

await mkdir(objectDirectory, { recursive: true, mode: 0o700 });

let continuationToken;
do {
  const page = await client.send(
    new ListObjectsV2Command({ Bucket: config.bucket, ContinuationToken: continuationToken }),
  );

  for (const object of page.Contents || []) {
    if (!object.Key) continue;
    const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: object.Key }));
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Storage returned an empty body for ${object.Key}.`);

    const file = `${createHash('sha256').update(object.Key).digest('hex')}.blob`;
    await writeFile(resolve(objectDirectory, file), bytes, { mode: 0o600 });
    manifest.objects.push({
      key: object.Key,
      file,
      contentType: response.ContentType || 'application/octet-stream',
      metadata: response.Metadata || {},
      etag: object.ETag || null,
      byteSize: object.Size || bytes.byteLength,
    });
  }

  continuationToken = page.NextContinuationToken;
} while (continuationToken);

await writeFile(resolve(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
console.log(`Exported ${manifest.objects.length} objects to ${output}. Do not commit this backup.`);
