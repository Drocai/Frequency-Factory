-- Run this in the Supabase SQL Editor if admin operations (approve/reject/delete) fail.
-- This makes tracks and ratings fully accessible via the anon key.
-- For production, replace with Supabase Auth-based policies.

-- TRACKS: allow all operations for anon
DROP POLICY IF EXISTS "Public can view approved tracks" ON tracks;
DROP POLICY IF EXISTS "Public can insert tracks" ON tracks;
DROP POLICY IF EXISTS "Public can read all tracks" ON tracks;
DROP POLICY IF EXISTS "Public can update tracks" ON tracks;
DROP POLICY IF EXISTS "Public can delete tracks" ON tracks;

CREATE POLICY "Public can read all tracks"
  ON tracks FOR SELECT USING (true);

CREATE POLICY "Public can insert tracks"
  ON tracks FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update tracks"
  ON tracks FOR UPDATE USING (true);

CREATE POLICY "Public can delete tracks"
  ON tracks FOR DELETE USING (true);

-- RATINGS: allow all operations for anon
DROP POLICY IF EXISTS "Public can read ratings" ON ratings;
DROP POLICY IF EXISTS "Public can insert ratings" ON ratings;
DROP POLICY IF EXISTS "Public can update ratings" ON ratings;

CREATE POLICY "Public can read ratings"
  ON ratings FOR SELECT USING (true);

CREATE POLICY "Public can insert ratings"
  ON ratings FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update ratings"
  ON ratings FOR UPDATE USING (true);

CREATE POLICY "Public can delete ratings"
  ON ratings FOR DELETE USING (true);
