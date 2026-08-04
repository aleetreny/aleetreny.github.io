import { randomBytes, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { BetterAuthVanillaAdapter, createClient } from '@neondatabase/neon-js';
import postgres from 'postgres';
import { createStorageClient, storageConfig } from './client.mjs';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for the live storage verification.`);
  return value;
}

function responseError(prefix, response, body = '') {
  const detail = body.trim().slice(0, 300);
  return new Error(`${prefix} returned HTTP ${response.status}${detail ? `: ${detail}` : '.'}`);
}

const authUrl = required('NEON_AUTH_BASE_URL');
const dataApiUrl = required('NEON_DATA_API_URL');
const databaseUrl = required('DATABASE_URL');
const neonBranch = required('NEON_BRANCH');
const storageFunctionUrl = required('STORAGE_FUNCTION_URL').replace(/\/$/, '');
const allowedOrigin = process.env.STORAGE_TEST_ORIGIN || 'http://localhost:5173';
const imagePath = resolve(process.env.STORAGE_TEST_IMAGE || 'public/og.jpg');
const image = await readFile(imagePath);
if (neonBranch === 'production' && process.env.STORAGE_VERIFY_ALLOW_PRODUCTION !== 'true') {
  throw new Error('Set STORAGE_VERIFY_ALLOW_PRODUCTION=true to run this synthetic test on production.');
}
const filename = `verification-${randomUUID()}.jpg`;
const email = `codex-storage-${randomUUID()}@example.com`;
const password = `Aa1!${randomBytes(24).toString('base64url')}`;
const sql = postgres(databaseUrl, { max: 1, prepare: false, connect_timeout: 15 });
let authJwt;
let authCookie;
const authClient = createClient({
  auth: {
    url: authUrl,
    allowAnonymous: true,
    adapter: (url) => BetterAuthVanillaAdapter({
      fetchOptions: {
        onSuccess: ({ response }) => {
          authJwt = response.headers.get('set-auth-jwt') || authJwt;
          const setCookies = response.headers.getSetCookie?.() ?? [response.headers.get('set-cookie')];
          const cookiePairs = setCookies.filter(Boolean).map((cookie) => cookie.split(';', 1)[0]);
          if (cookiePairs.length) authCookie = cookiePairs.join('; ');
        },
      },
    })(url, { headers: { Origin: allowedOrigin } }),
  },
  dataApi: { url: dataApiUrl },
});
const s3Config = storageConfig();
const s3 = createStorageClient(s3Config);
const execFileAsync = promisify(execFile);

let userId;
let objectKey;
let assetId;
let backupDirectory;

try {
  const signup = await authClient.auth.signUp.email({
    email,
    name: 'Codex storage verification',
    password,
  });
  if (signup.error) throw new Error(`Neon Auth signup failed: ${signup.error.message}`);
  userId = signup.data?.user.id;
  if (!userId) throw new Error('Neon Auth signup did not return a user ID.');

  await sql`
    insert into app_private.owner_accounts (auth_user_id, email, enabled)
    values (${userId}, ${email}, true)
    on conflict (auth_user_id) do update set enabled = true
  `;

  let token = authJwt ?? signup.data?.session?.token ?? signup.data?.token;
  if (!token || token.split('.').length !== 3) {
    if (!authCookie) {
      const returnedFields = Object.keys(signup.data ?? {}).sort().join(', ') || 'none';
      throw new Error(`Neon Auth did not return a session cookie (fields: ${returnedFields}).`);
    }
    const tokenResponse = await fetch(`${authUrl.replace(/\/$/, '')}/token`, {
      headers: { Cookie: authCookie, Origin: allowedOrigin },
    });
    const tokenBody = await tokenResponse.text();
    if (!tokenResponse.ok) throw responseError('Neon Auth JWT exchange', tokenResponse, tokenBody);
    token = JSON.parse(tokenBody)?.token;
  }
  if (!token || token.split('.').length !== 3) {
    const returnedFields = Object.keys(signup.data ?? {}).sort().join(', ') || 'none';
    throw new Error(`Neon Auth did not return an authenticated JWT (fields: ${returnedFields}).`);
  }

  const presignResponse = await fetch(`${storageFunctionUrl}/uploads/presign`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Origin: allowedOrigin,
    },
    body: JSON.stringify({
      filename,
      contentType: 'image/jpeg',
      byteSize: image.byteLength,
    }),
  });
  const presignBody = await presignResponse.text();
  if (!presignResponse.ok) throw responseError('Storage presign', presignResponse, presignBody);
  const presign = JSON.parse(presignBody);
  if (!presign.uploadUrl || !presign.publicUrl || !presign.key || !presign.bucket) {
    throw new Error('Storage presign response is incomplete.');
  }
  objectKey = presign.key;

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/jpeg' },
    body: image,
  });
  if (!uploadResponse.ok) {
    throw responseError('Signed upload', uploadResponse, await uploadResponse.text());
  }

  const publicResponse = await fetch(presign.publicUrl, { cache: 'no-store' });
  if (!publicResponse.ok) throw responseError('Public asset read', publicResponse);
  const publicBytes = new Uint8Array(await publicResponse.arrayBuffer());
  if (publicBytes.byteLength !== image.byteLength) {
    throw new Error('Public asset byte length differs from the uploaded file.');
  }

  let registrationResponse;
  let registrationBody = '';
  for (const delay of [0, 200, 500, 1_000, 2_000]) {
    if (delay) await new Promise((resolveDelay) => setTimeout(resolveDelay, delay));
    registrationResponse = await fetch(`${dataApiUrl}/rpc/register_uploaded_asset`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Origin: allowedOrigin,
      },
      body: JSON.stringify({
        p_bucket: presign.bucket,
        p_object_key: presign.key,
        p_public_url: presign.publicUrl,
        p_mime_type: 'image/jpeg',
        p_byte_size: image.byteLength,
        p_alt_text: 'Imagen sintética para verificar almacenamiento',
      }),
    });
    registrationBody = await registrationResponse.text();
    if (registrationResponse.ok) break;
  }
  if (!registrationResponse) throw new Error('Asset registration did not run.');
  if (!registrationResponse.ok) {
    throw responseError('Asset registration', registrationResponse, registrationBody);
  }
  const registration = JSON.parse(registrationBody);
  assetId = registration?.id ?? registration?.[0]?.id;
  if (!assetId) throw new Error('Asset registration did not return an ID.');

  const storedRows = await sql`
    select id from public.assets
    where id = ${assetId} and owner_id = ${userId} and object_key = ${objectKey}
  `;
  if (storedRows.length !== 1) throw new Error('Registered asset was not found in Postgres.');

  backupDirectory = await mkdtemp(join(tmpdir(), 'portfolio-storage-verification-'));
  await execFileAsync(
    process.execPath,
    [resolve('scripts/storage/export-assets.mjs'), `--output=${backupDirectory}`],
    { cwd: process.cwd(), env: process.env },
  );

  const deleteResponse = await fetch(`${storageFunctionUrl}/uploads`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Origin: allowedOrigin,
    },
    body: JSON.stringify({ key: objectKey }),
  });
  if (!deleteResponse.ok) {
    throw responseError('Storage delete', deleteResponse, await deleteResponse.text());
  }

  let objectStillExists = true;
  try {
    await s3.send(new HeadObjectCommand({ Bucket: s3Config.bucket, Key: objectKey }));
  } catch (error) {
    if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') objectStillExists = false;
    else throw error;
  }
  if (objectStillExists) throw new Error('Deleted object is still present in Object Storage.');

  await execFileAsync(
    process.execPath,
    [resolve('scripts/storage/import-assets.mjs'), `--input=${backupDirectory}`],
    { cwd: process.cwd(), env: process.env },
  );
  await s3.send(new HeadObjectCommand({ Bucket: s3Config.bucket, Key: objectKey }));

  const finalDeleteResponse = await fetch(`${storageFunctionUrl}/uploads`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Origin: allowedOrigin,
    },
    body: JSON.stringify({ key: objectKey }),
  });
  if (!finalDeleteResponse.ok) {
    throw responseError('Final storage delete', finalDeleteResponse, await finalDeleteResponse.text());
  }
  try {
    await s3.send(new HeadObjectCommand({ Bucket: s3Config.bucket, Key: objectKey }));
    throw new Error('Restored object is still present after the final delete.');
  } catch (error) {
    if (error?.$metadata?.httpStatusCode !== 404 && error?.name !== 'NotFound') throw error;
  }

  console.log(
    'Live storage verification passed: signup → owner → presign → PUT → public GET → Data API registration → export → delete → import → delete → cleanup.',
  );
} finally {
  if (objectKey) {
    await s3.send(new DeleteObjectCommand({ Bucket: s3Config.bucket, Key: objectKey })).catch(() => undefined);
  }
  if (assetId) await sql`delete from public.assets where id = ${assetId}`.catch(() => undefined);
  if (userId) {
    await sql`delete from app_private.owner_accounts where auth_user_id = ${userId}`.catch(() => undefined);
    await sql`delete from neon_auth."user" where id = ${userId}`.catch(() => undefined);
  }
  if (backupDirectory) await rm(backupDirectory, { recursive: true, force: true }).catch(() => undefined);
  await sql.end({ timeout: 5 });
}
