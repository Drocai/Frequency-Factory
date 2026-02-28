#!/usr/bin/env node

/**
 * build-playlist.js
 *
 * Queries Supabase for all approved tracks and writes an ffmpeg-compatible
 * playlist file (playlist.m3u8) that can be fed into start-stream.js.
 *
 * Usage:  node build-playlist.js
 * Output: stream/playlist.m3u8
 */

const { createClient } = require("@supabase/supabase-js");
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function buildPlaylist() {
  console.log("Fetching approved tracks from Supabase...");

  const { data: tracks, error } = await supabase
    .from("approved_tracks")
    .select("id, artist_name, track_title, file_url")
    .eq("approved", true)
    .order("approved_at", { ascending: true });

  if (error) {
    console.error("Supabase query failed:", error.message);
    process.exit(1);
  }

  if (!tracks || tracks.length === 0) {
    console.warn("No approved tracks found. Playlist will be empty.");
  }

  console.log(`Found ${tracks.length} approved track(s).`);

  // Build an ffmpeg concat-demuxer compatible file list.
  // Format: https://trac.ffmpeg.org/wiki/Concatenate#demuxer
  const lines = ["# Frequency Factory — 24/7 Stream Playlist", `# Generated ${new Date().toISOString()}`, `# ${tracks.length} track(s)`, ""];

  for (const track of tracks) {
    lines.push(`# ${track.artist_name} — ${track.track_title}`);
    lines.push(`file '${track.file_url}'`);
    lines.push("");
  }

  const outPath = path.resolve(__dirname, "playlist.m3u8");
  fs.writeFileSync(outPath, lines.join("\n"), "utf-8");
  console.log(`Playlist written to ${outPath}`);

  // Mark tracks as added_to_stream
  const ids = tracks.map((t) => t.id);
  if (ids.length > 0) {
    const { error: updateError } = await supabase
      .from("approved_tracks")
      .update({ added_to_stream: true })
      .in("id", ids);

    if (updateError) {
      console.warn("Could not mark tracks as added_to_stream:", updateError.message);
    } else {
      console.log(`Marked ${ids.length} track(s) as added_to_stream.`);
    }
  }
}

buildPlaylist().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
