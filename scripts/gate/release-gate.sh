#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

artifact_path=""
policy_path="${repo_root}/release/policies/release-gate-policy.json"
output_base="${repo_root}/release/gate"
environment=""
dry_run="false"
strict="false"
explain="false"
verbose="false"
skip_http="false"

correlation_id=""
output_dir=""
state_dir=""
branch=""
commit=""
tree_dirty="false"
artifact_version="unknown"
artifact_sha256="unknown"
policy_version="unknown"
policy_hash="unknown"
started_at=""
finished_at=""
release_verification_exit=0
deploy_dry_run_exit=0
runtime_validation_exit=0
aggregator_exit=0
policy_exit=0
report_exit=0

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

now_ms() {
  node -e "process.stdout.write(String(Date.now()))"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [%s] %s\n' "$(timestamp_utc)" "${level}" "${correlation_id:-gate-bootstrap}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  release-gate.sh --artifact <arquivo.tar.gz> [--policy <release-gate-policy.json>] [--output <diretório>] [--environment <local|hml|production>] --dry-run [--strict] [--explain] [--verbose] [--skip-http]
EOF
}

fail() {
  local code="$1"
  shift
  log_line ERROR "$*"
  exit "${code}"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail 20 "required command not found: $1"
}

resolve_abs_path() {
  local candidate="$1"
  local parent_dir
  parent_dir="$(cd "$(dirname "${candidate}")" && pwd)"
  printf '%s/%s' "${parent_dir}" "$(basename "${candidate}")"
}

is_safe_output_base() {
  local candidate="$1"
  case "${candidate}" in
    "${repo_root}"|"${repo_root}"/*)
      [[ "${candidate}" != "${repo_root}" ]]
      ;;
    *)
      return 1
      ;;
  esac
}

collect_git_context() {
  commit="$(git -C "${repo_root}" rev-parse --short=7 HEAD)"
  branch="$(git -C "${repo_root}" branch --show-current)"
  if [[ -z "${branch}" ]]; then
    branch="$(git -C "${repo_root}" rev-parse --abbrev-ref HEAD)"
  fi
  if [[ -z "${branch}" || "${branch}" == "HEAD" ]]; then
    branch="detached-${commit}"
  fi
  if [[ -n "$(git -C "${repo_root}" status --porcelain --untracked-files=all)" ]]; then
    tree_dirty="true"
  else
    tree_dirty="false"
  fi
}

compute_artifact_version() {
  local manifest_path="$1"
  if [[ ! -f "${manifest_path}" ]]; then
    artifact_version="unknown"
    return
  fi

  artifact_version="$(MANIFEST_PATH="${manifest_path}" node <<'NODE'
const fs = require('fs');
try {
  const manifest = JSON.parse(fs.readFileSync(process.env.MANIFEST_PATH, 'utf8'));
  process.stdout.write(String(manifest.artifactVersion || manifest.release || 'unknown'));
} catch {
  process.stdout.write('unknown');
}
NODE
)"
}

compute_sha256() {
  local file_path="$1"
  artifact_sha256="$(sha256sum "${file_path}" | awk '{print $1}')"
}

write_stage_record() {
  local record_path="$1"
  local stage_name="$2"
  local command_string="$3"
  local exit_code="$4"
  local started_at_value="$5"
  local finished_at_value="$6"
  local duration_ms_value="$7"
  local stdout_text="$8"
  local stderr_text="$9"
  local evidence_json="${10}"
  local status_hint="${11}"
  local warnings_json="${12}"
  local errors_json="${13}"
  local log_file="${14}"

  RECORD_PATH="${record_path}" \
  STAGE_NAME="${stage_name}" \
  STAGE_COMMAND="${command_string}" \
  STAGE_EXIT_CODE="${exit_code}" \
  STAGE_STARTED_AT="${started_at_value}" \
  STAGE_FINISHED_AT="${finished_at_value}" \
  STAGE_DURATION_MS="${duration_ms_value}" \
  STAGE_STDOUT="${stdout_text}" \
  STAGE_STDERR="${stderr_text}" \
  STAGE_EVIDENCE_JSON="${evidence_json}" \
  STAGE_STATUS_HINT="${status_hint}" \
  STAGE_WARNINGS_JSON="${warnings_json}" \
  STAGE_ERRORS_JSON="${errors_json}" \
  STAGE_LOG_FILE="${log_file}" \
  STAGE_BRANCH="${branch}" \
  STAGE_COMMIT="${commit}" \
  STAGE_TREE_DIRTY="${tree_dirty}" \
  STAGE_ARTIFACT_PATH="${artifact_path}" \
  STAGE_ENVIRONMENT="${environment}" \
  STAGE_STRICT="${strict}" \
  STAGE_SKIP_HTTP="${skip_http}" \
  STAGE_CORRELATION_ID="${correlation_id}" \
  node <<'NODE'
const fs = require('fs');
const path = require('path');

const parseJsonArray = (text) => {
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
};

const payload = {
  releaseGateVersion: '1.0.0',
  correlationId: process.env.STAGE_CORRELATION_ID,
  stage: process.env.STAGE_NAME,
  command: process.env.STAGE_COMMAND,
  startedAt: process.env.STAGE_STARTED_AT,
  finishedAt: process.env.STAGE_FINISHED_AT,
  durationMs: Number(process.env.STAGE_DURATION_MS || 0),
  exitCode: Number(process.env.STAGE_EXIT_CODE || 0),
  statusHint: process.env.STAGE_STATUS_HINT,
  stdout: process.env.STAGE_STDOUT || '',
  stderr: process.env.STAGE_STDERR || '',
  logFile: process.env.STAGE_LOG_FILE,
  warnings: parseJsonArray(process.env.STAGE_WARNINGS_JSON),
  errors: parseJsonArray(process.env.STAGE_ERRORS_JSON),
  evidenceFiles: parseJsonArray(process.env.STAGE_EVIDENCE_JSON),
  git: {
    branch: process.env.STAGE_BRANCH,
    commit: process.env.STAGE_COMMIT,
    treeDirty: process.env.STAGE_TREE_DIRTY === 'true',
  },
  artifact: {
    path: process.env.STAGE_ARTIFACT_PATH,
  },
  environment: process.env.STAGE_ENVIRONMENT,
  strict: process.env.STAGE_STRICT === 'true',
  skipHttp: process.env.STAGE_SKIP_HTTP === 'true',
};

fs.mkdirSync(path.dirname(process.env.RECORD_PATH), { recursive: true });
fs.writeFileSync(process.env.RECORD_PATH, `${JSON.stringify(payload, null, 2)}\n`);
NODE
}

extract_lines() {
  local kind="$1"
  local file_path="$2"
  node -e "const fs=require('fs'); const kind=process.argv[1]; const text=fs.readFileSync(process.argv[2], 'utf8'); const lines=text.split(/\\r?\\n/).filter((line)=>line.includes(kind)); process.stdout.write(JSON.stringify(lines));" "${kind}" "${file_path}"
}

run_logged_stage() {
  local stage_name="$1"
  local record_file="$2"
  local log_file="$3"
  local status_hint="$4"
  local evidence_json="$5"
  shift 5

  local command_string="$*"
  local stdout_file stderr_file start_ms end_ms duration_ms started_at finished_at exit_code stdout_text stderr_text warnings_json errors_json
  stdout_file="$(mktemp)"
  stderr_file="$(mktemp)"
  started_at="$(timestamp_utc)"
  start_ms="$(now_ms)"

  set +e
  "$@" > >(tee "${stdout_file}") 2> >(tee "${stderr_file}" >&2)
  exit_code=$?
  set -e

  finished_at="$(timestamp_utc)"
  end_ms="$(now_ms)"
  duration_ms=$((end_ms - start_ms))

  {
    printf '%s\n' ">>> STDOUT"
    cat "${stdout_file}"
    printf '\n%s\n' ">>> STDERR"
    cat "${stderr_file}"
    printf '\n'
  } > "${log_file}"

  stdout_text="$(cat "${stdout_file}")"
  stderr_text="$(cat "${stderr_file}")"
  warnings_json="$(extract_lines WARNING "${stderr_file}")"
  errors_json="$(extract_lines ERROR "${stderr_file}")"

  rm -f "${stdout_file}" "${stderr_file}"

  write_stage_record \
    "${record_file}" \
    "${stage_name}" \
    "${command_string}" \
    "${exit_code}" \
    "${started_at}" \
    "${finished_at}" \
    "${duration_ms}" \
    "${stdout_text}" \
    "${stderr_text}" \
    "${evidence_json}" \
    "${status_hint}" \
    "${warnings_json}" \
    "${errors_json}" \
    "${log_file}"

  case "${stage_name}" in
    releaseVerification)
      release_verification_exit="${exit_code}"
      ;;
    deployDryRun)
      deploy_dry_run_exit="${exit_code}"
      ;;
    runtimeValidation)
      runtime_validation_exit="${exit_code}"
      ;;
  esac
}

prepare_output_dir() {
  if [[ ! -d "${output_base}" ]]; then
    mkdir -p "${output_base}"
  fi

  correlation_id="gate-$(date -u +"%Y%m%dT%H%M%SZ")-${commit}"
  output_dir="${output_base}/${correlation_id}"
  if [[ -e "${output_dir}" ]]; then
    fail 17 "output directory already exists for this correlation id: ${output_dir}"
  fi
  mkdir -p "${output_dir}"
}

write_policy_validation() {
  bash "${script_dir}/gate-policy.sh" --validate-only --policy "${policy_path}" --environment "${environment}"
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
        [[ $# -ge 2 ]] || fail 10 "--artifact requires a value"
        artifact_path="$2"
        shift 2
        ;;
      --policy)
        [[ $# -ge 2 ]] || fail 10 "--policy requires a value"
        policy_path="$2"
        shift 2
        ;;
      --output)
        [[ $# -ge 2 ]] || fail 10 "--output requires a value"
        output_base="$2"
        shift 2
        ;;
      --environment)
        [[ $# -ge 2 ]] || fail 10 "--environment requires a value"
        environment="$2"
        shift 2
        ;;
      --dry-run)
        dry_run="true"
        shift
        ;;
      --strict)
        strict="true"
        shift
        ;;
      --explain)
        explain="true"
        shift
        ;;
      --verbose)
        verbose="true"
        shift
        ;;
      --skip-http)
        skip_http="true"
        shift
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        fail 10 "unknown argument: $1"
        ;;
    esac
  done

  [[ -n "${artifact_path}" ]] || fail 10 "--artifact is required"
  [[ "${dry_run}" == "true" ]] || fail 20 "execution without --dry-run is blocked in this phase"
  [[ -n "${environment}" ]] || fail 10 "--environment is required"
  case "${environment}" in
    local|hml|production) ;;
    *) fail 20 "invalid environment: ${environment}" ;;
  esac

  artifact_path="$(resolve_abs_path "${artifact_path}")"
  policy_path="$(resolve_abs_path "${policy_path}")"
  output_base="$(resolve_abs_path "${output_base}")"

  is_safe_output_base "${output_base}" || fail 20 "unsafe output directory: ${output_base}"

  [[ -f "${artifact_path}" ]] || fail 11 "artifact file not found: ${artifact_path}"
  [[ -f "${policy_path}" ]] || fail 12 "policy file not found: ${policy_path}"
  [[ "${artifact_path}" == *.tar.gz || "${artifact_path}" == *.tgz ]] || fail 11 "artifact must be a tar.gz archive"

  [[ -f "${repo_root}/release/schemas/manifest.schema.json" ]] || fail 20 "manifest schema is missing"
  [[ -f "${repo_root}/release/schemas/release-gate-summary.schema.json" ]] || fail 20 "summary schema is missing"
  [[ -f "${repo_root}/scripts/release/verify-release.sh" ]] || fail 20 "release verification script is missing"
  [[ -f "${repo_root}/scripts/deploy/deploy-engine.sh" ]] || fail 20 "deploy engine script is missing"
  [[ -f "${repo_root}/scripts/runtime/runtime-validator.sh" ]] || fail 20 "runtime validator script is missing"
  [[ -f "${repo_root}/scripts/gate/gate-policy.sh" ]] || fail 20 "gate policy script is missing"
  [[ -f "${repo_root}/scripts/gate/evidence-aggregator.sh" ]] || fail 20 "evidence aggregator script is missing"
  [[ -f "${repo_root}/scripts/gate/gate-report.sh" ]] || fail 20 "gate report script is missing"

  collect_git_context
  prepare_output_dir

  local artifact_dir manifest_path temp_status
  artifact_dir="$(cd "$(dirname "${artifact_path}")" && pwd)"
  manifest_path="${artifact_dir}/manifest.json"

  compute_artifact_version "${manifest_path}"
  compute_sha256 "${artifact_path}"

  write_policy_validation

  started_at="$(timestamp_utc)"
  state_dir="$(mktemp -d)"
  trap 'rm -rf "${state_dir}"' EXIT

  log_line INFO "starting release gate"
  log_line INFO "output: ${output_dir}"
  log_line INFO "artifact: ${artifact_path}"
  log_line INFO "policy: ${policy_path}"
  log_line INFO "environment: ${environment}"
  log_line INFO "dry-run: ${dry_run}"
  log_line INFO "strict: ${strict}"
  log_line INFO "explain: ${explain}"
  log_line INFO "skip-http: ${skip_http}"

  release_args=(bash "${repo_root}/scripts/release/verify-release.sh" "${artifact_dir}")
  run_logged_stage \
    "releaseVerification" \
    "${state_dir}/release-verification.json" \
    "${output_dir}/release-verification.log" \
    "PASS" \
    "[\"${output_dir}/release-verification.log\"]" \
    "${release_args[@]}"

  deploy_args=(bash "${repo_root}/scripts/deploy/deploy-engine.sh" --artifact "${artifact_path}" --manifest "${manifest_path}" --dry-run --output "${output_dir}")
  if [[ "${verbose}" == "true" ]]; then
    deploy_args+=(--verbose)
  fi
  run_logged_stage \
    "deployDryRun" \
    "${state_dir}/deploy-dry-run.json" \
    "${output_dir}/deploy-dry-run.log" \
    "PASS" \
    "[\"${output_dir}/runtime-check.json\",\"${output_dir}/artifact-validation.json\",\"${output_dir}/dry-run.json\",\"${output_dir}/deploy-engine-report.md\"]" \
    "${deploy_args[@]}"

  runtime_args=(bash "${repo_root}/scripts/runtime/runtime-validator.sh" --artifact "${artifact_dir}" --manifest "${manifest_path}" --output "${output_dir}")
  if [[ "${skip_http}" == "true" ]]; then
    runtime_args+=(--skip-http)
  fi
  if [[ "${verbose}" == "true" ]]; then
    runtime_args+=(--verbose)
  fi
  run_logged_stage \
    "runtimeValidation" \
    "${state_dir}/runtime-validation.json" \
    "${output_dir}/runtime-validation.log" \
    "PASS" \
    "[\"${output_dir}/runtime-summary.json\",\"${output_dir}/runtime-report.md\",\"${output_dir}/frontend-validation.json\",\"${output_dir}/bundle-validation.json\",\"${output_dir}/http-validation.json\",\"${output_dir}/security-validation.json\",\"${output_dir}/compatibility-validation.json\"]" \
    "${runtime_args[@]}"

  aggregator_args=(bash "${script_dir}/evidence-aggregator.sh"
    --state-dir "${state_dir}"
    --output "${output_dir}"
    --policy "${policy_path}"
    --artifact "${artifact_path}"
    --environment "${environment}"
    --correlation-id "${correlation_id}"
  )
  if [[ "${strict}" == "true" ]]; then
    aggregator_args+=(--strict)
  fi
  if [[ "${explain}" == "true" ]]; then
    aggregator_args+=(--explain)
  fi
  if [[ "${skip_http}" == "true" ]]; then
    aggregator_args+=(--skip-http)
  fi
  aggregator_exit=0
  set +e
  "${aggregator_args[@]}"
  aggregator_exit=$?
  set -e

  stage_results_path="${output_dir}/stage-results.json"
  policy_evaluation_path="${output_dir}/policy-evaluation.json"
  execution_metadata_path="${output_dir}/execution-metadata.json"

  policy_args=(bash "${script_dir}/gate-policy.sh"
    --policy "${policy_path}"
    --stage-results "${stage_results_path}"
    --execution-metadata "${execution_metadata_path}"
    --output "${output_dir}"
    --environment "${environment}"
    --correlation-id "${correlation_id}"
  )
  if [[ "${strict}" == "true" ]]; then
    policy_args+=(--strict)
  fi
  if [[ "${explain}" == "true" ]]; then
    policy_args+=(--explain)
  fi
  if [[ "${skip_http}" == "true" ]]; then
    policy_args+=(--skip-http)
  fi
  policy_exit=0
  set +e
  "${policy_args[@]}"
  policy_exit=$?
  set -e

  report_args=(bash "${script_dir}/gate-report.sh"
    --stage-results "${stage_results_path}"
    --policy-evaluation "${policy_evaluation_path}"
    --execution-metadata "${execution_metadata_path}"
    --summary-schema "${repo_root}/release/schemas/release-gate-summary.schema.json"
    --output "${output_dir}"
    --correlation-id "${correlation_id}"
    --artifact "${artifact_path}"
    --policy "${policy_path}"
    --environment "${environment}"
  )
  if [[ "${strict}" == "true" ]]; then
    report_args+=(--strict)
  fi
  if [[ "${explain}" == "true" ]]; then
    report_args+=(--explain)
  fi
  if [[ "${skip_http}" == "true" ]]; then
    report_args+=(--skip-http)
  fi
  report_exit=0
  set +e
  "${report_args[@]}"
  report_exit=$?
  set -e

  if [[ -f "${policy_evaluation_path}" ]]; then
    policy_version="$(node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(String(data.policy?.version || 'unknown'));" "${policy_evaluation_path}")"
    policy_hash="$(node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(String(data.policy?.hash || 'unknown'));" "${policy_evaluation_path}")"
  fi

  finished_at="$(timestamp_utc)"

  if [[ -f "${output_dir}/release-gate-summary.json" ]]; then
    temp_status="$(node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(String(data.status || 'BLOCKED'));" "${output_dir}/release-gate-summary.json")"
  else
    temp_status="BLOCKED"
  fi

  log_line INFO "release gate completed with status ${temp_status}"

  if [[ "${report_exit}" -ne 0 ]]; then
    exit "${report_exit}"
  fi

  if [[ "${policy_exit}" -ne 0 ]]; then
    exit "${policy_exit}"
  fi

  if [[ "${aggregator_exit}" -ne 0 ]]; then
    exit "${aggregator_exit}"
  fi

  case "${temp_status}" in
    PASS)
      exit 0
      ;;
    PASS_WITH_WARNINGS)
      exit 2
      ;;
    FAIL)
      exit 16
      ;;
    BLOCKED)
      exit 17
      ;;
    *)
      exit 99
      ;;
  esac
}

main "$@"
