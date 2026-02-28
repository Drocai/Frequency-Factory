# Frequency Factory — YouTube 24/7 Live Stream

Continuously streams approved tracks to a YouTube Live RTMP endpoint. Artists submit tracks, admins approve them, and this pipeline builds a playlist and pushes it as a looping live stream.

## Prerequisites

- **Node.js** 18+
- **ffmpeg** installed on the server (`sudo apt install ffmpeg`)
- A **Supabase** project with the `approved_tracks` table (see migration below)
- A **YouTube** channel with live-streaming enabled and a stream key

## Setup

```bash
cd stream/

# Install dependencies
npm install @supabase/supabase-js dotenv

# Create your env file
cp .env.example .env
# Edit .env with your real credentials
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Yes | Supabase **service role** key (not the anon key) |
| `YOUTUBE_STREAM_KEY` | Yes | Stream key from YouTube Studio → Go Live |
| `YOUTUBE_RTMP_URL` | No | Defaults to `rtmp://a.rtmp.youtube.com/live2` |

### Database Migration

Run the migration against your Supabase project to create the `approved_tracks` table:

```bash
# Via Supabase CLI
supabase db push

# Or manually in the Supabase SQL Editor — paste the contents of:
# migrations/create_approved_tracks_table.sql
```

## Usage

### 1. Build the playlist

Queries Supabase for all approved tracks and writes `playlist.m3u8`:

```bash
node build-playlist.js
```

### 2. Start the stream

Reads the playlist and pushes a continuous loop to YouTube via ffmpeg:

```bash
node start-stream.js
```

The stream will auto-restart if ffmpeg exits unexpectedly.

### Custom overlay

Place an `overlay.png` (1280×720 recommended) in this directory to display a branded image on the stream. If no overlay is provided, a solid black frame is used.

## Running on a VPS

### Quick start (Ubuntu/Debian)

```bash
# Install system dependencies
sudo apt update && sudo apt install -y ffmpeg nodejs npm

# Clone the repo and set up
git clone https://github.com/Drocai/Frequency-Factory.git
cd Frequency-Factory/stream
npm install @supabase/supabase-js dotenv
cp .env.example .env
nano .env  # fill in credentials

# Build playlist and start streaming
node build-playlist.js
node start-stream.js
```

### Run as a background service (systemd)

Create `/etc/systemd/system/ff-stream.service`:

```ini
[Unit]
Description=Frequency Factory YouTube Live Stream
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/home/deploy/Frequency-Factory/stream
ExecStartPre=/usr/bin/node build-playlist.js
ExecStart=/usr/bin/node start-stream.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ff-stream
sudo systemctl start ff-stream

# Check status / logs
sudo systemctl status ff-stream
journalctl -u ff-stream -f
```

### Refreshing the playlist

To pick up newly approved tracks without restarting the stream:

```bash
# Rebuild the playlist
node build-playlist.js

# Restart just the stream service
sudo systemctl restart ff-stream
```

## Architecture

```
Artist submits track
       ↓
Admin approves in dashboard
       ↓
approved_tracks table (Supabase)
       ↓
build-playlist.js → playlist.m3u8
       ↓
start-stream.js → ffmpeg → YouTube RTMP
       ↓
24/7 live stream on YouTube
```
