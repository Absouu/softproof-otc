-- SoftProof OTC Database Setup for Supabase
-- Run these commands in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/whhxtqezqlnqczahbwxw/sql

-- ============================================
-- 1. Create profiles table for user social links
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  whatsapp TEXT,
  email_social TEXT,
  telegram TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create proofs table for verification records
-- ============================================
CREATE TABLE IF NOT EXISTS proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  token TEXT NOT NULL,
  challenge_amount DECIMAL(20, 8) NOT NULL,
  deposit_address TEXT NOT NULL,
  tx_hash TEXT,
  invoice_id TEXT,
  verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. Create indexes for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_proofs_user_id ON proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_proofs_address ON proofs(address);
CREATE INDEX IF NOT EXISTS idx_proofs_verified_at ON proofs(verified_at);
CREATE INDEX IF NOT EXISTS idx_proofs_chain ON proofs(chain);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ============================================
-- 4. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. Create RLS policies for profiles table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. Create RLS policies for proofs table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own proofs" ON proofs;
DROP POLICY IF EXISTS "Users can insert own proofs" ON proofs;
DROP POLICY IF EXISTS "Public can view all proofs" ON proofs;

-- Users can view their own proofs
CREATE POLICY "Users can view own proofs" ON proofs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own proofs
CREATE POLICY "Users can insert own proofs" ON proofs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Optional: Allow public to view proofs for shared profiles
-- Uncomment if you want shared profiles to show proofs without auth
-- CREATE POLICY "Public can view all proofs" ON proofs
--   FOR SELECT
--   USING (true);

-- ============================================
-- 7. Create a function to automatically update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Create trigger for auto-updating timestamps
-- ============================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Create a view for user statistics (optional)
-- ============================================
CREATE OR REPLACE VIEW user_proof_stats AS
SELECT
  user_id,
  COUNT(*) as total_proofs,
  COUNT(DISTINCT address) as unique_addresses,
  COUNT(DISTINCT chain) as chains_used,
  MAX(verified_at) as last_proof_at,
  MIN(verified_at) as first_proof_at
FROM proofs
GROUP BY user_id;

-- ============================================
-- 10. Grant permissions (Supabase handles this automatically)
-- ============================================
-- These are handled by Supabase RLS policies above

-- ============================================
-- VERIFICATION QUERIES - Run these to verify setup
-- ============================================

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'proofs');

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'proofs');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'proofs');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If all commands run successfully, you should see:
-- ✅ 2 tables created (profiles, proofs)
-- ✅ 5 indexes created
-- ✅ RLS enabled on both tables
-- ✅ 5 security policies created
-- ✅ Trigger for auto-updating timestamps
-- ✅ Optional statistics view created

-- Your database is now ready for SoftProof OTC!
