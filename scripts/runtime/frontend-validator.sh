#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
schema_file="${repo_root}/release/schemas/manifest.schema.json"
artifact_path=""
manifest_path=""
output_dir="${repo_root}/release/runtime-validation"
verbose="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [frontend-validator] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  frontend-validator.sh --artifact <path|dir> [--manifest <path>] [--output <dir>] [--verbose]
EOF
}

resolve_root() {
  local candidate="$1"
  if [[ -d "${candidate}" ]]; then
    printf '%s' "${candidate}"
    return
  fi

  printf '%s' "$(cd "$(dirname "${candidate}")" && pwd)"
}

resolve_path() {
  local candidate="$1"
  if [[ -e "${candidate}" ]]; then
    printf '%s' "${candidate}"
  else
    printf '%s' "$(cd "$(dirname "${candidate}")" && pwd)/$(basename "${candidate}")"
  fi
}

main() {
  while (($#)); do
    case "$1" in
      --artifact)
        [[ $# -ge 2 ]] || { log_line ERROR "--artifact requires a value"; exit 1; }
        artifact_path="$2"
        shift 2
        ;;
      --manifest)
        [[ $# -ge 2 ]] || { log_line ERROR "--manifest requires a value"; exit 1; }
        manifest_path="$2"
        shift 2
        ;;
      --output)
        [[ $# -ge 2 ]] || { log_line ERROR "--output requires a value"; exit 1; }
        output_dir="$2"
        shift 2
        ;;
      --verbose)
        verbose="true"
        shift
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        log_line ERROR "unknown argument: $1"
        exit 1
        ;;
    esac
  done

  [[ -n "${artifact_path}" ]] || { log_line ERROR "--artifact is required"; exit 1; }

  artifact_path="$(resolve_path "${artifact_path}")"
  artifact_root="$(resolve_root "${artifact_path}")"
  if [[ -z "${manifest_path}" ]]; then
    manifest_path="${artifact_root}/manifest.json"
  else
    manifest_path="$(resolve_path "${manifest_path}")"
  fi

  output_dir="$(resolve_path "${output_dir}")"
  mkdir -p "${output_dir}"

  ARTIFACT_PATH="${artifact_path}" \
  ARTIFACT_ROOT="${artifact_root}" \
  MANIFEST_PATH="${manifest_path}" \
  OUTPUT_DIR="${output_dir}" \
  SCHEMA_FILE="${schema_file}" \
  VERBOSE="${verbose}" \
  node <<'NODE'
const fs = require('fs');
const path = require('path');

const timestamp = () => new Date().toISOString();
const log = (level, message) => {
  process.stderr.write(`${timestamp()} ${level} [frontend-validator] ${message}\n`);
};

const artifactPath = process.env.ARTIFACT_PATH;
const artifactRoot = process.env.ARTIFACT_ROOT;
const manifestPath = process.env.MANIFEST_PATH;
const outputDir = process.env.OUTPUT_DIR;
const schemaFile = process.env.SCHEMA_FILE;
const warnings = [];
const errors = [];
let status = 'PASS';
let result = 'FRONTEND_OK';
let exitCode = 0;

class ValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const writeJson = () => {
  const payload = {
    status,
    timestamp: timestamp(),
    commit: null,
    branch: null,
    artefato: artifactPath,
    resultado: result,
    erros: errors,
    avisos: warnings,
    files: {
      dist: fs.existsSync(path.join(artifactRoot, 'dist')),
      indexHtml: fs.existsSync(path.join(artifactRoot, 'dist', 'index.html')),
      version: fs.existsSync(path.join(artifactRoot, 'VERSION')),
      manifest: fs.existsSync(manifestPath),
      buildInfo: fs.existsSync(path.join(artifactRoot, 'build-info.json')),
      releaseNotes: fs.existsSync(path.join(artifactRoot, 'release-notes.md')),
      checksums: fs.existsSync(path.join(artifactRoot, 'checksums.sha256')),
    },
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'frontend-validation.json'), `${JSON.stringify(payload, null, 2)}\n`);
};

try {
  const requiredFiles = [
    ['dist', path.join(artifactRoot, 'dist')],
    ['index.html', path.join(artifactRoot, 'dist', 'index.html')],
    ['VERSION', path.join(artifactRoot, 'VERSION')],
    ['manifest.json', manifestPath],
    ['build-info.json', path.join(artifactRoot, 'build-info.json')],
    ['release-notes.md', path.join(artifactRoot, 'release-notes.md')],
    ['checksums.sha256', path.join(artifactRoot, 'checksums.sha256')],
  ];

  const missing = requiredFiles.filter(([, filePath]) => !fs.existsSync(filePath));
  if (missing.length > 0) {
    const missingNames = missing.map(([name]) => name);
    const missingManifest = missingNames.includes('manifest.json');
    const code = missingManifest ? 12 : 10;
    throw new ValidationError(code, `missing required frontend artifact files: ${missingNames.join(', ')}`);
  }

  const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));
  if (schema['$schema'] !== 'https://json-schema.org/draft/2020-12/schema') {
    throw new ValidationError(12, 'manifest schema draft mismatch');
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const requiredManifestKeys = [
    'application',
    'artifactVersion',
    'environment',
    'branch',
    'commit',
    'release',
    'createdAt',
    'frontend',
    'backend',
  ];

  for (const key of requiredManifestKeys) {
    if (!(key in manifest)) {
      throw new ValidationError(12, `missing required manifest field: ${key}`);
    }
  }

  if (!manifest.frontend || typeof manifest.frontend !== 'object') {
    throw new ValidationError(12, 'frontend manifest section is invalid');
  }

  if (!manifest.backend || typeof manifest.backend !== 'object') {
    throw new ValidationError(12, 'backend manifest section is invalid');
  }

  if (typeof manifest.frontend.framework !== 'string' || !manifest.frontend.framework) {
    throw new ValidationError(12, 'frontend.framework is invalid');
  }

  if (typeof manifest.frontend.bundler !== 'string' || !manifest.frontend.bundler) {
    throw new ValidationError(12, 'frontend.bundler is invalid');
  }

  if (typeof manifest.backend.image !== 'string' || !manifest.backend.image) {
    throw new ValidationError(12, 'backend.image is invalid');
  }

  if (manifest.runtimeCompatibility !== undefined) {
    const type = typeof manifest.runtimeCompatibility;
    if (type !== 'object' && type !== 'string') {
      throw new ValidationError(12, 'runtimeCompatibility must be an object or string when present');
    }
  }

  const buildInfo = JSON.parse(fs.readFileSync(path.join(artifactRoot, 'build-info.json'), 'utf8'));
  if (typeof buildInfo !== 'object' || buildInfo === null) {
    throw new ValidationError(10, 'build-info.json is invalid');
  }

  if (!fs.readFileSync(path.join(artifactRoot, 'VERSION'), 'utf8').trim()) {
    throw new ValidationError(10, 'VERSION is empty');
  }

  if (!fs.readFileSync(path.join(artifactRoot, 'release-notes.md'), 'utf8').trim()) {
    warnings.push('release-notes.md is empty');
  }

  if (!fs.readFileSync(path.join(artifactRoot, 'checksums.sha256'), 'utf8').trim()) {
    throw new ValidationError(10, 'checksums.sha256 is empty');
  }

  if (process.env.VERBOSE === 'true') {
    log('INFO', `validated artifact ${artifactPath}`);
  }
} catch (error) {
  if (error instanceof ValidationError) {
    exitCode = error.code;
    status = 'FAIL';
    result = error.code === 12 ? 'MANIFEST_INVALID' : 'FRONTEND_INVALID';
    errors.push(error.message);
    log('ERROR', error.message);
  } else {
    exitCode = 10;
    status = 'FAIL';
    result = 'FRONTEND_INVALID';
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    log('ERROR', message);
  }
} finally {
  writeJson();
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}
NODE
}

main "$@"
