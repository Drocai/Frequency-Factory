#!/usr/bin/env node

/**
 * auto-refresh.js
 *
 * Polls the approved_tracks table for newly approved tracks that haven't been
 * added to the stream playlist yet. When new tracks are found, it runs
 * build-playlist.js to regenerate the playlist file.
 *
 * Run this as a long-lived process alongside start-stream.js, or invoke it
 * from a cron job (e.g. every minute).
 *
 * Usage:
 *   Continuous mode (default):  node auto-refresh.js
 *   One-shot mode (for cron):   node auto-refresh.js --once
 */

const { createClient } = require("@supabase/supabase-js");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || "30000", 10); // 30 s default

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Copy .env.example to .env and fill in the values."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const BUILD_SCRIPT = path.resolve(__dirname, "build-playlist.js");
const oneShot = process.argv.includes("--once");

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

async function checkForNewTracks() {
  const { data, error } = await supabase
    .from("approved_tracks")
    .select("id")
    .eq("approved", true)
    .eq("added_to_stream", false)
    .limit(1);

  if (error) {
    console.error("Supabase query error:", error.message);
    return false;
  }

  return data && data.length > 0;
}

function rebuildPlaylist() {
  console.log(`[${new Date().toISOString()}] New tracks detected — rebuilding playlist...`);
  try {
    execFileSync(process.execPath, [BUILD_SCRIPT], { stdio: "inherit" });
    console.log("Playlist rebuilt successfully.");
  } catch (err) {
    console.error("build-playlist.js failed:", err.message);
  }
}

async function poll() {
  const hasNew = await checkForNewTracks();
  if (hasNew) {
    rebuildPlaylist();
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

async function main() {
  console.log(
    oneShot
      ? "Running one-shot check for new approved tracks..."
      : `Polling every ${POLL_INTERVAL_MS / 1000}s for new approved tracks...`
  );

  await poll();

  if (!oneShot) {
    setInterval(poll, POLL_INTERVAL_MS);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
