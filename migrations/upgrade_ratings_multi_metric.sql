-- Add multi-metric columns to ratings table
ALTER TABLE ratings
  ADD COLUMN IF NOT EXISTS hook_strength INTEGER DEFAULT 50 CHECK (hook_strength BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS production_quality INTEGER DEFAULT 50 CHECK (production_quality BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS originality INTEGER DEFAULT 50 CHECK (originality BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS vibe INTEGER DEFAULT 50 CHECK (vibe BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS sync_placement INTEGER DEFAULT NULL CHECK (sync_placement BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS overall_score INTEGER GENERATED ALWAYS AS (
    (hook_strength + production_quality + originality + vibe) / 4
  ) STORED;

-- Add per-metric average columns to tracks table
ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS avg_hook NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS avg_production NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS avg_originality NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS avg_vibe NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS avg_sync NUMERIC(5,2);

-- Aggregation trigger: updates tracks on every rating insert/update
CREATE OR REPLACE FUNCTION update_track_averages()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tracks SET
    rating_count = (SELECT COUNT(*) FROM ratings WHERE track_id = NEW.track_id),
    average_rating = (SELECT ROUND(AVG(
      (hook_strength + production_quality + originality + vibe) / 4.0
    ), 2) FROM ratings WHERE track_id = NEW.track_id),
    avg_hook = (SELECT ROUND(AVG(hook_strength), 2) FROM ratings WHERE track_id = NEW.track_id),
    avg_production = (SELECT ROUND(AVG(production_quality), 2) FROM ratings WHERE track_id = NEW.track_id),
    avg_originality = (SELECT ROUND(AVG(originality), 2) FROM ratings WHERE track_id = NEW.track_id),
    avg_vibe = (SELECT ROUND(AVG(vibe), 2) FROM ratings WHERE track_id = NEW.track_id),
    avg_sync = (SELECT ROUND(AVG(sync_placement), 2) FROM ratings
                WHERE track_id = NEW.track_id AND sync_placement IS NOT NULL)
  WHERE id = NEW.track_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_track_averages ON ratings;
CREATE TRIGGER trigger_update_track_averages
  AFTER INSERT OR UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_track_averages();

-- Handle DELETE: recalculate averages when a rating is removed
CREATE OR REPLACE FUNCTION update_track_averages_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tracks SET
    rating_count = (SELECT COUNT(*) FROM ratings WHERE track_id = OLD.track_id),
    average_rating = (SELECT ROUND(AVG(
      (hook_strength + production_quality + originality + vibe) / 4.0
    ), 2) FROM ratings WHERE track_id = OLD.track_id),
    avg_hook = (SELECT ROUND(AVG(hook_strength), 2) FROM ratings WHERE track_id = OLD.track_id),
    avg_production = (SELECT ROUND(AVG(production_quality), 2) FROM ratings WHERE track_id = OLD.track_id),
    avg_originality = (SELECT ROUND(AVG(originality), 2) FROM ratings WHERE track_id = OLD.track_id),
    avg_vibe = (SELECT ROUND(AVG(vibe), 2) FROM ratings WHERE track_id = OLD.track_id),
    avg_sync = (SELECT ROUND(AVG(sync_placement), 2) FROM ratings
                WHERE track_id = OLD.track_id AND sync_placement IS NOT NULL)
  WHERE id = OLD.track_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_track_averages_on_delete ON ratings;
CREATE TRIGGER trigger_update_track_averages_on_delete
  AFTER DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_track_averages_on_delete();
