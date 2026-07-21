#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
schema_file="${repo_root}/release/schemas/manifest.schema.json"
output_dir="${repo_root}/release/deploy-engine"
artifact_path=""
manifest_path=""
verbose="false"

commit=""
branch=""
artifact_dir=""
report_status="SUCCESS"
report_result="SMOKE_OK"
declare -a report_errors=()
declare -a report_warnings=()

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [smoke-engine] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

log_info() { log_line INFO "$*"; }
log_warning() { report_warnings+=("$*"); log_line WARNING "$*"; }
log_error() { report_errors+=("$*"); report_status="FAILURE"; report_result="SMOKE_FAILED"; log_line ERROR "$*"; }
log_success() { log_line SUCCESS "$*"; }

usage() {
  cat <<'EOF'
Usage:
  smoke-engine.sh --artifact <path.tar.gz> [--manifest <path>] [--output <dir>] [--verbose]

Required:
  --artifact <path.tar.gz>  Path to the release tarball used as the smoke anchor.

Optional:
  --manifest <path>         Path to manifest.json. Defaults to the sibling manifest.json.
  --output <dir>            Directory for artifact-validation.json.
  --verbose                 Emit additional structured log lines.
  --help                    Show this help message.
EOF
}

fail() {
  log_error "$1"
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

resolve_abs_path() {
  local candidate="$1"
  local parent_dir
  parent_dir="$(cd "$(dirname "${candidate}")" && pwd)"
  printf '%s/%s' "${parent_dir}" "$(basename "${candidate}")"
}

collect_git_context() {
  commit="$(git -C "${repo_root}" rev-parse --short=12 HEAD)"
  branch="$(git -C "${repo_root}" branch --show-current)"
  if [[ -z "${branch}" ]]; then
    branch="$(git -C "${repo_root}" rev-parse --abbrev-ref HEAD)"
  fi
  if [[ -z "${branch}" || "${branch}" == "HEAD" ]]; then
    branch="detached-${commit}"
  fi
}

validate_manifest() {
  if ! SCHEMA_PATH="${schema_file}" MANIFEST_PATH="${manifest_path}" node <<'NODE'
const fs = require('fs');

const schemaPath = process.env.SCHEMA_PATH;
const manifestPath = process.env.MANIFEST_PATH;
try {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const required = [
    'artifactVersion',
    'commit',
    'branch',
    'createdAt',
    'environment',
    'frontend',
    'backend',
  ];

  if (schema['$schema'] !== 'https://json-schema.org/draft/2020-12/schema') {
    throw new Error('manifest schema draft mismatch');
  }

  for (const key of required) {
    if (!(key in manifest)) {
      throw new Error(`missing required manifest field: ${key}`);
    }
  }

  if (!manifest.frontend || typeof manifest.frontend !== 'object') {
    throw new Error('frontend manifest section is invalid');
  }

  if (!manifest.backend || typeof manifest.backend !== 'object') {
    throw new Error('backend manifest section is invalid');
  }

  if (typeof manifest.frontend.framework !== 'string' || !manifest.frontend.framework) {
    throw new Error('frontend.framework is invalid');
  }

  if (typeof manifest.frontend.bundler !== 'string' || !manifest.frontend.bundler) {
    throw new Error('frontend.bundler is invalid');
  }

  if (typeof manifest.backend.image !== 'string' || !manifest.backend.image) {
    throw new Error('backend.image is invalid');
  }

  if (manifest.runtimeCompatibility !== undefined) {
    const type = typeof manifest.runtimeCompatibility;
    if (type !== 'object' && type !== 'string') {
      throw new Error('runtimeCompatibility must be an object or string when present');
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
NODE
  then
    fail "manifest validation failed"
  fi
}

write_json_report() {
  local report_path="$1"
  local report_result_value="$2"
  local report_status_value="$3"
  local report_errors_text="$4"
  local report_warnings_text="$5"
  local report_details_json="$6"

  REPORT_PATH="${report_path}" \
  REPORT_STATUS="${report_status_value}" \
  REPORT_RESULT="${report_result_value}" \
  REPORT_TIMESTAMP="$(timestamp_utc)" \
  REPORT_COMMIT="${commit}" \
  REPORT_BRANCH="${branch}" \
  REPORT_ARTIFACT="${artifact_path}" \
  REPORT_ERRORS_TEXT="${report_errors_text}" \
  REPORT_WARNINGS_TEXT="${report_warnings_text}" \
  REPORT_DETAILS_JSON="${report_details_json}" \
  node <<'NODE'
const fs = require('fs');

const splitLines = (text) => {
  if (!text) {
    return [];
  }
  return text.split('\n').filter(Boolean);
};

const payload = {
  status: process.env.REPORT_STATUS,
  timestamp: process.env.REPORT_TIMESTAMP,
  commit: process.env.REPORT_COMMIT,
  branch: process.env.REPORT_BRANCH,
  artefato: process.env.REPORT_ARTIFACT,
  resultado: process.env.REPORT_RESULT,
  erros: splitLines(process.env.REPORT_ERRORS_TEXT),
  avisos: splitLines(process.env.REPORT_WARNINGS_TEXT),
};

if (process.env.REPORT_DETAILS_JSON) {
  payload.detalhes = JSON.parse(process.env.REPORT_DETAILS_JSON);
}

fs.mkdirSync(require('path').dirname(process.env.REPORT_PATH), { recursive: true });
fs.writeFileSync(process.env.REPORT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
NODE
}

main() {
  require_cmd bash
  require_cmd git
  require_cmd node
  require_cmd tar
  require_cmd sha256sum

  while (($#)); do
    case "$1" in
      --artifact)
        [[ $# -ge 2 ]] || fail "--artifact requires a value"
        artifact_path="$2"
        shift 2
        ;;
      --manifest)
        [[ $# -ge 2 ]] || fail "--manifest requires a value"
        manifest_path="$2"
        shift 2
        ;;
      --output)
        [[ $# -ge 2 ]] || fail "--output requires a value"
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
        fail "unknown argument: $1"
        ;;
    esac
  done

  [[ -n "${artifact_path}" ]] || fail "--artifact is required"
  artifact_path="$(resolve_abs_path "${artifact_path}")"
  output_dir="$(resolve_abs_path "${output_dir}")"
  mkdir -p "${output_dir}"
  collect_git_context

  artifact_dir="$(cd "$(dirname "${artifact_path}")" && pwd)"
  if [[ -z "${manifest_path}" ]]; then
    manifest_path="${artifact_dir}/manifest.json"
  else
    manifest_path="$(resolve_abs_path "${manifest_path}")"
  fi

  if [[ ! -f "${artifact_path}" ]]; then
    fail "artifact file does not exist: ${artifact_path}"
  fi

  if [[ ! -f "${manifest_path}" ]]; then
    fail "manifest file does not exist: ${manifest_path}"
  fi

  if [[ ! -d "${artifact_dir}/dist" ]]; then
    fail "dist directory not found next to artifact: ${artifact_dir}/dist"
  fi

  local required_files=(
    "dist/index.html"
    "checksums.sha256"
  )

  local relative_file
  for relative_file in "${required_files[@]}"; do
    if [[ ! -e "${artifact_dir}/${relative_file}" ]]; then
      fail "required smoke component missing: ${relative_file}"
    fi
  done

  if [[ "${verbose}" == "true" ]]; then
    log_info "smoke validating ${artifact_path}"
  fi

  validate_manifest

  if ! (cd "${artifact_dir}" && sha256sum -c checksums.sha256); then
    fail "checksum validation failed"
  fi

  local details_json
  details_json="$(node -e "const fs = require('fs'); const path = process.argv[1]; const payload = { distExists: fs.existsSync(path + '/dist'), indexHtmlExists: fs.existsSync(path + '/dist/index.html'), manifestExists: fs.existsSync(path + '/manifest.json'), checksumsExists: fs.existsSync(path + '/checksums.sha256') }; process.stdout.write(JSON.stringify(payload));" "${artifact_dir}")"

  write_json_report \
    "${output_dir}/artifact-validation.json" \
    "${report_result}" \
    "${report_status}" \
    "$(printf '%s\n' "${report_errors[@]-}")" \
    "$(printf '%s\n' "${report_warnings[@]-}")" \
    "${details_json}"

  log_success "smoke validation completed"
}

main "$@"
