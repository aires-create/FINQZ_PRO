#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
builder="${script_dir}/fixture-builder.sh"
assertions="${script_dir}/fixture-assertions.sh"
reporter="${repo_root}/scripts/consolidation/consolidation-report.sh"
schema_path="${repo_root}/release/schemas/pipeline-consolidation-summary.schema.json"
policy_path="${repo_root}/release/policies/release-gate-policy.json"
fixtures_dir="${script_dir}/fixtures"

. "${assertions}"

run_root=""
fixture_name=""
run_all="false"
list_only="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

fail() {
  local code="$1"
  shift
  printf '%s ERROR [run-fixtures] %s\n' "$(timestamp_utc)" "$*" >&2
  exit "${code}"
}

usage() {
  cat <<'EOF'
Usage:
  run-fixtures.sh --all [--run-root <dir>]
  run-fixtures.sh --fixture <id> [--run-root <dir>]
  run-fixtures.sh --list
EOF
}

json_field() {
  local file_path="$1"
  local field_path="$2"
  node -e "const fs = require('fs'); const file = process.argv[1]; const parts = process.argv[2].split('.'); const data = JSON.parse(fs.readFileSync(file, 'utf8')); let current = data; for (const part of parts) { if (current == null || !(part in current)) { process.exit(3); } current = current[part]; } process.stdout.write(typeof current === 'string' ? current : JSON.stringify(current));" "$file_path" "$field_path"
}

json_bool() {
  local file_path="$1"
  local field_path="$2"
  node -e "const fs = require('fs'); const file = process.argv[1]; const parts = process.argv[2].split('.'); const data = JSON.parse(fs.readFileSync(file, 'utf8')); let current = data; for (const part of parts) { if (current == null || !(part in current)) { process.exit(3); } current = current[part]; } process.stdout.write(String(Boolean(current)));" "$file_path" "$field_path"
}

fixture_files() {
  find "${fixtures_dir}" -mindepth 2 -maxdepth 2 -name fixture.json | sort
}

select_fixture_file() {
  local desired="$1"
  local file
  while IFS= read -r file; do
    [[ -n "${file}" ]] || continue
    if [[ "$(basename "$(dirname "${file}")")" == "${desired}" ]]; then
      printf '%s\n' "${file}"
      return 0
    fi
  done < <(fixture_files)
  return 1
}

run_command_allow() {
  local __rc_var="$1"
  shift
  set +e
  "$@"
  local rc=$?
  set -e
  printf -v "${__rc_var}" '%s' "${rc}"
}

list_results() {
  local results_dir="$1"
  find "${results_dir}" -mindepth 1 -maxdepth 1 -name '*.json' | sort
}

while (($#)); do
  case "$1" in
    --run-root)
      [[ $# -ge 2 ]] || fail 12 "--run-root requires a value"
      run_root="$2"
      shift 2
      ;;
    --fixture)
      [[ $# -ge 2 ]] || fail 12 "--fixture requires a value"
      fixture_name="$2"
      shift 2
      ;;
    --all)
      run_all="true"
      shift
      ;;
    --list)
      list_only="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail 12 "unknown argument: $1"
      ;;
  esac
done

if [[ ! -x "${builder}" ]]; then
  fail 13 "fixture builder is not executable: ${builder}"
fi

if [[ "${list_only}" == "true" ]]; then
  fixture_files | while IFS= read -r file; do
    [[ -n "${file}" ]] || continue
    basename "$(dirname "${file}")"
  done
  exit 0
fi

if [[ "${run_all}" == "true" && -n "${fixture_name}" ]]; then
  fail 12 "use either --all or --fixture, not both"
fi

if [[ "${run_all}" != "true" && -z "${fixture_name}" ]]; then
  fail 12 "either --all or --fixture is required"
fi

if [[ -z "${run_root}" ]]; then
  run_root="$(mktemp -d "${TMPDIR:-/tmp}/finqz-pipeline-fixtures.XXXXXX")"
else
  mkdir -p "${run_root}"
fi

results_dir="${run_root}/results"
report_dir="${run_root}/reports"
mkdir -p "${results_dir}" "${report_dir}"
log_file="${run_root}/fixture-run.log"
: > "${log_file}"

log() {
  printf '%s\n' "$*" | tee -a "${log_file}" >/dev/null
}

fixture_list=()
if [[ "${run_all}" == "true" ]]; then
  while IFS= read -r file; do
    [[ -n "${file}" ]] || continue
    fixture_list+=("${file}")
  done < <(fixture_files)
else
  selected_fixture="$(select_fixture_file "${fixture_name}")" || fail 14 "fixture not found: ${fixture_name}"
  fixture_list+=("${selected_fixture}")
fi

results_files=()
overall_status="PASS"

log "run_root=${run_root}"
log "fixtures=${#fixture_list[@]}"

for fixture_file in "${fixture_list[@]}"; do
  fixture_id="$(basename "$(dirname "${fixture_file}")")"
  fixture_run_dir="${run_root}/${fixture_id}"
  fixture_build_path="${fixture_run_dir}/fixture-build.json"
  output_dir="${fixture_run_dir}/output"
  state_dir="${fixture_run_dir}/state"
  result_file="${results_dir}/${fixture_id}.json"

  log "building ${fixture_id}"
  run_command_allow builder_rc "${builder}" --fixture "${fixture_file}" --run-root "${run_root}"
  if [[ "${builder_rc}" != "0" ]]; then
    fail 20 "fixture builder failed for ${fixture_id} with exit code ${builder_rc}"
  fi

  [[ -f "${fixture_build_path}" ]] || fail 20 "fixture build plan missing: ${fixture_build_path}"

  artifact_path="$(json_field "${fixture_build_path}" 'artifactPath')"
  artifact_dir="$(json_field "${fixture_build_path}" 'artifactDir')"
  manifest_path="$(json_field "${fixture_build_path}" 'manifestPath')"
  correlation_id="$(json_field "${fixture_build_path}" 'correlationId')"
  environment="$(json_field "${fixture_build_path}" 'environment')"
  strict="$(json_bool "${fixture_build_path}" 'strict')"
  skip_http="$(json_bool "${fixture_build_path}" 'skipHttp')"
  expected_summary="$(json_field "${fixture_file}" 'expected.summaryStatus')"
  expected_contract="$(json_field "${fixture_file}" 'expected.contractStatus')"
  expected_evidence="$(json_field "${fixture_file}" 'expected.evidenceStatus')"
  expected_portability="$(json_field "${fixture_file}" 'expected.portabilityStatus')"
  corrupt_mode="$(json_bool "${fixture_build_path}" 'corruptFile')"
  validator_args=()
  [[ "${strict}" == "true" ]] && validator_args+=(--strict)
  [[ "${skip_http}" == "true" ]] && validator_args+=(--skip-http)

  contract_json="${output_dir}/stage-contract-results.json"
  evidence_json="${output_dir}/evidence-validation.json"
  portability_json="${output_dir}/portability-validation.json"
  summary_json="${report_dir}/${fixture_id}/pipeline-consolidation-summary.json"
  report_md="${report_dir}/${fixture_id}/pipeline-consolidation-report.md"

  mkdir -p "${report_dir}/${fixture_id}"

  log "validating contract ${fixture_id}"
  run_command_allow contract_rc "${repo_root}/scripts/consolidation/contract-validator.sh" \
    --state-dir "${state_dir}" \
    --output "${output_dir}" \
    --artifact "${artifact_path}" \
    --artifact-dir "${artifact_dir}" \
    --manifest "${manifest_path}" \
    --policy "${policy_path}" \
    --environment "${environment}" \
    --correlation-id "${correlation_id}" \
    "${validator_args[@]}"
  if [[ "${contract_rc}" != "0" && "${contract_rc}" != "2" && "${contract_rc}" != "16" && "${contract_rc}" != "17" ]]; then
    fail 21 "unexpected contract validator exit code ${contract_rc} for ${fixture_id}"
  fi
  [[ -f "${contract_json}" ]] || fail 21 "contract validation output missing for ${fixture_id}"

  if [[ "${fixture_id}" == "blocked-invalid-json" ]]; then
    log "checking corrupt evidence fixture ${fixture_id}"
    if node -e "const fs = require('fs'); JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));" "${evidence_json}" >/dev/null 2>&1; then
      fail 22 "evidence JSON was expected to be invalid for ${fixture_id}"
    fi
    contract_status="$(json_field "${contract_json}" 'status')"
    evidence_status="BLOCKED"
    portability_status="SKIPPED"
    report_status="SKIPPED"
    summary_status="BLOCKED"
  else
    log "validating evidence ${fixture_id}"
    run_command_allow evidence_rc "${repo_root}/scripts/consolidation/evidence-validator.sh" \
      --state-dir "${state_dir}" \
      --output "${output_dir}" \
      --artifact "${artifact_path}" \
      --artifact-dir "${artifact_dir}" \
      --manifest "${manifest_path}" \
      --policy "${policy_path}" \
      --environment "${environment}" \
      --correlation-id "${correlation_id}" \
      "${validator_args[@]}"
    if [[ "${evidence_rc}" != "0" && "${evidence_rc}" != "2" && "${evidence_rc}" != "16" && "${evidence_rc}" != "17" ]]; then
      fail 22 "unexpected evidence validator exit code ${evidence_rc} for ${fixture_id}"
    fi
    [[ -f "${evidence_json}" ]] || fail 22 "evidence validation output missing for ${fixture_id}"

    log "validating portability ${fixture_id}"
    run_command_allow portability_rc "${repo_root}/scripts/consolidation/portability-validator.sh" \
      --state-dir "${state_dir}" \
      --output "${output_dir}" \
      --artifact "${artifact_path}" \
      --artifact-dir "${artifact_dir}" \
      --manifest "${manifest_path}" \
      --policy "${policy_path}" \
      --environment "${environment}" \
      --correlation-id "${correlation_id}" \
      "${validator_args[@]}"
    if [[ "${portability_rc}" != "0" && "${portability_rc}" != "2" && "${portability_rc}" != "16" && "${portability_rc}" != "17" ]]; then
      fail 23 "unexpected portability validator exit code ${portability_rc} for ${fixture_id}"
    fi
    [[ -f "${portability_json}" ]] || fail 23 "portability validation output missing for ${fixture_id}"

    log "validating report ${fixture_id}"
    run_command_allow report_rc "${repo_root}/scripts/consolidation/consolidation-report.sh" \
      --stage-contract-results "${contract_json}" \
      --evidence-validation "${evidence_json}" \
      --portability-validation "${portability_json}" \
      --execution-metadata "${output_dir}/execution-metadata.json" \
      --summary-schema "${schema_path}" \
      --output "${report_dir}/${fixture_id}" \
      --correlation-id "${correlation_id}" \
      --artifact "${artifact_path}" \
      --policy "${policy_path}" \
      --environment "${environment}" \
      "${validator_args[@]}"
    if [[ "${report_rc}" != "0" && "${report_rc}" != "2" && "${report_rc}" != "16" && "${report_rc}" != "17" ]]; then
      fail 24 "unexpected report exit code ${report_rc} for ${fixture_id}"
    fi
    [[ -f "${summary_json}" ]] || fail 24 "report summary missing for ${fixture_id}"
    [[ -f "${report_md}" ]] || fail 24 "report markdown missing for ${fixture_id}"

    summary_status="$(json_field "${summary_json}" 'status')"
    contract_status="$(json_field "${contract_json}" 'status')"
    evidence_status="$(json_field "${evidence_json}" 'status')"
    portability_status="$(json_field "${portability_json}" 'status')"
    report_status="${summary_status}"
  fi

  assert_summary_status() {
    local actual="$1"
    local expected="$2"
    local label="$3"
    [[ "${actual}" == "${expected}" ]] || fail 25 "${fixture_id}: ${label} expected ${expected} but got ${actual}"
  }

  assert_summary_status "${summary_status}" "${expected_summary}" "summary status"
  assert_summary_status "${contract_status}" "${expected_contract}" "contract status"
  assert_summary_status "${evidence_status}" "${expected_evidence}" "evidence status"
  assert_summary_status "${portability_status}" "${expected_portability}" "portability status"

  if [[ "${fixture_id}" != "blocked-invalid-json" ]]; then
    assert_status_exit_consistency "${contract_json}"
    assert_status_exit_consistency "${evidence_json}"
    assert_status_exit_consistency "${portability_json}"
  fi

  FIXTURE_ID="${fixture_id}" \
  FIXTURE_FILE="${fixture_file}" \
  RUN_DIR="${fixture_run_dir}" \
  SUMMARY_STATUS="${summary_status}" \
  CONTRACT_STATUS="${contract_status}" \
  EVIDENCE_STATUS="${evidence_status}" \
  PORTABILITY_STATUS="${portability_status}" \
  REPORT_STATUS="${report_status}" \
  EXPECTED_JSON="$(json_field "${fixture_file}" 'expected')" \
  VALIDATION_MODE="$([[ "${fixture_id}" == "blocked-invalid-json" ]] && printf '%s' 'corrupt-json' || printf '%s' 'full-validation')" \
  RESULT_FILE="${result_file}" \
  node <<'NODE'
const fs = require('fs');
const payload = {
  fixtureId: process.env.FIXTURE_ID,
  fixtureFile: process.env.FIXTURE_FILE,
  runDir: process.env.RUN_DIR,
  summaryStatus: process.env.SUMMARY_STATUS,
  contractStatus: process.env.CONTRACT_STATUS,
  evidenceStatus: process.env.EVIDENCE_STATUS,
  portabilityStatus: process.env.PORTABILITY_STATUS,
  reportStatus: process.env.REPORT_STATUS,
  expected: JSON.parse(process.env.EXPECTED_JSON),
  validationMode: process.env.VALIDATION_MODE,
};
fs.writeFileSync(process.env.RESULT_FILE, `${JSON.stringify(payload, null, 2)}\n`);
NODE

  results_files+=("${result_file}")
  log "${fixture_id}: ${summary_status}"
  if [[ "${summary_status}" != "PASS" && "${summary_status}" != "PASS_WITH_WARNINGS" ]]; then
    overall_status="FAIL"
  fi
done

node - "${run_root}" "${results_files[@]}" <<'NODE'
const fs = require('fs');
const path = require('path');

const runRoot = process.argv[2];
const resultFiles = process.argv.slice(3);
const results = resultFiles.map((file) => JSON.parse(fs.readFileSync(file, 'utf8')));
const counts = results.reduce((acc, item) => {
  acc.total += 1;
  acc[item.summaryStatus] = (acc[item.summaryStatus] || 0) + 1;
  return acc;
}, { total: 0 });
const failures = results.filter((item) => item.summaryStatus !== item.expected.summaryStatus);
const suiteStatus = failures.length > 0 ? 'FAIL' : 'PASS';
const summary = {
  generatedAt: new Date().toISOString(),
  runRoot,
  suiteStatus,
  counts,
  fixtureCount: results.length,
  failures: failures.map((item) => ({
    fixtureId: item.fixtureId,
    expected: item.expected.summaryStatus,
    actual: item.summaryStatus,
  })),
};
fs.writeFileSync(path.join(runRoot, 'fixture-results.json'), `${JSON.stringify(results, null, 2)}\n`);
fs.writeFileSync(path.join(runRoot, 'fixture-run-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(runRoot, 'fixture-run-report.md'), [
  '# Pipeline Consolidation Fixture Run',
  '',
  `- suiteStatus: ${summary.suiteStatus}`,
  `- totalFixtures: ${summary.fixtureCount}`,
  `- counts: ${JSON.stringify(summary.counts)}`,
  '',
  '## Fixtures',
  '',
  ...results.map((item) => `- ${item.fixtureId}: ${item.summaryStatus} (expected ${item.expected.summaryStatus})`),
  '',
  '## Failures',
  '',
  ...(summary.failures.length ? summary.failures.map((item) => `- ${item.fixtureId}: expected ${item.expected}, got ${item.actual}`) : ['- none']),
  '',
].join('\n'));
process.stdout.write(`${path.join(runRoot, 'fixture-run-summary.json')}\n`);
process.exit(summary.suiteStatus === 'PASS' ? 0 : 1);
NODE
