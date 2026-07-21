#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
output_dir="${repo_root}/release/deploy-engine"
artifact_path=""
verbose="false"

commit=""
branch=""
report_status="SUCCESS"
report_result="RUNTIME_OK"
declare -a report_errors=()
declare -a report_warnings=()

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [verify-runtime] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

log_info() { log_line INFO "$*"; }
log_warning() { report_warnings+=("$*"); log_line WARNING "$*"; }
log_error() { report_errors+=("$*"); report_status="FAILURE"; report_result="RUNTIME_FAILED"; log_line ERROR "$*"; }
log_success() { log_line SUCCESS "$*"; }

usage() {
  cat <<'EOF'
Usage:
  verify-runtime.sh --artifact <path.tar.gz> [--output <dir>] [--verbose]

Required:
  --artifact <path.tar.gz>  Path to the release tarball used as the runtime anchor.

Optional:
  --output <dir>            Directory for runtime-check.json.
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

on_exit() {
  local exit_code="$1"
  if [[ "${exit_code}" -ne 0 ]]; then
    log_warning "runtime verification exited with a non-zero code"
  fi
}

main() {
  require_cmd bash
  require_cmd git
  require_cmd node
  require_cmd df
  require_cmd stat

  while (($#)); do
    case "$1" in
      --artifact)
        [[ $# -ge 2 ]] || fail "--artifact requires a value"
        artifact_path="$2"
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

  if [[ ! -f "${artifact_path}" ]]; then
    fail "artifact file does not exist: ${artifact_path}"
  fi

  if [[ ! -r "${artifact_path}" ]]; then
    fail "artifact file is not readable: ${artifact_path}"
  fi

  local runtime_dirs=("release" "scripts" "logs")
  local runtime_dir
  for runtime_dir in "${runtime_dirs[@]}"; do
    if [[ ! -d "${repo_root}/${runtime_dir}" ]]; then
      fail "expected runtime directory missing: ${runtime_dir}"
    fi
    if [[ ! -r "${repo_root}/${runtime_dir}" ]]; then
      fail "expected runtime directory is not readable: ${runtime_dir}"
    fi
  done

  local disk_report
  disk_report="$(df -Pk "${repo_root}")"
  if [[ "${verbose}" == "true" ]]; then
    log_info "disk usage probe completed"
    printf '%s\n' "${disk_report}" >&2
  fi

  local perms_report
  perms_report="$(stat -c '%A %U %G %n' "${repo_root}" "${repo_root}/release" "${repo_root}/scripts" "${repo_root}/logs")"
  if [[ "${verbose}" == "true" ]]; then
    log_info "permission probe completed"
    printf '%s\n' "${perms_report}" >&2
  fi

  local details_json
  details_json="$(node -e "const fs = require('fs'); const repo = process.argv[1]; const artifact = process.argv[2]; const disk = process.argv[3]; const perms = process.argv[4]; const payload = { structure: { release: fs.existsSync(repo + '/release'), scripts: fs.existsSync(repo + '/scripts'), logs: fs.existsSync(repo + '/logs') }, artifactAccessible: fs.existsSync(artifact) && fs.statSync(artifact).isFile(), diskProbe: disk.split('\\n').slice(0, 2), permissionProbe: perms.split('\\n') }; process.stdout.write(JSON.stringify(payload));" "${repo_root}" "${artifact_path}" "${disk_report}" "${perms_report}")"

  write_json_report \
    "${output_dir}/runtime-check.json" \
    "${report_result}" \
    "${report_status}" \
    "$(printf '%s\n' "${report_errors[@]-}")" \
    "$(printf '%s\n' "${report_warnings[@]-}")" \
    "${details_json}"

  log_success "runtime verification completed"
}

trap 'on_exit "$?"' EXIT
main "$@"
