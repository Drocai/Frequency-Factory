#!/bin/bash
set -e

echo ""
echo "═══════════════════════════════════════════"
echo "  FREQUENCY FACTORY — Deploy to Vercel"
echo "═══════════════════════════════════════════"
echo ""

# Check if vercel CLI is available
if ! command -v npx &> /dev/null; then
  echo "ERROR: npx not found. Install Node.js first."
  exit 1
fi

# Step 1: Build
echo "[1/3] Building..."
npx vite build
echo "      Build complete → dist/public"
echo ""

# Step 2: Set env vars and deploy
echo "[2/3] Deploying to Vercel..."
echo "      This will prompt you to link to your Vercel project."
echo ""

npx vercel \
  --yes \
  --prod \
  -e VITE_SUPABASE_URL="https://waapstehyslrjuqnthyj.supabase.co" \
  -e VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhYXBzdGVoeXNscmp1cW50aHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MjAyMDEsImV4cCI6MjA3NzE5NjIwMX0.9HUyry4JU5Tv8xvKeQI_dHtW6guRODUJeLi8fgp77R8"

echo ""
echo "[3/3] Done! Your site is live."
echo ""
echo "═══════════════════════════════════════════"
