-- ============================================================
-- now_playing table for live stream sync
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS now_playing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_name text NOT NULL,
  track_title text NOT NULL,
  cover_url text,
  track_id uuid,
  started_at timestamptz DEFAULT now()
);

-- Only keep 1 row (the current track) — use upsert with a fixed id
-- We use a singleton pattern: always upsert on the same fixed id
ALTER TABLE now_playing ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads (website visitors can see what's playing)
CREATE POLICY "Anyone can read now_playing"
  ON now_playing FOR SELECT
  USING (true);

-- Allow service role to update (stream server writes to it)
CREATE POLICY "Service role can manage now_playing"
  ON now_playing FOR ALL
  USING (true)
  WITH CHECK (true);

-- Enable realtime for now_playing
ALTER PUBLICATION supabase_realtime ADD TABLE now_playing;

-- Seed with an initial "offline" row using a fixed UUID so we always upsert the same row
INSERT INTO now_playing (id, artist_name, track_title, started_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Frequency Factory',
  'Stream Starting Soon...',
  now()
);

-- Also enable realtime on tracks table for live rating updates
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;
