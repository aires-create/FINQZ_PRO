#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
schema_file="${repo_root}/release/schemas/manifest.schema.json"
default_output_dir="${repo_root}/release/deploy-engine"
verify_runtime_script="${script_dir}/verify-runtime.sh"
smoke_engine_script="${script_dir}/smoke-engine.sh"

artifact_path=""
manifest_path=""
output_dir="${default_output_dir}"
dry_run="false"
verbose="false"

commit=""
branch=""
artifact_dir=""
report_status="SUCCESS"
report_result="DRY_RUN_OK"
declare -a report_errors=()
declare -a report_warnings=()
report_written="0"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [deploy-engine] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

log_info() {
  log_line INFO "$*"
}

log_warning() {
  report_warnings+=("$*")
  log_line WARNING "$*"
}

log_error() {
  report_errors+=("$*")
  report_status="FAILURE"
  report_result="VALIDATION_FAILED"
  log_line ERROR "$*"
}

log_success() {
  log_line SUCCESS "$*"
}

usage() {
  cat <<'EOF'
Usage:
  deploy-engine.sh --artifact <path.tar.gz> [--manifest <path>] --dry-run [--verbose] [--output <dir>]

Required:
  --artifact <path.tar.gz>  Path to the release tarball produced by the packaging stage.

Optional:
  --manifest <path>         Path to manifest.json. Defaults to the sibling manifest.json.
  --dry-run                 Run the engine in validation-only mode. Required in this phase.
  --verbose                 Emit additional structured log lines.
  --output <dir>            Directory for deploy-engine-report.md and evidence JSON files.
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

validate_inputs() {
  [[ -n "${artifact_path}" ]] || fail "--artifact is required"
  [[ "${dry_run}" == "true" ]] || fail "only --dry-run is supported in this phase"

  if [[ ! -f "${artifact_path}" ]]; then
    fail "artifact file does not exist: ${artifact_path}"
  fi

  if [[ "${artifact_path}" != *.tar.gz && "${artifact_path}" != *.tgz ]]; then
    fail "artifact must be a tar.gz archive: ${artifact_path}"
  fi

  artifact_dir="$(cd "$(dirname "${artifact_path}")" && pwd)"
  if [[ -z "${manifest_path}" ]]; then
    manifest_path="${artifact_dir}/manifest.json"
  fi

  if [[ ! -f "${manifest_path}" ]]; then
    fail "manifest file does not exist: ${manifest_path}"
  fi

  if [[ ! -d "${artifact_dir}/dist" ]]; then
    fail "dist directory not found next to artifact: ${artifact_dir}/dist"
  fi

  local required_files=(
    "VERSION"
    "build-info.json"
    "checksums.sha256"
    "release-notes.md"
    "dist/index.html"
  )

  local relative_file
  for relative_file in "${required_files[@]}"; do
    if [[ ! -e "${artifact_dir}/${relative_file}" ]]; then
      fail "required artifact component missing: ${relative_file}"
    fi
  done

  if ! tar -tzf "${artifact_path}" >/dev/null 2>&1; then
    fail "tarball is invalid or unreadable: ${artifact_path}"
  fi
}

validate_manifest_and_schema() {
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

  REPORT_PATH="${report_path}" \
  REPORT_STATUS="${report_status_value}" \
  REPORT_RESULT="${report_result_value}" \
  REPORT_TIMESTAMP="$(timestamp_utc)" \
  REPORT_COMMIT="${commit}" \
  REPORT_BRANCH="${branch}" \
  REPORT_ARTIFACT="${artifact_path}" \
  REPORT_ERRORS_TEXT="${report_errors_text}" \
  REPORT_WARNINGS_TEXT="${report_warnings_text}" \
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

fs.mkdirSync(require('path').dirname(process.env.REPORT_PATH), { recursive: true });
fs.writeFileSync(process.env.REPORT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
NODE
}

write_markdown_report() {
  local report_path="$1"
  REPORT_PATH="${report_path}" \
  REPORT_STATUS="${report_status}" \
  REPORT_RESULT="${report_result}" \
  REPORT_TIMESTAMP="$(timestamp_utc)" \
  REPORT_BRANCH="${branch}" \
  REPORT_COMMIT="${commit}" \
  REPORT_ARTIFACT="${artifact_path}" \
  REPORT_OUTPUT_DIR="${output_dir}" \
  node <<'NODE'
const fs = require('fs');

const lines = [
  '# Deploy Engine Dry-Run Report',
  '',
  '## Summary Exec',
  '',
  `- status: ${process.env.REPORT_STATUS}`,
  `- resultado: ${process.env.REPORT_RESULT}`,
  `- timestamp_utc: ${process.env.REPORT_TIMESTAMP}`,
  `- branch: ${process.env.REPORT_BRANCH}`,
  `- commit: ${process.env.REPORT_COMMIT}`,
  `- artefato: ${process.env.REPORT_ARTIFACT}`,
  '',
  '## Files Created',
  '',
  `- ${process.env.REPORT_OUTPUT_DIR}/runtime-check.json`,
  `- ${process.env.REPORT_OUTPUT_DIR}/artifact-validation.json`,
  `- ${process.env.REPORT_OUTPUT_DIR}/dry-run.json`,
  `- ${process.env.REPORT_OUTPUT_DIR}/deploy-engine-report.md`,
  '',
  '## Files Altered',
  '',
  '- Nenhum arquivo de runtime foi alterado.',
  '- Nenhum serviço, container ou ambiente foi modificado.',
  '',
  '## Architecture',
  '',
  '- receive artifact',
  '- validate tarball and companion files',
  '- validate manifest and schema',
  '- validate runtime',
  '- validate structure',
  '- validate checksums',
  '- simulate deploy',
  '- generate evidence',
  '',
  '## Mermaid Flow',
  '',
  '```mermaid',
  'flowchart TD',
  '  A[Artifact input] --> B[Tarball validation]',
  '  B --> C[Manifest validation]',
  '  C --> D[Schema validation]',
  '  D --> E[Runtime validation]',
  '  E --> F[Structure validation]',
  '  F --> G[Smoke validation]',
  '  G --> H[Dry-run report]',
  '```',
  '',
  '## Evidence Generated',
  '',
  '- runtime-check.json',
  '- artifact-validation.json',
  '- dry-run.json',
  '',
  '## Risks',
  '',
  '- The current phase depends on a valid tar.gz artifact created by the release packaging stage.',
  '- The manifest schema may evolve in a later release phase.',
  '- Runtime checks are read-only and only describe the local execution context.',
  '',
  '## Pending',
  '',
  '- Real deploy execution remains out of scope for this phase.',
  '- Rollback execution remains interface-only in this phase.',
  '- Integration with CI/CD gates can be added after architectural review.',
  '',
  '## Recommendations for EPC-W5-03D-R4',
  '',
  '1. Add a non-destructive smoke runtime phase with service reachability checks.',
  '2. Wire the dry-run engine into CI as an explicit validation job.',
  '3. Keep deploy execution disabled until approval for the next phase.',
];

fs.mkdirSync(require('path').dirname(process.env.REPORT_PATH), { recursive: true });
fs.writeFileSync(process.env.REPORT_PATH, `${lines.join('\n')}\n`);
NODE
}

run_verify_runtime() {
  log_info "running runtime verification"
  if [[ "${verbose}" == "true" ]]; then
    bash "${verify_runtime_script}" \
      --artifact "${artifact_path}" \
      --output "${output_dir}" \
      --verbose
  else
    bash "${verify_runtime_script}" \
      --artifact "${artifact_path}" \
      --output "${output_dir}"
  fi
}

run_smoke_engine() {
  log_info "running smoke validation"
  if [[ "${verbose}" == "true" ]]; then
    bash "${smoke_engine_script}" \
      --artifact "${artifact_path}" \
      --manifest "${manifest_path}" \
      --output "${output_dir}" \
      --verbose
  else
    bash "${smoke_engine_script}" \
      --artifact "${artifact_path}" \
      --manifest "${manifest_path}" \
      --output "${output_dir}"
  fi
}

on_exit() {
  local exit_code="$1"
  if [[ "${report_written}" == "0" ]]; then
    local status_value="${report_status}"
    local result_value="${report_result}"
    if [[ "${exit_code}" -ne 0 ]]; then
      status_value="FAILURE"
      result_value="VALIDATION_FAILED"
    fi
    write_json_report \
      "${output_dir}/dry-run.json" \
      "${result_value}" \
      "${status_value}" \
      "$(printf '%s\n' "${report_errors[@]-}")" \
      "$(printf '%s\n' "${report_warnings[@]-}")"
    write_markdown_report "${output_dir}/deploy-engine-report.md"
  fi
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
      --dry-run)
        dry_run="true"
        shift
        ;;
      --verbose)
        verbose="true"
        shift
        ;;
      --output)
        [[ $# -ge 2 ]] || fail "--output requires a value"
        output_dir="$2"
        shift 2
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

  collect_git_context
  artifact_path="$(resolve_abs_path "${artifact_path}")"
  if [[ -n "${manifest_path}" ]]; then
    manifest_path="$(resolve_abs_path "${manifest_path}")"
  fi
  output_dir="$(resolve_abs_path "${output_dir}")"

  mkdir -p "${output_dir}"

  log_info "dry-run engine initialized"
  log_info "artifact: ${artifact_path}"
  log_info "manifest: ${manifest_path:-<derived>}"
  log_info "output: ${output_dir}"

  validate_inputs
  validate_manifest_and_schema
  run_verify_runtime
  run_smoke_engine

  report_status="SUCCESS"
  report_result="DRY_RUN_COMPLETED"
  write_json_report \
    "${output_dir}/dry-run.json" \
    "${report_result}" \
    "${report_status}" \
    "$(printf '%s\n' "${report_errors[@]-}")" \
    "$(printf '%s\n' "${report_warnings[@]-}")"
  write_markdown_report "${output_dir}/deploy-engine-report.md"
  report_written="1"

  log_success "dry-run completed successfully"
}

trap 'on_exit "$?"' EXIT
main "$@"
