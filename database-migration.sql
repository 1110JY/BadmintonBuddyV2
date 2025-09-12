-- Migration script to add device_id columns to existing tables
-- Run this in your Supabase SQL Editor

-- Step 1: Add device_id columns to existing tables
ALTER TABLE players ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Step 2: Set a default device_id for existing data (so users don't lose their data)
-- This will assign all existing data to a 'legacy' device ID
UPDATE players SET device_id = 'legacy_device_migration' WHERE device_id IS NULL;
UPDATE sessions SET device_id = 'legacy_device_migration' WHERE device_id IS NULL;

-- Step 3: Make device_id NOT NULL for future records
ALTER TABLE players ALTER COLUMN device_id SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN device_id SET NOT NULL;

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS players_device_id_idx ON players(device_id);
CREATE INDEX IF NOT EXISTS sessions_device_id_idx ON sessions(device_id);

-- Step 5: Update policies to be device-specific (optional - the app handles filtering)
DROP POLICY IF EXISTS "Enable all operations for players" ON players;
DROP POLICY IF EXISTS "Enable all operations for sessions" ON sessions;
DROP POLICY IF EXISTS "Enable device-specific operations for players" ON players;
DROP POLICY IF EXISTS "Enable device-specific operations for sessions" ON sessions;

-- Create new device-specific policies
CREATE POLICY "Enable device-specific operations for players" ON players
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable device-specific operations for sessions" ON sessions
FOR ALL USING (true) WITH CHECK (true);

-- Display results
SELECT 'Migration completed successfully!' as status;