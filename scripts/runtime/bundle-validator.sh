#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
artifact_path=""
output_dir="${repo_root}/release/runtime-validation"
verbose="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [bundle-validator] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  bundle-validator.sh --artifact <path|dir> [--output <dir>] [--verbose]
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
  output_dir="$(resolve_path "${output_dir}")"
  mkdir -p "${output_dir}"

  ARTIFACT_PATH="${artifact_path}" \
  ARTIFACT_ROOT="${artifact_root}" \
  OUTPUT_DIR="${output_dir}" \
  VERBOSE="${verbose}" \
  node <<'NODE'
const fs = require('fs');
const path = require('path');

const timestamp = () => new Date().toISOString();
const log = (level, message) => {
  process.stderr.write(`${timestamp()} ${level} [bundle-validator] ${message}\n`);
};

const artifactPath = process.env.ARTIFACT_PATH;
const artifactRoot = process.env.ARTIFACT_ROOT;
const outputDir = process.env.OUTPUT_DIR;
const warnings = [];
const errors = [];
let status = 'PASS';
let result = 'BUNDLE_OK';
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
    assets: [],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'bundle-validation.json'), `${JSON.stringify(payload, null, 2)}\n`);
};

const getIndexHtml = () => path.join(artifactRoot, 'dist', 'index.html');

const isExternalReference = (ref) => /^(?:https?:)?\/\//i.test(ref) || /^(?:data|mailto|tel):/i.test(ref) || ref.startsWith('#');

const extractReferences = (html) => {
  const references = [];
  const attrRegex = /\b(?:src|href)\s*=\s*["']([^"']+)["']/gi;
  const srcsetRegex = /\bsrcset\s*=\s*["']([^"']+)["']/gi;
  const lines = html.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    let attrMatch;
    attrRegex.lastIndex = 0;
    while ((attrMatch = attrRegex.exec(line)) !== null) {
      references.push({ ref: attrMatch[1], line: lineNumber });
    }

    let srcsetMatch;
    srcsetRegex.lastIndex = 0;
    while ((srcsetMatch = srcsetRegex.exec(line)) !== null) {
      const entries = srcsetMatch[1].split(',');
      for (const entry of entries) {
        const trimmed = entry.trim();
        if (!trimmed) continue;
        const url = trimmed.split(/\s+/)[0];
        if (url) {
          references.push({ ref: url, line: lineNumber });
        }
      }
    }
  });

  return references;
};

try {
  const distDir = path.join(artifactRoot, 'dist');
  const indexHtmlPath = getIndexHtml();

  if (!fs.existsSync(distDir)) {
    throw new ValidationError(11, 'dist directory is missing');
  }

  if (!fs.existsSync(indexHtmlPath)) {
    throw new ValidationError(11, 'dist/index.html is missing');
  }

  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!html.trim()) {
    throw new ValidationError(11, 'dist/index.html is empty');
  }

  const refs = extractReferences(html);
  if (refs.length === 0) {
    warnings.push('no asset references found in index.html');
  }

  const assets = [];
  const missingAssets = [];

  for (const { ref, line } of refs) {
    const normalized = ref.split(/[?#]/)[0];
    if (!normalized || isExternalReference(normalized)) {
      continue;
    }

    const resolvedPath = normalized.startsWith('/')
      ? path.join(distDir, normalized.replace(/^\/+/, ''))
      : path.resolve(distDir, normalized);
    const exists = fs.existsSync(resolvedPath);
    assets.push({
      ref: normalized,
      line,
      path: path.relative(artifactRoot, resolvedPath).replace(/\\/g, '/'),
      exists,
    });

    if (!exists) {
      missingAssets.push(`${normalized} (line ${line})`);
    }
  }

  if (missingAssets.length > 0) {
    throw new ValidationError(13, `missing referenced assets: ${missingAssets.join(', ')}`);
  }

  if (process.env.VERBOSE === 'true') {
    log('INFO', `validated ${assets.length} asset references`);
  }

  const payload = {
    status,
    timestamp: timestamp(),
    commit: null,
    branch: null,
    artefato: artifactPath,
    resultado: result,
    erros: errors,
    avisos: warnings,
    assets,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'bundle-validation.json'), `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(0);
} catch (error) {
  if (error instanceof ValidationError) {
    exitCode = error.code;
    status = 'FAIL';
    result = error.code === 13 ? 'ASSETS_INVALID' : 'BUNDLE_INVALID';
    errors.push(error.message);
    log('ERROR', error.message);
  } else {
    exitCode = 11;
    status = 'FAIL';
    result = 'BUNDLE_INVALID';
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    log('ERROR', message);
  }

  writeJson();
  process.exit(exitCode);
}
NODE
}

main "$@"
