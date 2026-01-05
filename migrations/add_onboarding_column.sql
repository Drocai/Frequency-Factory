-- Add onboarding column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding ON users(has_completed_onboarding);
