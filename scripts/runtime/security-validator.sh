#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
artifact_path=""
artifact_environment="${RUNTIME_ENVIRONMENT:-production}"
output_dir="${repo_root}/release/runtime-validation"
verbose="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [security-validator] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  security-validator.sh --artifact <path|dir> [--environment <name>] [--output <dir>] [--verbose]
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
      --environment)
        [[ $# -ge 2 ]] || { log_line ERROR "--environment requires a value"; exit 1; }
        artifact_environment="$2"
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
  ARTIFACT_ENVIRONMENT="${artifact_environment}" \
  OUTPUT_DIR="${output_dir}" \
  VERBOSE="${verbose}" \
  node <<'NODE'
const fs = require('fs');
const path = require('path');

const timestamp = () => new Date().toISOString();
const log = (level, message) => {
  process.stderr.write(`${timestamp()} ${level} [security-validator] ${message}\n`);
};

const artifactPath = process.env.ARTIFACT_PATH;
const artifactRoot = process.env.ARTIFACT_ROOT;
const environment = String(process.env.ARTIFACT_ENVIRONMENT || 'production').toLowerCase();
const outputDir = process.env.OUTPUT_DIR;
const warnings = [];
const errors = [];
const findings = [];
let status = 'PASS';
let result = 'SECURITY_OK';
let exitCode = 0;

class ValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const textExtensions = new Set(['.html', '.js', '.mjs', '.css', '.json', '.md', '.txt', '.svg', '.map', '.ts', '.tsx', '.yml', '.yaml']);
const sensitiveEnvironment = ['production', 'hml'].includes(environment);

const ruleSeverity = {
  LOCALHOST: sensitiveEnvironment ? 'ERROR' : 'WARNING',
  LOOPBACK: sensitiveEnvironment ? 'ERROR' : 'WARNING',
  DEV_URL: sensitiveEnvironment ? 'ERROR' : 'WARNING',
  DEV_FLAG: sensitiveEnvironment ? 'ERROR' : 'WARNING',
  SECRET: 'ERROR',
  BEARER: 'ERROR',
  EVAL: 'ERROR',
  DEBUGGER: 'ERROR',
  CONSOLE_ERROR: 'WARNING',
  UNHANDLED_PROMISE: 'WARNING',
  REFERENCE_ERROR: 'WARNING',
  TYPE_ERROR: 'WARNING',
};

const patterns = [
  { id: 'LOCALHOST', regex: /\blocalhost\b/i, message: 'localhost reference found' },
  { id: 'LOOPBACK', regex: /\b127\.0\.0\.1\b/i, message: 'loopback reference found' },
  { id: 'DEV_URL', regex: /\bhttps?:\/\/[^"'`\s]*\bdev\b[^"'`\s]*/i, message: 'development URL reference found' },
  { id: 'DEV_FLAG', regex: /\bVITE_(?:DEV_MODE|USE_MOCKS|ENABLE_LEGACY_AUTH_FALLBACK)\s*=\s*true\b/i, message: 'development flag enabled in artifact' },
  { id: 'SECRET', regex: /\b(?:api[_-]?key|secret|password|token)\b\s*[:=]\s*["']?[A-Za-z0-9._\-+/=]{8,}/i, message: 'potential secret material detected' },
  { id: 'BEARER', regex: /\bBearer\s+[A-Za-z0-9._\-+/=]{10,}\b/, message: 'hardcoded bearer token detected' },
  { id: 'CONSOLE_ERROR', regex: /\bconsole\.error\b/, message: 'console.error present in bundle' },
  { id: 'UNHANDLED_PROMISE', regex: /\bUnhandledPromise\b/, message: 'UnhandledPromise text present in bundle' },
  { id: 'REFERENCE_ERROR', regex: /\bReferenceError\b/, message: 'ReferenceError text present in bundle' },
  { id: 'TYPE_ERROR', regex: /\bTypeError\b/, message: 'TypeError text present in bundle' },
  { id: 'EVAL', regex: /\beval\s*\(/, message: 'eval usage detected' },
  { id: 'DEBUGGER', regex: /\bdebugger\b/, message: 'debugger statement detected' },
];

const walkFiles = (root) => {
  const stack = [root];
  const files = [];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }
  return files;
};

const shouldScan = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return textExtensions.has(ext) || path.basename(filePath) === 'VERSION' || path.basename(filePath) === 'checksums.sha256';
};

const recordFinding = (severity, rule, filePath, lineNumber, message, snippet) => {
  const finding = {
    severity,
    rule,
    file: path.relative(artifactRoot, filePath).replace(/\\/g, '/'),
    line: lineNumber,
    message,
  };

  if (snippet) {
    finding.snippet = snippet.trim();
  }

  findings.push(finding);
  const entry = `${finding.file}:${lineNumber} ${message}`;

  if (severity === 'ERROR') {
    errors.push(entry);
  } else {
    warnings.push(entry);
  }
};

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
    findings,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'security-validation.json'), `${JSON.stringify(payload, null, 2)}\n`);
};

try {
  if (!fs.existsSync(artifactRoot)) {
    throw new ValidationError(15, 'artifact root is missing');
  }

  for (const filePath of walkFiles(artifactRoot)) {
    if (!shouldScan(filePath)) {
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          recordFinding(ruleSeverity[pattern.id], pattern.id, filePath, lineNumber, pattern.message, line);
        }
        pattern.regex.lastIndex = 0;
      }
    });
  }

  if (findings.some((finding) => finding.severity === 'ERROR')) {
    throw new ValidationError(15, 'security validation found blocking issues');
  }

  if (process.env.VERBOSE === 'true') {
    log('INFO', `scanned ${findings.length} security findings`);
  }
} catch (error) {
  if (error instanceof ValidationError) {
    exitCode = error.code;
    status = 'FAIL';
    result = 'SECURITY_INVALID';
    if (errors.length === 0) {
      errors.push(error.message);
    }
    log('ERROR', error.message);
  } else {
    exitCode = 15;
    status = 'FAIL';
    result = 'SECURITY_INVALID';
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    log('ERROR', message);
  }
} finally {
  writeJson();
  if (exitCode !== 0) {
    process.exit(exitCode);
  } else if (warnings.length > 0) {
    log('WARNING', warnings.join(' | '));
  }
}
NODE
}

main "$@"
