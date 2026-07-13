#!/usr/bin/env bash
# One-shot Vercel deploy for KRMU ERP. Run AFTER `vercel login`.
set -e
cd "$(dirname "$0")/.."

echo "▶ Linking project…"
vercel link --yes

# Push env vars from .env.local / .env to Production (idempotent: remove then add).
set_env() {
  local key="$1" val="$2"
  [ -z "$val" ] && return
  vercel env rm "$key" production -y >/dev/null 2>&1 || true
  printf "%s" "$val" | vercel env add "$key" production >/dev/null 2>&1 || true
  echo "  set $key"
}

echo "▶ Setting environment variables…"
# shellcheck disable=SC1091
source .env.local 2>/dev/null || true
set_env AZURE_OPENAI_ENDPOINT "$AZURE_OPENAI_ENDPOINT"
set_env AZURE_OPENAI_KEY "$AZURE_OPENAI_KEY"
set_env AZURE_OPENAI_DEPLOYMENT "$AZURE_OPENAI_DEPLOYMENT"
set_env DATABASE_URL "file:./prisma/seed.sqlite"

echo "▶ Deploying to production…"
vercel deploy --prod
echo "✅ Done — the production URL is printed above."
