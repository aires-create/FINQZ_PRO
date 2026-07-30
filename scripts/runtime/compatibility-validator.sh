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
  printf '%s %s [compatibility-validator] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  compatibility-validator.sh --artifact <path|dir> [--output <dir>] [--verbose]
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
  REPO_ROOT="${repo_root}" \
  OUTPUT_DIR="${output_dir}" \
  VERBOSE="${verbose}" \
  node <<'NODE'
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const timestamp = () => new Date().toISOString();
const log = (level, message) => {
  process.stderr.write(`${timestamp()} ${level} [compatibility-validator] ${message}\n`);
};

const artifactPath = process.env.ARTIFACT_PATH;
const artifactRoot = process.env.ARTIFACT_ROOT;
const repoRoot = process.env.REPO_ROOT;
const outputDir = process.env.OUTPUT_DIR;
const warnings = [];
const errors = [];
let status = 'PASS';
let result = 'COMPATIBILITY_OK';
let exitCode = 0;

class ValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const writeJson = (payload) => {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'compatibility-validation.json'), `${JSON.stringify(payload, null, 2)}\n`);
};

const probeCommand = (command, args, required = false) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error) {
    const message = `${command} unavailable: ${result.error.message}`;
    if (required) {
      throw new ValidationError(16, message);
    }
    warnings.push(message);
    return null;
  }

  if (result.status !== 0) {
    const message = `${command} returned exit code ${result.status}`;
    if (required) {
      throw new ValidationError(16, message);
    }
    warnings.push(message);
    return null;
  }

  return (result.stdout || result.stderr || '').trim();
};

try {
  if (!fs.existsSync(artifactRoot)) {
    throw new ValidationError(16, 'artifact root is missing');
  }

  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (Number.isNaN(nodeMajor)) {
    warnings.push('unable to determine Node version');
  } else if (nodeMajor < 20) {
    throw new ValidationError(16, `Node ${process.versions.node} is below the minimum supported version 20`);
  }

  const osInfo = {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
  };

  const diskProbe = spawnSync('df', ['-Pk', artifactRoot], { encoding: 'utf8' });
  let diskInfo = null;
  if (diskProbe.error) {
    warnings.push(`disk probe unavailable: ${diskProbe.error.message}`);
  } else if (diskProbe.status !== 0) {
    warnings.push(`disk probe returned exit code ${diskProbe.status}`);
  } else {
    const lines = diskProbe.stdout.trim().split(/\r?\n/);
    if (lines.length >= 2) {
      const columns = lines[1].trim().split(/\s+/);
      diskInfo = {
        filesystem: columns[0] ?? null,
        blocks: columns[1] ?? null,
        used: columns[2] ?? null,
        available: columns[3] ?? null,
        usePercent: columns[4] ?? null,
        mountPoint: columns[5] ?? null,
      };
    }
  }

  const directoryChecks = ['release', 'scripts', 'logs'].map((name) => {
    const fullPath = path.join(repoRoot, name);
    const exists = fs.existsSync(fullPath);
    const readable = exists ? (() => {
      try {
        fs.accessSync(fullPath, fs.constants.R_OK);
        return true;
      } catch {
        return false;
      }
    })() : false;

    if (!exists) {
      warnings.push(`directory missing: ${name}`);
    } else if (!readable) {
      warnings.push(`directory unreadable: ${name}`);
    }

    return { name, exists, readable };
  });

  const artifactReadable = (() => {
    try {
      fs.accessSync(artifactRoot, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  })();
  if (!artifactReadable) {
    throw new ValidationError(16, 'artifact root is not readable');
  }

  const permissions = {
    artifact: artifactReadable,
    repoRoot: (() => {
      try {
        fs.accessSync(repoRoot, fs.constants.R_OK);
        return true;
      } catch {
        warnings.push('repository root is not readable');
        return false;
      }
    })(),
  };

  const dockerVersion = probeCommand('docker', ['--version'], false);
  const nginxVersion = probeCommand('nginx', ['-v'], false);

  const payload = {
    status,
    timestamp: timestamp(),
    commit: null,
    branch: null,
    artefato: artifactPath,
    resultado: result,
    erros: errors,
    avisos: warnings,
    platform: osInfo,
    disk: diskInfo,
    permissions,
    directories: directoryChecks,
    node: {
      version: process.versions.node,
      minimumSupported: '20',
      satisfied: true,
    },
    docker: dockerVersion ? { available: true, version: dockerVersion } : { available: false },
    nginx: nginxVersion ? { available: true, version: nginxVersion } : { available: false },
  };

  if (process.env.VERBOSE === 'true') {
    log('INFO', `compatibility probes completed for ${artifactPath}`);
  }

  writeJson(payload);
} catch (error) {
  if (error instanceof ValidationError) {
    exitCode = error.code;
  } else {
    exitCode = 16;
  }

  status = 'FAIL';
  result = 'COMPATIBILITY_INVALID';
  const message = error instanceof Error ? error.message : String(error);
  errors.push(message);
  log('ERROR', message);
  writeJson({
    status,
    timestamp: timestamp(),
    commit: null,
    branch: null,
    artefato: artifactPath,
    resultado: result,
    erros: errors,
    avisos: warnings,
    platform: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
    },
    disk: null,
    permissions: {},
    directories: [],
    node: {
      version: process.versions.node,
      minimumSupported: '20',
      satisfied: false,
    },
    docker: { available: false },
    nginx: { available: false },
  });
  process.exit(exitCode);
} finally {
  if (warnings.length > 0 && status === 'PASS') {
    log('WARNING', warnings.join(' | '));
  }
}
NODE
}

main "$@"
