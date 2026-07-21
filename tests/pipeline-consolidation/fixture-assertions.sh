#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

fail() {
  printf 'ASSERTION FAILED: %s\n' "$*" >&2
  return 1
}

assert_file_exists() {
  local file_path="$1"
  [[ -f "${file_path}" ]] || fail "file does not exist: ${file_path}"
}

assert_json_valid() {
  local file_path="$1"
  assert_file_exists "${file_path}"
  node -e "const fs = require('fs'); JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));" "${file_path}" >/dev/null
}

assert_json_field_equals() {
  local file_path="$1"
  local field_path="$2"
  local expected="$3"
  local actual
  actual="$(node -e "const fs = require('fs'); const file = process.argv[1]; const pathExpr = process.argv[2].split('.'); const data = JSON.parse(fs.readFileSync(file, 'utf8')); let current = data; for (const part of pathExpr) { if (current == null || !(part in current)) { process.exit(3); } current = current[part]; } process.stdout.write(typeof current === 'string' ? current : JSON.stringify(current));" "${file_path}" "${field_path}")" || return 1
  [[ "${actual}" == "${expected}" ]] || fail "${file_path}:${field_path} expected '${expected}' but got '${actual}'"
}

assert_json_array_contains() {
  local file_path="$1"
  local field_path="$2"
  local expected="$3"
  node -e "const fs = require('fs'); const file = process.argv[1]; const pathExpr = process.argv[2].split('.'); const expected = process.argv[3]; const data = JSON.parse(fs.readFileSync(file, 'utf8')); let current = data; for (const part of pathExpr) { if (current == null || !(part in current)) { process.exit(3); } current = current[part]; } if (!Array.isArray(current) || !current.includes(expected)) { process.exit(4); }" "${file_path}" "${field_path}" "${expected}" || fail "${file_path}:${field_path} does not contain '${expected}'"
}

assert_exit_code_allowed() {
  local actual="$1"
  shift
  local allowed=("$@")
  local allowed_str
  allowed_str="$(printf '%s ' "${allowed[@]}")"
  for code in "${allowed[@]}"; do
    if [[ "${actual}" == "${code}" ]]; then
      return 0
    fi
  done
  fail "exit code ${actual} not in allowed set: ${allowed_str}"
}

assert_status_exit_consistency() {
  local stage_json="$1"
  assert_json_valid "${stage_json}"
  local status exit_code
  status="$(node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(String(data.status || ''));" "${stage_json}")"
  exit_code="$(node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(String(data.exitCode ?? ''));" "${stage_json}")"
  case "${status}" in
    PASS)
      [[ "${exit_code}" == "0" ]] || fail "${stage_json} has PASS with exitCode ${exit_code}"
      ;;
    PASS_WITH_WARNINGS)
      [[ "${exit_code}" == "0" || "${exit_code}" == "2" ]] || fail "${stage_json} has PASS_WITH_WARNINGS with exitCode ${exit_code}"
      ;;
    SKIPPED)
      [[ "${exit_code}" == "0" ]] || fail "${stage_json} has SKIPPED with exitCode ${exit_code}"
      ;;
    FAIL|BLOCKED)
      [[ "${exit_code}" != "0" ]] || fail "${stage_json} has ${status} with exitCode 0"
      ;;
    *)
      fail "${stage_json} has unknown status ${status}"
      ;;
  esac
}

assert_summary_schema_valid() {
  local summary_file="$1"
  local schema_file="$2"
  assert_json_valid "${summary_file}"
  assert_json_valid "${schema_file}"
  node -e "
    const fs = require('fs');
    const summary = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const schema = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
    for (const key of schema.required || []) {
      if (!(key in summary)) {
        process.exit(3);
      }
    }
    if (!['PASS', 'PASS_WITH_WARNINGS', 'FAIL', 'BLOCKED'].includes(summary.status)) process.exit(4);
    if (!['local', 'hml', 'production'].includes(summary.environment)) process.exit(5);
    if (!summary.stages || typeof summary.stages !== 'object') process.exit(6);
  " "${summary_file}" "${schema_file}" || fail "summary schema validation failed for ${summary_file}"
}

assert_no_absolute_personal_paths() {
  local root="$1"
  shift
  local patterns=("C:/Users/" "C:\\Users\\" "C:/Projects/" "C:\\Projects\\" "AppData/")
  local file
  for file in "$@"; do
    [[ -e "${file}" ]] || continue
    for pattern in "${patterns[@]}"; do
      if rg -n --fixed-strings "${pattern}" "${file}" >/dev/null 2>&1; then
        fail "personal path pattern '${pattern}' found in ${file}"
      fi
    done
  done
}

assert_no_secrets() {
  local file
  for file in "$@"; do
    [[ -e "${file}" ]] || continue
    if rg -n --fixed-strings "Authorization" "${file}" >/dev/null 2>&1; then
      fail "Authorization found in ${file}"
    fi
    if rg -n --fixed-strings "Bearer" "${file}" >/dev/null 2>&1; then
      fail "Bearer found in ${file}"
    fi
    if rg -n --fixed-strings "refresh_token" "${file}" >/dev/null 2>&1; then
      fail "refresh_token found in ${file}"
    fi
    if rg -n --fixed-strings "access_token" "${file}" >/dev/null 2>&1; then
      fail "access_token found in ${file}"
    fi
  done
}

assert_correlation_valid() {
  local summary_file="$1"
  local expected="$2"
  assert_json_field_equals "${summary_file}" "correlationId" "${expected}"
}

assert_parent_child_correlation() {
  local stage_file="$1"
  local expected="$2"
  assert_json_field_equals "${stage_file}" "correlationId" "${expected}"
  assert_json_field_equals "${stage_file}" "parentCorrelationId" "${expected}"
}

assert_evidence_complete() {
  local json_file="$1"
  shift
  for expected in "$@"; do
    if ! node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); const values = Array.isArray(data.missing) ? data.missing : []; if (values.includes(process.argv[2])) process.exit(4);" "${json_file}" "${expected}"; then
      fail "${json_file} is missing evidence entry '${expected}'"
    fi
  done
}

assert_warning_present() {
  local json_file="$1"
  local expected="$2"
  assert_json_array_contains "${json_file}" "warnings" "${expected}"
}

assert_error_present() {
  local json_file="$1"
  local expected="$2"
  assert_json_array_contains "${json_file}" "errors" "${expected}"
}

assert_stage_status() {
  local stage_json="$1"
  local expected="$2"
  assert_json_field_equals "${stage_json}" "status" "${expected}"
}

assert_skipped_has_reason() {
  local stage_json="$1"
  assert_json_field_equals "${stage_json}" "status" "SKIPPED"
  local justification
  justification="$(node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); process.stdout.write(String(data.justification || ''));" "${stage_json}")"
  [[ -n "${justification}" ]] || fail "${stage_json} is skipped without a reason"
}

assert_single_artifact_identity() {
  local summary_file="$1"
  local artifact_sha="$2"
  local artifact_version="$3"
  assert_json_field_equals "${summary_file}" "artifact.sha256" "${artifact_sha}"
  assert_json_field_equals "${summary_file}" "artifact.version" "${artifact_version}"
}

assert_not_overwritten() {
  local marker="$1"
  [[ -f "${marker}" ]] || fail "ownership marker missing: ${marker}"
}

assert_read_only_execution() {
  local run_root="$1"
  [[ -d "${run_root}" ]] || fail "run root missing: ${run_root}"
}
