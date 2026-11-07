#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Render serves the output on its CDN; no Vite dev/preview server is deployed.
export NODE_ENV=production
export BASE_PATH=/
export PORT="${PORT:-10000}"
node artifacts/portfolio/scripts/validate-public-config.mjs

pm() {
  if command -v corepack >/dev/null 2>&1; then
    corepack pnpm "$@"
  else
    pnpm "$@"
  fi
}
if [ "${1:-}" != "--skip-install" ]; then
  # Vite/TypeScript are build-time devDependencies, even in production.
  CI=true pm install --frozen-lockfile --prod=false --filter '@workspace/portfolio...'
fi
pm --filter @workspace/portfolio run typecheck
pm --filter @workspace/portfolio run build
test -f artifacts/portfolio/dist/public/index.html
test -d artifacts/portfolio/dist/public/media
