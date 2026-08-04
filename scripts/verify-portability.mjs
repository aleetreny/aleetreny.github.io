import { execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const root = resolve('.');
const branch = execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim();
const tempRoot = await mkdtemp(resolve(tmpdir(), 'portfolio-portability-'));
const clone = resolve(tempRoot, 'clone');
const pnpm = process.env.PNPM_BIN || 'pnpm';

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit', env: process.env });
}

try {
  if (!branch) throw new Error('Portability verification requires a committed branch.');
  run('git', ['clone', '--quiet', '--branch', branch, '--single-branch', root, clone], tempRoot);
  run(pnpm, ['install', '--frozen-lockfile'], clone);
  run(pnpm, ['check'], clone);
  run(pnpm, ['build'], clone);
  console.log(`Clean-clone verification passed from branch ${branch}.`);
} finally {
  if (tempRoot.startsWith(`${tmpdir()}/portfolio-portability-`)) {
    await rm(tempRoot, { recursive: true, force: true });
  } else {
    console.error(`Refusing to clean unexpected path: ${tempRoot}`);
  }
}
