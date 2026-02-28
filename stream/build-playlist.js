#!/usr/bin/env node

/**
 * build-playlist.js
 *
 * Queries Supabase for all approved tracks and writes an ffmpeg-compatible
 * playlist file (playlist.m3u8) that can be fed into start-stream.js.
 *
 * Tries approved_tracks first, falls back to the tracks table (status=approved).
 * Uses curl as a fallback when the Supabase JS client can't connect.
 *
 * Usage:  node build-playlist.js
 * Output: stream/playlist.m3u8
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY. Copy .env.example to .env and fill in the values."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchWithSupabaseJS(table, selectCols, filters, orderCol) {
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let query = supabase.from(table).select(selectCols);
  for (const [col, val] of Object.entries(filters)) {
    query = query.eq(col, val);
  }
  if (orderCol) query = query.order(orderCol, { ascending: true });

  return query;
}

function fetchWithCurl(table, selectCols, filters) {
  const params = new URLSearchParams({ select: selectCols });
  for (const [col, val] of Object.entries(filters)) {
    params.append(col, `eq.${val}`);
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params.toString()}`;
  const result = execSync(
    `curl -s '${url}' -H 'apikey: ${SUPABASE_SERVICE_KEY}' -H 'Authorization: Bearer ${SUPABASE_SERVICE_KEY}' -H 'Accept-Profile: public'`,
    { encoding: "utf-8" }
  );
  return JSON.parse(result);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function buildPlaylist() {
  let tracks = [];

  // Strategy 1: Try approved_tracks table via JS client
  console.log("Trying approved_tracks table via Supabase JS client...");
  try {
    const { data, error } = await fetchWithSupabaseJS(
      "approved_tracks",
      "id, artist_name, track_title, file_url",
      { approved: true },
      "approved_at"
    );
    if (!error && data && data.length > 0) {
      tracks = data;
      console.log(`Found ${tracks.length} track(s) in approved_tracks.`);
    } else {
      throw new Error(error ? error.message : "No tracks found");
    }
  } catch (err) {
    console.log(`approved_tracks via JS failed: ${err.message}`);

    // Strategy 2: Try approved_tracks via curl
    console.log("Trying approved_tracks via curl...");
    try {
      const data = fetchWithCurl(
        "approved_tracks",
        "id,artist_name,track_title,file_url",
        { approved: true }
      );
      if (Array.isArray(data) && data.length > 0) {
        tracks = data;
        console.log(`Found ${tracks.length} track(s) in approved_tracks via curl.`);
      } else {
        throw new Error("No tracks or table not in schema cache");
      }
    } catch (err2) {
      console.log(`approved_tracks via curl failed: ${err2.message}`);

      // Strategy 3: Fall back to tracks table via curl
      console.log("Falling back to tracks table via curl...");
      const data = fetchWithCurl(
        "tracks",
        "id,artist as artist_name,title as track_title,audio_url as file_url",
        { status: "approved" }
      );

      if (Array.isArray(data) && data.length > 0) {
        // The REST API doesn't support column aliases, remap manually
        tracks = data.map((t) => ({
          id: t.id,
          artist_name: t.artist || t.artist_name,
          track_title: t.title || t.track_title,
          file_url: t.audio_url || t.file_url,
        }));
        console.log(`Found ${tracks.length} track(s) in tracks table via curl.`);
      } else {
        console.error("No approved tracks found in any table.");
        process.exit(1);
      }
    }
  }

  console.log(`\nBuilding playlist with ${tracks.length} track(s):\n`);

  // Build an ffmpeg concat-demuxer compatible file list.
  const lines = [
    "# Frequency Factory — 24/7 Stream Playlist",
    `# Generated ${new Date().toISOString()}`,
    `# ${tracks.length} track(s)`,
    "",
  ];

  for (const track of tracks) {
    console.log(`  • ${track.artist_name} — ${track.track_title}`);
    lines.push(`# ${track.artist_name} — ${track.track_title}`);
    lines.push(`file '${track.file_url}'`);
    lines.push("");
  }

  const outPath = path.resolve(__dirname, "playlist.m3u8");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`\nPlaylist written to ${outPath}`);
}

buildPlaylist().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
