#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

cd "${repo_root}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "required command not found: $1"
}

require_cmd npm
require_cmd node

[[ -f package.json ]] || fail "package.json not found at repository root"

npm ci
npm run build

[[ -d dist ]] || fail "dist/ was not created by the frontend build"

if ! find dist -type f -print -quit | grep -q .; then
  fail "dist/ exists but does not contain any files"
fi

[[ -f dist/index.html ]] || fail "dist/index.html not found after build"

printf 'Frontend build validated successfully.\n'
