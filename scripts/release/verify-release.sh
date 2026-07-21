#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
artifact_dir="${1:-${repo_root}/release/artifact}"
schema_file="${repo_root}/release/schemas/manifest.schema.json"

cd "${repo_root}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

require_cmd node
require_cmd sha256sum

[[ -d "${artifact_dir}" ]] || fail "artifact directory not found: ${artifact_dir}"
[[ -f "${schema_file}" ]] || fail "manifest schema not found: ${schema_file}"

required_files=(
  "manifest.json"
  "build-info.json"
  "release-notes.md"
  "VERSION"
  "checksums.sha256"
)

for required in "${required_files[@]}"; do
  [[ -f "${artifact_dir}/${required}" ]] || fail "missing required artifact file: ${required}"
done

manifest_commit="$(node -e "const fs = require('fs'); const manifest = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!manifest || typeof manifest.commit !== 'string' || !manifest.commit) { process.exit(1); } process.stdout.write(manifest.commit);" "${artifact_dir}/manifest.json")"
tarball="${artifact_dir}/frontend-${manifest_commit}.tar.gz"
[[ -f "${tarball}" ]] || fail "missing release tarball: frontend-${manifest_commit}.tar.gz"

export SCHEMA_FILE="${schema_file}"
export MANIFEST_FILE="${artifact_dir}/manifest.json"

node <<'NODE'
const fs = require('fs');

const schemaPath = process.env.SCHEMA_FILE;
const manifestPath = process.env.MANIFEST_FILE;
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const required = ['application', 'artifactVersion', 'environment', 'branch', 'commit', 'release', 'createdAt', 'frontend', 'backend'];

for (const key of required) {
  if (!(key in manifest)) {
    throw new Error(`missing manifest key: ${key}`);
  }
}

if (!manifest.frontend || typeof manifest.frontend !== 'object') {
  throw new Error('frontend section invalid');
}

if (!manifest.backend || typeof manifest.backend !== 'object') {
  throw new Error('backend section invalid');
}

if (typeof manifest.frontend.framework !== 'string' || typeof manifest.frontend.bundler !== 'string') {
  throw new Error('frontend values invalid');
}

if (typeof manifest.backend.image !== 'string' || !manifest.backend.image) {
  throw new Error('backend.image invalid');
}

if (schema['$schema'] !== 'https://json-schema.org/draft/2020-12/schema') {
  throw new Error('schema draft mismatch');
}
NODE

(cd "${artifact_dir}" && sha256sum -c checksums.sha256)

printf 'Release artifact verification passed for %s\n' "${artifact_dir}"
