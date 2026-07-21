#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
artifact_dir="${repo_root}/release/artifact"
schema_dir="${repo_root}/release/schemas"
build_script="${repo_root}/scripts/build/build-frontend.sh"

cd "${repo_root}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

require_cmd bash
require_cmd git
require_cmd node
require_cmd tar
require_cmd sha256sum

[[ -f "${build_script}" ]] || fail "build script not found: ${build_script}"

backend_image="${FINQZ_BACKEND_IMAGE:-}"
[[ -n "${backend_image}" ]] || fail "FINQZ_BACKEND_IMAGE must be set to package the release artifact"

release_environment="${RELEASE_ENVIRONMENT:-production}"
builder_name="${BUILDER_NAME:-Codex}"
recent_commits="$(git log --no-merges -n 5 --pretty=format:'- %h %s' 2>/dev/null || true)"

bash "${build_script}"

commit="$(git rev-parse --short=12 HEAD)"
full_commit="$(git rev-parse HEAD)"
branch="$(git branch --show-current)"
if [[ -z "${branch}" ]]; then
  branch="$(git rev-parse --abbrev-ref HEAD)"
fi
if [[ -z "${branch}" || "${branch}" == "HEAD" ]]; then
  branch="detached-${commit}"
fi

artifact_version="$(git describe --tags --always --dirty --abbrev=12)"
created_at="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
os_name="$(uname -s)"
os_release="$(uname -r)"
node_version="$(node --version)"
npm_version="$(npm --version)"
vite_version="$(node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); const vite = (pkg.devDependencies && pkg.devDependencies.vite) || (pkg.dependencies && pkg.dependencies.vite) || ''; if (!vite) { process.exit(1); } process.stdout.write(vite);")"

mkdir -p "${artifact_dir}/dist" "${schema_dir}"

export ARTIFACT_VERSION="${artifact_version}"
export RELEASE_VERSION="${artifact_version}"
export RELEASE_ENVIRONMENT="${release_environment}"
export GIT_BRANCH="${branch}"
export GIT_COMMIT="${commit}"
export GIT_FULL_COMMIT="${full_commit}"
export CREATED_AT="${created_at}"
export FINQZ_BACKEND_IMAGE="${backend_image}"
export OS_NAME="${os_name}"
export OS_RELEASE="${os_release}"
export NODE_VERSION="${node_version}"
export NPM_VERSION="${npm_version}"
export BUILDER_NAME="${builder_name}"
export VITE_VERSION="${vite_version}"
export RECENT_COMMITS="${recent_commits}"

node <<'NODE'
const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const artifactDir = path.join(repoRoot, 'release', 'artifact');
const manifest = {
  application: 'FINQZ PRO Enterprise',
  artifactVersion: process.env.ARTIFACT_VERSION,
  environment: process.env.RELEASE_ENVIRONMENT,
  branch: process.env.GIT_BRANCH,
  commit: process.env.GIT_COMMIT,
  release: process.env.RELEASE_VERSION,
  createdAt: process.env.CREATED_AT,
  frontend: {
    framework: 'React',
    bundler: 'Vite',
  },
  backend: {
    image: process.env.FINQZ_BACKEND_IMAGE,
  },
};

const buildInfo = {
  os: {
    name: process.env.OS_NAME,
    release: process.env.OS_RELEASE,
  },
  node: process.env.NODE_VERSION,
  npm: process.env.NPM_VERSION,
  git: {
    branch: process.env.GIT_BRANCH,
    commit: process.env.GIT_COMMIT,
    fullCommit: process.env.GIT_FULL_COMMIT,
  },
  utcTimestamp: process.env.CREATED_AT,
  builder: process.env.BUILDER_NAME,
  viteVersion: process.env.VITE_VERSION,
};

fs.mkdirSync(artifactDir, { recursive: true });
fs.writeFileSync(path.join(artifactDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(path.join(artifactDir, 'build-info.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);
fs.writeFileSync(path.join(artifactDir, 'VERSION'), `${process.env.RELEASE_VERSION}\n`);

const notes = [
  '# FINQZ PRO Enterprise Release Notes',
  '',
  `- application: ${manifest.application}`,
  `- artifactVersion: ${manifest.artifactVersion}`,
  `- environment: ${manifest.environment}`,
  `- branch: ${manifest.branch}`,
  `- commit: ${manifest.commit}`,
  `- backendImage: ${manifest.backend.image}`,
  `- createdAt: ${manifest.createdAt}`,
  '',
  '## Recent commits',
  '',
  process.env.RECENT_COMMITS || '- No commit history available.',
  '',
];

fs.writeFileSync(path.join(artifactDir, 'release-notes.md'), `${notes.join('\n')}`);
NODE

cp -R dist "${artifact_dir}/"

tar -czf "${artifact_dir}/frontend-${commit}.tar.gz" -C "${artifact_dir}" dist

(
  cd "${artifact_dir}"
  find . -type f ! -name 'checksums.sha256' -print0 | sort -z | while IFS= read -r -d '' file; do
    sha256sum "${file}"
  done
) > "${artifact_dir}/checksums.sha256"

printf 'Release artifact packaged successfully at %s\n' "${artifact_dir}"
