#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "This script removes local build/cache artifacts inside ${REPO_ROOT}."
echo "It will not touch env files, docs, migrations, or anything outside the repository."

read -r -p "Proceed with cleanup? (y/N) " response
case "${response,,}" in
  y|yes)
    echo "Continuing cleanup..."
    ;;
  *)
    echo "Cleanup aborted."
    exit 1
    ;;
esac

ensure_remove() {
  if [ -d "$1" ]; then
    echo "Removing $1"
    rm -rf "$1"
  fi
}

remove_patterns=(
  "${REPO_ROOT}/.turbo"
  "${REPO_ROOT}/.next"
  "${REPO_ROOT}/dist"
  "${REPO_ROOT}/build"
  "${REPO_ROOT}/.cache"
  "${REPO_ROOT}/coverage"
)

for path in "${remove_patterns[@]}"; do
  ensure_remove "$path"
done

for root in apps packages; do
  if [ -d "${REPO_ROOT}/${root}" ]; then
    while IFS= read -r -d $'\0' nm_dir; do
      ensure_remove "$nm_dir"
    done < <(find "${REPO_ROOT}/${root}" -type d -name node_modules -print0)
  fi
done

echo "Cleanup complete."
