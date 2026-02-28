-- Create submissions table for the stream submission → approval pipeline
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_name TEXT NOT NULL,
  track_title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  email TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  submission_status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_submission_status ON submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_submissions_payment_status ON submissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Submissions are viewable by everyone"
  ON submissions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert submissions"
  ON submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only service role can update submissions"
  ON submissions FOR UPDATE
  USING (auth.role() = 'service_role');
