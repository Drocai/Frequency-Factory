-- Live stream session, check-in, and chat tables
-- Enables streamer to see who's active, keep viewers engaged, and reward participation

-- ============================================
-- LIVE SESSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT 'Live Stream',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  viewer_count INT DEFAULT 0,
  peak_viewers INT DEFAULT 0,
  total_checkins INT DEFAULT 0,
  total_messages INT DEFAULT 0
);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read live sessions"
  ON live_sessions FOR SELECT
  USING (true);

CREATE POLICY "Public can insert live sessions"
  ON live_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update live sessions"
  ON live_sessions FOR UPDATE
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;

-- ============================================
-- LIVE CHECK-INS (presence tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS live_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id INT NOT NULL,
  user_name TEXT,
  avatar_name TEXT DEFAULT 'BeatMaster',
  checked_in_at TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  activity_score INT DEFAULT 0,
  messages_sent INT DEFAULT 0
);

CREATE INDEX idx_live_checkins_session ON live_checkins(session_id);
CREATE INDEX idx_live_checkins_user ON live_checkins(user_id);
CREATE INDEX idx_live_checkins_active ON live_checkins(session_id, is_active);

ALTER TABLE live_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read live checkins"
  ON live_checkins FOR SELECT
  USING (true);

CREATE POLICY "Public can insert live checkins"
  ON live_checkins FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update live checkins"
  ON live_checkins FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete live checkins"
  ON live_checkins FOR DELETE
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE live_checkins;

-- ============================================
-- LIVE CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id INT NOT NULL,
  user_name TEXT,
  avatar_name TEXT DEFAULT 'BeatMaster',
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_live_chat_session ON live_chat_messages(session_id);
CREATE INDEX idx_live_chat_created ON live_chat_messages(session_id, created_at DESC);

ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read live chat"
  ON live_chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Public can insert live chat"
  ON live_chat_messages FOR INSERT
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE live_chat_messages;

-- ============================================
-- LIVE AUDIO REPORTS (viewer feedback on audio)
-- ============================================
CREATE TABLE IF NOT EXISTS live_audio_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id INT NOT NULL,
  user_name TEXT,
  report_type TEXT DEFAULT 'cant_hear',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audio_reports_session ON live_audio_reports(session_id);

ALTER TABLE live_audio_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read audio reports"
  ON live_audio_reports FOR SELECT
  USING (true);

CREATE POLICY "Public can insert audio reports"
  ON live_audio_reports FOR INSERT
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE live_audio_reports;

-- Add audio_status column to live_sessions
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS audio_status TEXT DEFAULT 'unknown';
-- Values: 'live' (audio confirmed), 'muted' (streamer knows it's muted), 'unknown' (default)
ALTER TABLE live_sessions ADD COLUMN IF NOT EXISTS cant_hear_count INT DEFAULT 0;
