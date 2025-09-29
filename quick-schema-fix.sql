-- Quick fix: Add role column to existing profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'wallet_holder' CHECK (role IN ('wallet_holder', 'agent'));

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';

