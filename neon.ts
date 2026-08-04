import { defineConfig } from '@neon/config/v1';

const protectDefaultBranch = process.env.NEON_PROTECT_DEFAULT_BRANCH !== 'false';

export default defineConfig({
  auth: true,
  dataApi: true,
  preview: {
    buckets: {
      'portfolio-assets': { access: 'public_read' },
    },
    functions: {
      storage: {
        name: 'Portfolio storage broker',
        source: './functions/storage.ts',
        env: {
          ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ?? '',
          STORAGE_BUCKET: process.env.STORAGE_BUCKET ?? 'portfolio-assets',
        },
        dev: { port: 8787 },
      },
    },
  },
  branch: (branch) => {
    if (branch.isDefault) return protectDefaultBranch ? { protected: true } : {};
    if (!branch.exists) return { ttl: '7d' };
    return {};
  },
});
