-- Create approved_tracks table for YouTube 24/7 live stream playlist
CREATE TABLE IF NOT EXISTS approved_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  track_title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  added_to_stream BOOLEAN NOT NULL DEFAULT FALSE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_approved_tracks_approved ON approved_tracks(approved);
CREATE INDEX IF NOT EXISTS idx_approved_tracks_added_to_stream ON approved_tracks(added_to_stream);
CREATE INDEX IF NOT EXISTS idx_approved_tracks_submitted_at ON approved_tracks(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE approved_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Approved tracks are viewable by everyone"
  ON approved_tracks FOR SELECT
  USING (true);

CREATE POLICY "Only service role can insert tracks"
  ON approved_tracks FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update tracks"
  ON approved_tracks FOR UPDATE
  USING (auth.role() = 'service_role');
