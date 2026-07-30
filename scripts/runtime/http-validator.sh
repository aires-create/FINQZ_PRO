#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
base_url="${RUNTIME_HTTP_BASE_URL:-http://127.0.0.1:4000}"
output_dir="${repo_root}/release/runtime-validation"
verbose="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [http-validator] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  http-validator.sh [--base-url <url>] [--output <dir>] [--verbose]
EOF
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
      --base-url)
        [[ $# -ge 2 ]] || { log_line ERROR "--base-url requires a value"; exit 1; }
        base_url="$2"
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

  output_dir="$(resolve_path "${output_dir}")"
  mkdir -p "${output_dir}"

  BASE_URL="${base_url}" \
  OUTPUT_DIR="${output_dir}" \
  VERBOSE="${verbose}" \
  node <<'NODE'
const fs = require('fs');
const { spawnSync } = require('child_process');

const timestamp = () => new Date().toISOString();
const log = (level, message) => {
  process.stderr.write(`${timestamp()} ${level} [http-validator] ${message}\n`);
};

const baseUrl = new URL(process.env.BASE_URL);
const outputDir = process.env.OUTPUT_DIR;
const warnings = [];
const errors = [];
let status = 'PASS';
let result = 'HTTP_OK';
let exitCode = 0;

class ValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const runProbeCommand = (target) => {
  if (process.platform === 'win32') {
    return spawnSync('powershell.exe', [
      '-NoLogo',
      '-NoProfile',
      '-Command',
      '$ProgressPreference = "SilentlyContinue"; try { $response = Invoke-WebRequest -Uri $env:RUNTIME_VALIDATOR_URL -UseBasicParsing -TimeoutSec 5; Write-Output $response.StatusCode } catch { exit 1 }',
    ], {
      encoding: 'utf8',
      env: {
        ...process.env,
        RUNTIME_VALIDATOR_URL: target,
      },
    });
  }

  return spawnSync('curl', [
    '-sS',
    '--max-time',
    '5',
    '-o',
    '/dev/null',
    '-w',
    '%{http_code}',
    target,
  ], { encoding: 'utf8' });
};

const probe = async (path, required) => {
  const target = new URL(path, baseUrl).toString();
  const probeResult = runProbeCommand(target);

  if (probeResult.error) {
    const message = `${path} is unreachable: ${probeResult.error.message}`;
    if (required) {
      throw new ValidationError(17, message);
    }

    warnings.push(message);
    return { path, url: target, status: null, ok: false, unavailable: true };
  }

  const httpCode = Number.parseInt((probeResult.stdout || '').trim(), 10);
  const status = Number.isFinite(httpCode) ? httpCode : null;
  const ok = status !== null && status >= 200 && status < 400;

  if (required) {
    if (probeResult.status !== 0 || !ok) {
      throw new ValidationError(17, `${path} returned ${status ?? 'unreachable'}`);
    }
    return { path, url: target, status, ok: true };
  }

  if (probeResult.status !== 0 || !ok) {
    warnings.push(`${path} returned ${status ?? 'unavailable'}`);
  }

  return { path, url: target, status, ok };
};

const writeJson = (payload) => {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(`${outputDir}/http-validation.json`, `${JSON.stringify(payload, null, 2)}\n`);
};

(async () => {
  try {
    const root = await probe('/', true);
    const health = await probe('/health', false);
    const ready = await probe('/ready', false);

    const payload = {
      status,
      timestamp: timestamp(),
      commit: null,
      branch: null,
      artefato: baseUrl.toString(),
      resultado: result,
      erros: errors,
      avisos: warnings,
      endpoints: {
        root,
        health,
        ready,
      },
    };

    if (process.env.VERBOSE === 'true') {
      log('INFO', `root probe completed for ${root.url}`);
    }

    writeJson(payload);
  } catch (error) {
    exitCode = error instanceof ValidationError ? error.code : 17;
    status = 'FAIL';
    result = 'HTTP_INVALID';
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    log('ERROR', message);
    writeJson({
      status,
      timestamp: timestamp(),
      commit: null,
      branch: null,
      artefato: baseUrl.toString(),
      resultado: result,
      erros: errors,
      avisos: warnings,
      endpoints: {},
    });
    process.exit(exitCode);
    return;
  }

  if (warnings.length > 0) {
    log('WARNING', warnings.join(' | '));
  }

  process.exit(0);
})();
NODE
}

main "$@"
