-- SoftProof OTC v2.0 - Dual Role System Schema
-- Run these commands in your Supabase SQL Editor

-- ============================================
-- 1. Add role field to profiles table
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'wallet_holder' CHECK (role IN ('wallet_holder', 'agent'));

-- ============================================
-- 2. Create agent_assignments table for wallet-agent relationships
-- ============================================
CREATE TABLE IF NOT EXISTS agent_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_holder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_email TEXT, -- Store email for pending assignments
  proof_id UUID REFERENCES proofs(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wallet_holder_id, proof_id)
);

-- ============================================
-- 3. Create client_proof_links table for agent-generated proof links
-- ============================================
CREATE TABLE IF NOT EXISTS client_proof_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiving_address TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  chain TEXT NOT NULL,
  token TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'revoked')),
  client_wallet_address TEXT,
  proof_id UUID REFERENCES proofs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 4. Create indexes for new tables
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agent_assignments_wallet_holder ON agent_assignments(wallet_holder_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent ON agent_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_proof ON agent_assignments(proof_id);
CREATE INDEX IF NOT EXISTS idx_client_proof_links_agent ON client_proof_links(agent_id);
CREATE INDEX IF NOT EXISTS idx_client_proof_links_share_token ON client_proof_links(share_token);
CREATE INDEX IF NOT EXISTS idx_client_proof_links_status ON client_proof_links(status);
CREATE INDEX IF NOT EXISTS idx_client_proof_links_expires_at ON client_proof_links(expires_at);

-- ============================================
-- 5. Enable RLS on new tables
-- ============================================
ALTER TABLE agent_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_proof_links ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS policies for agent_assignments
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own assignments" ON agent_assignments;
DROP POLICY IF EXISTS "Users can update own assignments" ON agent_assignments;
DROP POLICY IF EXISTS "Users can insert own assignments" ON agent_assignments;

-- Users can view assignments where they are either wallet holder or agent
CREATE POLICY "Users can view own assignments" ON agent_assignments
  FOR SELECT
  USING (auth.uid() = wallet_holder_id OR auth.uid() = agent_id);

-- Users can update assignments where they are the agent
CREATE POLICY "Users can update own assignments" ON agent_assignments
  FOR UPDATE
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- Users can insert assignments where they are the wallet holder
CREATE POLICY "Users can insert own assignments" ON agent_assignments
  FOR INSERT
  WITH CHECK (auth.uid() = wallet_holder_id);

-- ============================================
-- 7. Create RLS policies for client_proof_links
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Agents can view own client links" ON client_proof_links;
DROP POLICY IF EXISTS "Agents can update own client links" ON client_proof_links;
DROP POLICY IF EXISTS "Agents can insert own client links" ON client_proof_links;
DROP POLICY IF EXISTS "Public can view active client links" ON client_proof_links;

-- Agents can view their own client proof links
CREATE POLICY "Agents can view own client links" ON client_proof_links
  FOR SELECT
  USING (auth.uid() = agent_id);

-- Agents can update their own client proof links
CREATE POLICY "Agents can update own client links" ON client_proof_links
  FOR UPDATE
  USING (auth.uid() = agent_id)
  WITH CHECK (auth.uid() = agent_id);

-- Agents can insert their own client proof links
CREATE POLICY "Agents can insert own client links" ON client_proof_links
  FOR INSERT
  WITH CHECK (auth.uid() = agent_id);

-- Public can view active client proof links (for verification)
CREATE POLICY "Public can view active client links" ON client_proof_links
  FOR SELECT
  USING (status = 'active' AND expires_at > NOW());

-- ============================================
-- 8. Update existing RLS policies for profiles to include role
-- ============================================

-- Update profiles policies to allow role updates
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 9. Create functions for role management
-- ============================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is agent
CREATE OR REPLACE FUNCTION is_agent(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_uuid) = 'agent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is wallet holder
CREATE OR REPLACE FUNCTION is_wallet_holder(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN get_user_role(user_uuid) = 'wallet_holder';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. Create triggers for auto-updating timestamps
-- ============================================

-- Trigger for agent_assignments
DROP TRIGGER IF EXISTS update_agent_assignments_updated_at ON agent_assignments;
CREATE TRIGGER update_agent_assignments_updated_at
  BEFORE UPDATE ON agent_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. Create views for role-based dashboards
-- ============================================

-- View for wallet holder dashboard
CREATE OR REPLACE VIEW wallet_holder_dashboard AS
SELECT 
  p.user_id,
  p.role,
  COUNT(DISTINCT pr.id) as total_proofs,
  COUNT(DISTINCT aa.id) as agent_assignments,
  MAX(pr.verified_at) as last_proof_at
FROM profiles p
LEFT JOIN proofs pr ON p.user_id = pr.user_id
LEFT JOIN agent_assignments aa ON p.user_id = aa.wallet_holder_id
WHERE p.role = 'wallet_holder'
GROUP BY p.user_id, p.role;

-- View for agent dashboard
CREATE OR REPLACE VIEW agent_dashboard AS
SELECT 
  p.user_id,
  p.role,
  COUNT(DISTINCT aa.id) as total_assignments,
  COUNT(DISTINCT cpl.id) as active_client_links,
  COUNT(DISTINCT CASE WHEN aa.status = 'accepted' THEN aa.id END) as accepted_assignments
FROM profiles p
LEFT JOIN agent_assignments aa ON p.user_id = aa.agent_id
LEFT JOIN client_proof_links cpl ON p.user_id = cpl.agent_id AND cpl.status = 'active'
WHERE p.role = 'agent'
GROUP BY p.user_id, p.role;

-- ============================================
-- 12. Grant necessary permissions
-- ============================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_agent(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_wallet_holder(UUID) TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('agent_assignments', 'client_proof_links');

-- Check if role column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'role';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('agent_assignments', 'client_proof_links');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If all commands run successfully, you should see:
-- ✅ Role column added to profiles
-- ✅ 2 new tables created (agent_assignments, client_proof_links)
-- ✅ 6 new indexes created
-- ✅ RLS enabled on new tables
-- ✅ 7 new security policies created
-- ✅ 3 utility functions created
-- ✅ 2 dashboard views created
-- ✅ Triggers for auto-updating timestamps

-- Your database is now ready for SoftProof OTC v2.0 with dual roles!
