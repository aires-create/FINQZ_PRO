#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
artifact_path=""
manifest_path=""
base_url="${RUNTIME_HTTP_BASE_URL:-http://127.0.0.1:4000}"
environment="${RUNTIME_ENVIRONMENT:-production}"
output_dir="${repo_root}/release/runtime-validation"
verbose="false"
failure_code=0
report_written=0
commit=""
branch=""

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [runtime-validator] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  runtime-validator.sh --artifact <path|dir> [--manifest <path>] [--base-url <url>] [--environment <name>] [--output <dir>] [--verbose]
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

write_report() {
  REPORT_OUTPUT_DIR="${output_dir}" \
  REPORT_ARTIFACT="${artifact_path}" \
  REPORT_MANIFEST="${manifest_path}" \
  REPORT_BASE_URL="${base_url}" \
  REPORT_ENVIRONMENT="${environment}" \
  REPORT_COMMIT="${commit}" \
  REPORT_BRANCH="${branch}" \
  node <<'NODE'
const fs = require('fs');
const path = require('path');

const outputDir = process.env.REPORT_OUTPUT_DIR;
const manifestPath = process.env.REPORT_MANIFEST;
const artifactPath = process.env.REPORT_ARTIFACT;
const baseUrl = process.env.REPORT_BASE_URL;
const environment = process.env.REPORT_ENVIRONMENT;
const commit = process.env.REPORT_COMMIT;
const branch = process.env.REPORT_BRANCH;

const validatorFiles = {
  frontend: 'frontend-validation.json',
  bundle: 'bundle-validation.json',
  http: 'http-validation.json',
  security: 'security-validation.json',
  compatibility: 'compatibility-validation.json',
};

const readJson = (fileName) => {
  const fullPath = path.join(outputDir, fileName);
  if (!fs.existsSync(fullPath)) {
    return {
      status: 'FAIL',
      avisos: [],
      erros: [`missing evidence file: ${fileName}`],
    };
  }

  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
};

const frontend = readJson(validatorFiles.frontend);
const bundle = readJson(validatorFiles.bundle);
const http = readJson(validatorFiles.http);
const security = readJson(validatorFiles.security);
const compatibility = readJson(validatorFiles.compatibility);

const warnings = [
  ...(frontend.avisos ?? []),
  ...(bundle.avisos ?? []),
  ...(http.avisos ?? []),
  ...(security.avisos ?? []),
  ...(compatibility.avisos ?? []),
];

const errors = [
  ...(frontend.erros ?? []),
  ...(bundle.erros ?? []),
  ...(http.erros ?? []),
  ...(security.erros ?? []),
  ...(compatibility.erros ?? []),
];

const status =
  [frontend, bundle, http, security, compatibility].every((item) => item.status === 'PASS')
    ? 'PASS'
    : 'FAIL';

const summary = {
  status,
  timestamp: new Date().toISOString(),
  commit,
  branch,
  artefato: artifactPath,
  manifest: manifestPath,
  baseUrl,
  environment,
  frontend: frontend.status,
  bundle: bundle.status,
  http: http.status,
  security: security.status,
  compatibility: compatibility.status,
  warnings,
  errors,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'runtime-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

const renderList = (items) => items.length > 0
  ? items.map((item) => `- ${item}`).join('\n')
  : '- Nenhum.';

const markdown = [
  '# Runtime Validation Report',
  '',
  '## Resumo Executivo',
  '',
  `- status: ${summary.status}`,
  `- frontend: ${summary.frontend}`,
  `- bundle: ${summary.bundle}`,
  `- http: ${summary.http}`,
  `- security: ${summary.security}`,
  `- compatibility: ${summary.compatibility}`,
  `- commit: ${commit}`,
  `- branch: ${branch}`,
  `- artefato: ${artifactPath}`,
  `- baseUrl: ${baseUrl}`,
  `- environment: ${environment}`,
  '',
  '## Discovery',
  '',
  '- Reuso do kernel HTTP oficial em `backend/src/core/http/fastify.ts`.',
  '- Reuso dos ganchos de readiness e bundle governance já existentes em `scripts/sdc-3.4h-f-local-readiness.mjs` e `scripts/arch-check.mjs`.',
  '- Reuso da trilha de release e do manifest schema da fase R3.',
  '- Validação apenas observacional, sem deploy ou rollback.',
  '',
  '## Arquitetura',
  '',
  '- runtime-validator.sh orquestra os validadores.',
  '- frontend-validator.sh confere arquivos obrigatórios e manifest.',
  '- bundle-validator.sh confere referências de assets em index.html.',
  '- http-validator.sh executa GET /, GET /health e GET /ready.',
  '- security-validator.sh varre bundle, manifests e textos por riscos e segredos.',
  '- compatibility-validator.sh confere ambiente local e permissões.',
  '',
  '## Fluxo',
  '',
  '```mermaid',
  'flowchart TD',
  '  A[runtime-validator.sh] --> B[frontend-validator.sh]',
  '  B --> C[bundle-validator.sh]',
  '  C --> D[http-validator.sh]',
  '  D --> E[security-validator.sh]',
  '  E --> F[compatibility-validator.sh]',
  '  F --> G[runtime-summary.json]',
  '  G --> H[runtime-report.md]',
  '```',
  '',
  '## Validações Executadas',
  '',
  `### frontend\n${renderList(frontend.erros ?? []).replace(/\n/g, '\n')}`,
  '',
  `### bundle\n${renderList(bundle.erros ?? []).replace(/\n/g, '\n')}`,
  '',
  `### http\n${renderList(http.erros ?? []).replace(/\n/g, '\n')}`,
  '',
  `### security\n${renderList(security.erros ?? []).replace(/\n/g, '\n')}`,
  '',
  `### compatibility\n${renderList(compatibility.erros ?? []).replace(/\n/g, '\n')}`,
  '',
  '## Warnings',
  '',
  renderList(warnings),
  '',
  '## Errors',
  '',
  renderList(errors),
  '',
  '## Pendências',
  '',
  '- HTTP health/ready podem permanecer ausentes em alguns ambientes locais e virar apenas warning.',
  '- A execução real de publicação permanece fora do escopo desta fase.',
  '- Integração com gates de CI/CD ainda não foi conectada.',
  '',
  '## Roadmap',
  '',
  '- R5: Enterprise Release Gate.',
  '- R6: Publication authorization.',
  '- R7: Controlled activation.',
  '',
  '## Evidências Geradas',
  '',
  '- runtime-summary.json',
  '- runtime-report.md',
  '- frontend-validation.json',
  '- bundle-validation.json',
  '- http-validation.json',
  '- security-validation.json',
  '- compatibility-validation.json',
];

fs.writeFileSync(path.join(outputDir, 'runtime-report.md'), `${markdown.join('\n')}\n`);
NODE
  report_written=1
}

on_exit() {
  local exit_code="$1"
  if [[ "${report_written}" -eq 0 ]]; then
    write_report
  fi

  if [[ "${exit_code}" -ne 0 && "${failure_code}" -eq 0 ]]; then
    failure_code="${exit_code}"
  fi
}

run_validator() {
  local validator_name="$1"
  shift
  local validator_script="${script_dir}/${validator_name}"

  if bash "${validator_script}" "$@"; then
    log_line SUCCESS "${validator_name} passed"
  else
    local validator_exit_code="$?"
    log_line ERROR "${validator_name} failed with exit code ${validator_exit_code}"
    if [[ "${failure_code}" -eq 0 ]]; then
      failure_code="${validator_exit_code}"
    fi
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
      --manifest)
        [[ $# -ge 2 ]] || { log_line ERROR "--manifest requires a value"; exit 1; }
        manifest_path="$2"
        shift 2
        ;;
      --base-url)
        [[ $# -ge 2 ]] || { log_line ERROR "--base-url requires a value"; exit 1; }
        base_url="$2"
        shift 2
        ;;
      --environment)
        [[ $# -ge 2 ]] || { log_line ERROR "--environment requires a value"; exit 1; }
        environment="$2"
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
  if [[ -z "${manifest_path}" ]]; then
    manifest_path="${artifact_root}/manifest.json"
  else
    manifest_path="$(resolve_path "${manifest_path}")"
  fi
  output_dir="$(resolve_path "${output_dir}")"
  mkdir -p "${output_dir}"

  collect_git_context
  trap 'on_exit "$?"' EXIT

  log_line INFO "starting runtime validation"
  log_line INFO "artifact: ${artifact_path}"
  log_line INFO "manifest: ${manifest_path}"
  log_line INFO "base-url: ${base_url}"
  log_line INFO "environment: ${environment}"
  log_line INFO "output: ${output_dir}"

  if [[ "${verbose}" == "true" ]]; then
    run_validator "frontend-validator.sh" --artifact "${artifact_path}" --manifest "${manifest_path}" --output "${output_dir}" --verbose
    run_validator "bundle-validator.sh" --artifact "${artifact_path}" --output "${output_dir}" --verbose
    run_validator "http-validator.sh" --base-url "${base_url}" --output "${output_dir}" --verbose
    run_validator "security-validator.sh" --artifact "${artifact_path}" --environment "${environment}" --output "${output_dir}" --verbose
    run_validator "compatibility-validator.sh" --artifact "${artifact_path}" --output "${output_dir}" --verbose
  else
    run_validator "frontend-validator.sh" --artifact "${artifact_path}" --manifest "${manifest_path}" --output "${output_dir}"
    run_validator "bundle-validator.sh" --artifact "${artifact_path}" --output "${output_dir}"
    run_validator "http-validator.sh" --base-url "${base_url}" --output "${output_dir}"
    run_validator "security-validator.sh" --artifact "${artifact_path}" --environment "${environment}" --output "${output_dir}"
    run_validator "compatibility-validator.sh" --artifact "${artifact_path}" --output "${output_dir}"
  fi

  if [[ "${failure_code}" -ne 0 ]]; then
    log_line ERROR "runtime validation completed with failures"
    exit "${failure_code}"
  fi

  log_line SUCCESS "runtime validation completed successfully"
}

main "$@"
