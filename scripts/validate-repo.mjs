import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';

const root = resolve('.');
const requiredPaths = [
  '.env.example',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-pages.yml',
  '.github/workflows/provision-neon.yml',
  '.gitignore',
  'LICENSE',
  'PROJECT_STATUS.md',
  'README.md',
  'db/migrations/0001_initial_schema.sql',
  'db/migrations/0002_data_api_permissions.sql',
  'db/migrations/0003_editor_functions.sql',
  'db/schema.sql',
  'docs/architecture.md',
  'docs/authentication.md',
  'docs/content-editor.md',
  'docs/data-model.md',
  'docs/deployment.md',
  'docs/handoff.md',
  'docs/notion-readonly-context.md',
  'docs/recovery.md',
  'docs/security.md',
  'docs/storage.md',
  'neon.ts',
  'package.json',
  'pnpm-lock.yaml',
];

const secretPatterns = [
  { name: 'private key', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'GitHub token', pattern: /\bgh[opsu]_[A-Za-z0-9]{30,}\b/ },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Neon storage secret', pattern: /\bnsk_live_[A-Za-z0-9_-]{16,}\b/ },
  { name: 'database password in URL', pattern: /postgres(?:ql)?:\/\/[^\s:/]+:[^\s@]+@[^\s]+/i },
];

const ignoredDirectories = new Set(['.git', 'backups', 'coverage', 'dist', 'node_modules']);
const missing = [];
for (const path of requiredPaths) {
  try {
    await stat(resolve(root, path));
  } catch {
    missing.push(path);
  }
}

async function textFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = resolve(directory, entry.name);
    if (entry.isDirectory()) output.push(...(await textFiles(fullPath)));
    else if (entry.isFile() && (await stat(fullPath)).size < 2_000_000) output.push(fullPath);
  }
  return output;
}

const findings = [];
for (const file of await textFiles(root)) {
  const content = await readFile(file, 'utf8').catch(() => '');
  for (const candidate of secretPatterns) {
    if (candidate.pattern.test(content)) {
      findings.push(`${relative(root, file)}: possible ${candidate.name}`);
    }
  }
}

if (missing.length || findings.length) {
  throw new Error(
    [
      missing.length ? `Missing portability files:\n- ${missing.join('\n- ')}` : '',
      findings.length ? `Possible secrets:\n- ${findings.join('\n- ')}` : '',
    ]
      .filter(Boolean)
      .join('\n\n'),
  );
}

console.log(`Repository validation passed (${requiredPaths.length} required paths, no obvious secrets).`);
