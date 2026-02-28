#!/usr/bin/env node

/**
 * start-stream.js
 *
 * Reads stream/playlist.m3u8 (built by build-playlist.js) and pushes a
 * continuous audio loop to a YouTube RTMP endpoint via ffmpeg.
 *
 * The stream displays a static image (stream/overlay.png) while audio plays.
 * If overlay.png is missing a solid black frame is generated automatically.
 *
 * Now-playing sync: When each track starts, the current track info is written
 * to the Supabase `now_playing` table so the website can display it in real time.
 *
 * Required env vars:
 *   YOUTUBE_STREAM_KEY   – your YouTube live-stream key
 *   YOUTUBE_RTMP_URL     – (optional) defaults to rtmp://a.rtmp.youtube.com/live2
 *   SUPABASE_URL         – Supabase project URL
 *   SUPABASE_SERVICE_KEY – Supabase service role key
 *
 * Usage:  node start-stream.js
 */

const { spawn, execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const YOUTUBE_STREAM_KEY = process.env.YOUTUBE_STREAM_KEY;
const YOUTUBE_RTMP_URL =
  process.env.YOUTUBE_RTMP_URL || "rtmp://a.rtmp.youtube.com/live2";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!YOUTUBE_STREAM_KEY) {
  console.error(
    "Missing YOUTUBE_STREAM_KEY. Copy .env.example to .env and fill in the value."
  );
  process.exit(1);
}

const PLAYLIST_PATH = path.resolve(__dirname, "playlist.m3u8");
const OVERLAY_PATH = path.resolve(__dirname, "overlay.png");

if (!fs.existsSync(PLAYLIST_PATH)) {
  console.error(
    "playlist.m3u8 not found. Run `node build-playlist.js` first."
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Parse playlist to extract track metadata
// ---------------------------------------------------------------------------

function parsePlaylist() {
  const content = fs.readFileSync(PLAYLIST_PATH, "utf-8");
  const lines = content.split("\n");
  const tracks = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Comment lines with track info: # Artist — Title
    if (line.startsWith("# ") && line.includes("—")) {
      const match = line.match(/^#\s*(.+?)\s*—\s*(.+)$/);
      if (match) {
        tracks.push({
          artist_name: match[1].trim(),
          track_title: match[2].trim(),
        });
      }
    }
  }

  return tracks;
}

// ---------------------------------------------------------------------------
// Update now_playing in Supabase
// ---------------------------------------------------------------------------

const NOW_PLAYING_ID = "00000000-0000-0000-0000-000000000001";

function updateNowPlaying(track) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("Supabase not configured — skipping now_playing update.");
    return;
  }

  const payload = JSON.stringify({
    id: NOW_PLAYING_ID,
    artist_name: track.artist_name,
    track_title: track.track_title,
    started_at: new Date().toISOString(),
  });

  try {
    execSync(
      `curl -s -X POST '${SUPABASE_URL}/rest/v1/now_playing' ` +
      `-H 'apikey: ${SUPABASE_SERVICE_KEY}' ` +
      `-H 'Authorization: Bearer ${SUPABASE_SERVICE_KEY}' ` +
      `-H 'Content-Type: application/json' ` +
      `-H 'Prefer: resolution=merge-duplicates' ` +
      `-H 'Content-Profile: public' ` +
      `-d '${payload.replace(/'/g, "'\\''")}'`,
      { encoding: "utf-8", timeout: 10000 }
    );
    console.log(`[now_playing] ${track.artist_name} — ${track.track_title}`);
  } catch (err) {
    console.warn("Failed to update now_playing:", err.message);
  }
}

// ---------------------------------------------------------------------------
// Build ffmpeg command
// ---------------------------------------------------------------------------

const rtmpTarget = `${YOUTUBE_RTMP_URL}/${YOUTUBE_STREAM_KEY}`;

function buildArgs() {
  const args = [];

  // -- Video input --------------------------------------------------------
  if (fs.existsSync(OVERLAY_PATH)) {
    // Use provided overlay image, loop it as a continuous video source
    args.push("-loop", "1", "-framerate", "1", "-i", OVERLAY_PATH);
  } else {
    // Generate a 1280x720 black frame as fallback
    args.push(
      "-f", "lavfi",
      "-i", "color=c=black:s=1280x720:r=1"
    );
  }

  // -- Audio input (playlist, looped) -------------------------------------
  args.push(
    "-stream_loop", "-1",        // loop playlist infinitely
    "-f", "concat",
    "-safe", "0",                // allow absolute paths / URLs
    "-i", PLAYLIST_PATH
  );

  // -- Encoding -----------------------------------------------------------
  args.push(
    // Video: re-encode to H.264 baseline for YouTube compatibility
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-tune", "stillimage",
    "-pix_fmt", "yuv420p",
    "-g", "60",                  // keyframe interval (2 s @ 30 fps)
    "-r", "30",

    // Audio: AAC stereo at 128 kbps
    "-c:a", "aac",
    "-b:a", "128k",
    "-ar", "44100",
    "-ac", "2",

    // Shortest = stop when the shorter input ends (won't happen with loops)
    "-shortest",

    // -- ffmpeg progress to stderr (we parse it for track changes) ---------
    "-progress", "pipe:2",

    // -- Output -----------------------------------------------------------
    "-f", "flv",
    rtmpTarget
  );

  return args;
}

// ---------------------------------------------------------------------------
// Track advancement logic
// ---------------------------------------------------------------------------

function startTrackRotation(tracks) {
  if (tracks.length === 0) return;

  let currentIndex = 0;

  // Set the first track as now playing immediately
  updateNowPlaying(tracks[currentIndex]);

  // Estimate track duration (default ~3.5 min per track if we can't detect)
  // We'll use ffprobe to get actual durations
  const durations = tracks.map(() => 210); // default 3.5 min

  function advanceTrack() {
    currentIndex = (currentIndex + 1) % tracks.length;
    updateNowPlaying(tracks[currentIndex]);

    // Schedule next advance
    const duration = durations[currentIndex] * 1000;
    setTimeout(advanceTrack, duration);
  }

  // Try to get actual durations from the playlist file URLs
  const content = fs.readFileSync(PLAYLIST_PATH, "utf-8");
  const fileUrls = content.split("\n")
    .filter(l => l.trim().startsWith("file "))
    .map(l => l.trim().replace(/^file\s+'/, "").replace(/'$/, ""));

  let resolved = 0;
  fileUrls.forEach((url, i) => {
    try {
      const result = execSync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 '${url}'`,
        { encoding: "utf-8", timeout: 15000 }
      ).trim();
      const dur = parseFloat(result);
      if (!isNaN(dur) && dur > 0) {
        durations[i] = dur;
        console.log(`[duration] Track ${i + 1}: ${Math.round(dur)}s`);
      }
    } catch {
      console.log(`[duration] Track ${i + 1}: using default ${durations[i]}s`);
    }
    resolved++;
    if (resolved === fileUrls.length) {
      // All durations resolved, schedule first advance
      const firstDuration = durations[0] * 1000;
      console.log(`[rotation] First track change in ${Math.round(firstDuration / 1000)}s`);
      setTimeout(advanceTrack, firstDuration);
    }
  });

  // If no URLs found, start rotation with defaults
  if (fileUrls.length === 0) {
    setTimeout(advanceTrack, durations[0] * 1000);
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function startStream() {
  const args = buildArgs();
  const tracks = parsePlaylist();

  console.log("Starting ffmpeg stream to YouTube...");
  console.log(`RTMP target: ${YOUTUBE_RTMP_URL}/****`);
  console.log(`Playlist:    ${PLAYLIST_PATH}`);
  console.log(`Overlay:     ${fs.existsSync(OVERLAY_PATH) ? OVERLAY_PATH : "(auto-generated black frame)"}`);
  console.log(`Tracks:      ${tracks.length} track(s) found in playlist`);
  tracks.forEach((t, i) => console.log(`  ${i + 1}. ${t.artist_name} — ${t.track_title}`));
  console.log("---");

  // Start track rotation (updates now_playing in Supabase)
  if (tracks.length > 0) {
    startTrackRotation(tracks);
  }

  const ffmpeg = spawn("ffmpeg", args, { stdio: "inherit" });

  ffmpeg.on("error", (err) => {
    if (err.code === "ENOENT") {
      console.error("ffmpeg not found. Install it:  sudo apt install ffmpeg");
    } else {
      console.error("ffmpeg error:", err.message);
    }
    process.exit(1);
  });

  ffmpeg.on("close", (code) => {
    if (code !== 0) {
      console.error(`ffmpeg exited with code ${code}. Restarting in 5 seconds...`);
      setTimeout(startStream, 5000);
    } else {
      console.log("ffmpeg exited cleanly.");
    }
  });
}

startStream();
