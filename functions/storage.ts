import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Hono } from 'hono';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { Pool } from 'pg';
import { z } from 'zod';
import {
  isAllowedOrigin,
  isUploadAllowed,
  publicObjectUrl,
  sanitizeFilename,
} from './storage-policy';

const app = new Hono();
const uploadRequestSchema = z.object({
  filename: z.string().min(1).max(180),
  contentType: z.string().min(1).max(100),
  byteSize: z.number().int().positive(),
});
const deleteRequestSchema = z.object({ key: z.string().min(1).max(512) });

let pool: Pool | undefined;
let s3Client: S3Client | undefined;
let jwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let jwksUrl = '';

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getPool(): Pool {
  pool ??= new Pool({ connectionString: requiredEnv('DATABASE_URL'), max: 2 });
  return pool;
}

function getS3Client(): S3Client {
  s3Client ??= new S3Client({
    region: requiredEnv('AWS_REGION'),
    endpoint: requiredEnv('AWS_ENDPOINT_URL_S3'),
    credentials: {
      accessKeyId: requiredEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('AWS_SECRET_ACCESS_KEY'),
    },
    forcePathStyle: true,
    requestChecksumCalculation: 'WHEN_REQUIRED',
  });
  return s3Client;
}

function getJwks() {
  const nextUrl = requiredEnv('NEON_AUTH_JWKS_URL');
  if (!jwks || jwksUrl !== nextUrl) {
    jwks = createRemoteJWKSet(new URL(nextUrl));
    jwksUrl = nextUrl;
  }
  return jwks;
}

async function verifyBearerToken(header: string | undefined): Promise<JWTPayload> {
  const token = header?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error('Missing bearer token.');

  const authOrigin = new URL(requiredEnv('NEON_AUTH_BASE_URL')).origin;
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: authOrigin,
    audience: authOrigin,
    algorithms: ['EdDSA'],
  });
  if (!payload.sub) throw new Error('Token has no subject.');
  return payload;
}

async function ownerFromRequest(authorization: string | undefined): Promise<string> {
  const payload = await verifyBearerToken(authorization);
  const ownerId = String(payload.sub);
  const result = await getPool().query<{ allowed: boolean }>(
    `select exists (
       select 1
       from app_private.owner_accounts
       where auth_user_id = $1 and enabled = true
     ) as allowed`,
    [ownerId],
  );
  if (result.rows[0]?.allowed !== true) throw new Error('Authenticated user is not an owner.');
  return ownerId;
}

app.use('*', async (context, next) => {
  const origin = context.req.header('Origin');
  if (!isAllowedOrigin(origin, process.env.ALLOWED_ORIGINS ?? '')) {
    return context.json({ error: 'Origin is not allowed.' }, 403);
  }

  if (origin) {
    context.header('Access-Control-Allow-Origin', origin);
    context.header('Vary', 'Origin');
  }
  context.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  context.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  context.header('Access-Control-Max-Age', '3600');

  if (context.req.method === 'OPTIONS') return context.body(null, 204);
  await next();
});

app.get('/health', (context) => context.json({ ok: true }));

app.post('/uploads/presign', async (context) => {
  try {
    const ownerId = await ownerFromRequest(context.req.header('Authorization'));
    const request = uploadRequestSchema.parse(await context.req.json());
    if (!isUploadAllowed(request.contentType, request.byteSize)) {
      return context.json({ error: 'Unsupported image type or file exceeds 10 MiB.' }, 400);
    }

    const bucket = process.env.STORAGE_BUCKET ?? 'portfolio-assets';
    const key = `${ownerId}/${randomUUID()}-${sanitizeFilename(request.filename)}`;
    const uploadUrl = await getSignedUrl(
      getS3Client(),
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: request.contentType,
      }),
      { expiresIn: 300 },
    );

    return context.json({
      bucket,
      key,
      uploadUrl,
      publicUrl: publicObjectUrl(requiredEnv('AWS_ENDPOINT_URL_S3'), bucket, key),
      expiresIn: 300,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload authorization failed.';
    return context.json({ error: message }, message.includes('owner') ? 403 : 401);
  }
});

app.delete('/uploads', async (context) => {
  try {
    const ownerId = await ownerFromRequest(context.req.header('Authorization'));
    const request = deleteRequestSchema.parse(await context.req.json());
    if (!request.key.startsWith(`${ownerId}/`)) {
      return context.json({ error: 'Object is not owned by the authenticated user.' }, 403);
    }

    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.STORAGE_BUCKET ?? 'portfolio-assets',
        Key: request.key,
      }),
    );
    return context.body(null, 204);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete authorization failed.';
    return context.json({ error: message }, message.includes('owner') ? 403 : 401);
  }
});

export default app;
