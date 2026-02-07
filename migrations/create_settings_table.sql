-- Settings table for OBS overlay current track and app-wide configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed a single settings row
INSERT INTO settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read settings"
  ON settings FOR SELECT
  USING (true);

-- Public update (admin-only in practice via app logic)
CREATE POLICY "Anyone can update settings"
  ON settings FOR UPDATE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE settings;
