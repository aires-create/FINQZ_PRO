#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
output_dir="${repo_root}/release/deploy-engine"
verbose="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [rollback-engine] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

log_info() { log_line INFO "$*"; }
log_warning() { log_line WARNING "$*"; }
log_success() { log_line SUCCESS "$*"; }

usage() {
  cat <<'EOF'
Usage:
  rollback-engine.sh [--output <dir>] [--verbose] [--help]

This phase exposes interface only. No rollback action is executed.
EOF
}

main() {
  while (($#)); do
    case "$1" in
      --output)
        [[ $# -ge 2 ]] || {
          log_line ERROR "--output requires a value"
          exit 1
        }
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

  mkdir -p "${output_dir}"
  log_info "rollback engine interface loaded"
  log_info "output directory: ${output_dir}"
  if [[ "${verbose}" == "true" ]]; then
    log_info "rollback execution is disabled in this phase"
  fi
  log_warning "rollback execution is not implemented in dry-run phase"
  log_success "interface only, no rollback executed"
}

main "$@"
