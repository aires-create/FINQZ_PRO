import { readFileSync, existsSync } from 'node:fs';
import { EOL } from 'node:os';

const repoRoot = process.cwd();

const readText = (relativePath) => {
  const fullPath = `${repoRoot}/${relativePath}`;
  if (!existsSync(fullPath)) {
    return null;
  }

  return readFileSync(fullPath, 'utf8');
};

const readKeyState = (relativePath, key) => {
  const text = readText(relativePath);
  if (!text) {
    return '<absent>';
  }

  const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
  if (!match) {
    return '<absent>';
  }

  const value = match[1].trim();
  if (!value) {
    return '<empty>';
  }

  if (key.includes('DATABASE_URL') || key.includes('DIRECT_URL') || key.includes('JWT')) {
    return '<masked>';
  }

  return value.replace(/^"|"$/g, '');
};

const readGitBranch = () => {
  const headPath = `${repoRoot}/.git/HEAD`;
  if (!existsSync(headPath)) {
    return '<git metadata unavailable>';
  }

  const head = readFileSync(headPath, 'utf8').trim();
  if (head.startsWith('ref: ')) {
    return head.slice('ref: '.length).replace(/^refs\/heads\//, '');
  }

  return head.slice(0, 12);
};

const report = [];

report.push('SDC 3.4H-F local readiness snapshot');
report.push(`branch: ${readGitBranch()}`);
report.push('git-status-clean: <use git status --short in terminal>');
report.push('');
report.push('frontend flags');
report.push(`  src/features/simulation-runtime/config/simulation-runtime.flags.ts: ${existsSync(`${repoRoot}/src/features/simulation-runtime/config/simulation-runtime.flags.ts`) ? 'present' : 'missing'}`);
report.push(`  VITE_SIMULATION_RUNTIME_SHADOW_ENABLED=${readKeyState('.env', 'VITE_SIMULATION_RUNTIME_SHADOW_ENABLED')}`);
report.push(`  VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED=${readKeyState('.env', 'VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED')}`);
report.push(`  VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED=${readKeyState('.env', 'VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED')}`);
report.push(`  VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED=${readKeyState('.env', 'VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED')}`);
report.push(`  VITE_REMOTE_EVIDENCE_ENABLED=${readKeyState('.env', 'VITE_REMOTE_EVIDENCE_ENABLED')}`);
report.push('frontend template');
report.push(`  .env.example -> VITE_SIMULATION_RUNTIME_SHADOW_ENABLED=${readKeyState('.env.example', 'VITE_SIMULATION_RUNTIME_SHADOW_ENABLED')}`);
report.push(`  .env.example -> VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED=${readKeyState('.env.example', 'VITE_SIMULATION_RUNTIME_PRIMARY_ENABLED')}`);
report.push(`  .env.example -> VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED=${readKeyState('.env.example', 'VITE_SIMULATION_RUNTIME_FALLBACK_ENABLED')}`);
report.push(`  .env.example -> VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED=${readKeyState('.env.example', 'VITE_SIMULATION_RUNTIME_EVIDENCE_ENABLED')}`);
report.push(`  .env.example -> VITE_REMOTE_EVIDENCE_ENABLED=${readKeyState('.env.example', 'VITE_REMOTE_EVIDENCE_ENABLED')}`);
report.push('');
report.push('environment files');
for (const file of ['.env', '.env.local', '.env.development', '.env.example', 'backend/.env', 'backend/.env.local', 'backend/.env.development', 'backend/.env.example']) {
  report.push(`  ${file}: ${existsSync(`${repoRoot}/${file}`) ? 'present' : 'absent'}`);
}
report.push('');
report.push('backend env loader');
const backendEnvSource = readText('backend/src/config/env/env.ts') ?? '';
report.push(`  dotenv.config(): ${backendEnvSource.includes('dotenv.config();') ? 'present' : 'not found'}`);
report.push(`  dotenv path override: ${backendEnvSource.includes('path:') ? 'present' : 'absent'}`);
report.push('');
report.push('backend health');
for (const url of ['http://localhost:3001/health', 'http://localhost:4000/health']) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    report.push(`  ${url} -> ${response.status}`);
  } catch (error) {
    report.push(`  ${url} -> failed (${error?.message ?? 'unknown error'})`);
  }
}
report.push('');
report.push('prisma migrate status');
report.push('  <run manually in backend after local env is prepared>');

process.stdout.write(report.join(EOL));
