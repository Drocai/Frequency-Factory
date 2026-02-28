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
 * Required env vars:
 *   YOUTUBE_STREAM_KEY   – your YouTube live-stream key
 *   YOUTUBE_RTMP_URL     – (optional) defaults to rtmp://a.rtmp.youtube.com/live2
 *
 * Usage:  node start-stream.js
 */

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const YOUTUBE_STREAM_KEY = process.env.YOUTUBE_STREAM_KEY;
const YOUTUBE_RTMP_URL =
  process.env.YOUTUBE_RTMP_URL || "rtmp://a.rtmp.youtube.com/live2";

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

    // -- Output -----------------------------------------------------------
    "-f", "flv",
    rtmpTarget
  );

  return args;
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

function startStream() {
  const args = buildArgs();
  console.log("Starting ffmpeg stream to YouTube...");
  console.log(`RTMP target: ${YOUTUBE_RTMP_URL}/****`);
  console.log(`Playlist:    ${PLAYLIST_PATH}`);
  console.log(`Overlay:     ${fs.existsSync(OVERLAY_PATH) ? OVERLAY_PATH : "(auto-generated black frame)"}`);
  console.log("---");

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
