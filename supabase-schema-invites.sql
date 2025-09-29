-- SoftProof OTC v2.1 - Advanced Link Sharing System (Papermark/DocSend Style)
-- Run these commands in your Supabase SQL Editor

-- ============================================
-- 1. Create invites table for link management
-- ============================================
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  link_token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Gating options
  is_gated BOOLEAN DEFAULT false,
  gate_type TEXT CHECK (gate_type IN ('password', 'email', 'none')) DEFAULT 'none',
  gate_password TEXT, -- hashed password if gate_type = 'password'
  
  -- Expiry options
  expiry_type TEXT CHECK (expiry_type IN ('usage', 'inactivity', 'fixed', 'none')) DEFAULT 'none',
  max_uses INTEGER DEFAULT 10, -- for usage-based expiry
  inactivity_days INTEGER DEFAULT 7, -- for inactivity-based expiry
  fixed_days INTEGER DEFAULT 14, -- for fixed expiry
  expires_at TIMESTAMPTZ,
  
  -- Usage tracking
  view_count INTEGER DEFAULT 0,
  max_views INTEGER DEFAULT 10,
  last_viewed_at TIMESTAMPTZ,
  
  -- Status
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Proof associations (JSON array of proof IDs)
  proof_ids JSONB DEFAULT '[]'::jsonb,
  
  -- Geo restrictions (optional)
  geo_restrictions JSONB DEFAULT '[]'::jsonb,
  
  -- Email notifications
  notify_on_views BOOLEAN DEFAULT true,
  notify_on_expiry BOOLEAN DEFAULT true,
  notify_email TEXT
);

-- ============================================
-- 2. Create invite_views table for detailed tracking
-- ============================================
CREATE TABLE IF NOT EXISTS invite_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES invites(id) ON DELETE CASCADE,
  
  -- Anonymous tracking
  hashed_ip TEXT NOT NULL, -- SHA-256 hash of IP for fraud detection
  country_code TEXT,
  city TEXT,
  user_agent_hash TEXT, -- Hash of user agent for device fingerprinting
  
  -- Timing
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  session_duration INTEGER, -- seconds spent on page
  
  -- Referrer (optional)
  referrer_domain TEXT,
  
  -- Device info
  device_type TEXT, -- mobile, desktop, tablet
  browser TEXT,
  os TEXT
);

-- ============================================
-- 3. Create invite_auth table for gated access
-- ============================================
CREATE TABLE IF NOT EXISTS invite_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES invites(id) ON DELETE CASCADE,
  
  -- Auth type
  auth_type TEXT CHECK (auth_type IN ('password', 'email')) NOT NULL,
  
  -- Email auth
  email TEXT,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  email_verified_at TIMESTAMPTZ,
  
  -- Password auth
  password_hash TEXT, -- for password-protected links
  
  -- Session tracking
  session_token TEXT UNIQUE,
  session_expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Rate limiting
  access_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT false,
  locked_until TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invites_owner_id ON invites(owner_id);
CREATE INDEX IF NOT EXISTS idx_invites_link_token ON invites(link_token);
CREATE INDEX IF NOT EXISTS idx_invites_expires_at ON invites(expires_at);
CREATE INDEX IF NOT EXISTS idx_invites_is_revoked ON invites(is_revoked);
CREATE INDEX IF NOT EXISTS idx_invite_views_invite_id ON invite_views(invite_id);
CREATE INDEX IF NOT EXISTS idx_invite_views_viewed_at ON invite_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_invite_views_hashed_ip ON invite_views(hashed_ip);
CREATE INDEX IF NOT EXISTS idx_invite_auth_invite_id ON invite_auth(invite_id);
CREATE INDEX IF NOT EXISTS idx_invite_auth_session_token ON invite_auth(session_token);

-- ============================================
-- 5. Enable RLS on new tables
-- ============================================
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_auth ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS policies for invites
-- ============================================

-- Owners can manage their own invites
CREATE POLICY "Owners can manage own invites" ON invites
  FOR ALL
  USING (auth.uid() = owner_id);

-- Public can view non-revoked, non-expired invites
CREATE POLICY "Public can view active invites" ON invites
  FOR SELECT
  USING (
    is_revoked = false 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_views IS NULL OR view_count < max_views)
  );

-- ============================================
-- 7. Create RLS policies for invite_views
-- ============================================

-- Public can insert view records (for tracking)
CREATE POLICY "Public can insert view records" ON invite_views
  FOR INSERT
  WITH CHECK (true);

-- Owners can view view records for their invites
CREATE POLICY "Owners can view invite analytics" ON invite_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invites 
      WHERE invites.id = invite_views.invite_id 
      AND invites.owner_id = auth.uid()
    )
  );

-- ============================================
-- 8. Create RLS policies for invite_auth
-- ============================================

-- Public can insert auth records
CREATE POLICY "Public can insert auth records" ON invite_auth
  FOR INSERT
  WITH CHECK (true);

-- Public can update auth records (for session management)
CREATE POLICY "Public can update auth sessions" ON invite_auth
  FOR UPDATE
  USING (true);

-- ============================================
-- 9. Create functions for smart expiry
-- ============================================

-- Function to check if invite should expire based on inactivity
CREATE OR REPLACE FUNCTION check_inactivity_expiry()
RETURNS void AS $$
BEGIN
  UPDATE invites 
  SET is_revoked = true, 
      revoked_at = NOW(), 
      revoked_reason = 'Inactivity expiry'
  WHERE expiry_type = 'inactivity' 
    AND is_revoked = false
    AND last_viewed_at IS NOT NULL
    AND last_viewed_at < NOW() - INTERVAL '1 day' * inactivity_days;
END;
$$ LANGUAGE plpgsql;

-- Function to check usage-based expiry
CREATE OR REPLACE FUNCTION check_usage_expiry()
RETURNS void AS $$
BEGIN
  UPDATE invites 
  SET is_revoked = true, 
      revoked_at = NOW(), 
      revoked_reason = 'Usage limit reached'
  WHERE expiry_type = 'usage' 
    AND is_revoked = false
    AND view_count >= max_uses;
END;
$$ LANGUAGE plpgsql;

-- Function to check fixed expiry
CREATE OR REPLACE FUNCTION check_fixed_expiry()
RETURNS void AS $$
BEGIN
  UPDATE invites 
  SET is_revoked = true, 
      revoked_at = NOW(), 
      revoked_reason = 'Fixed expiry reached'
  WHERE expiry_type = 'fixed' 
    AND is_revoked = false
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. Create views for analytics
-- ============================================

-- View for invite analytics
CREATE OR REPLACE VIEW invite_analytics AS
SELECT 
  i.id,
  i.title,
  i.owner_id,
  i.view_count,
  i.max_views,
  i.created_at,
  i.expires_at,
  i.is_revoked,
  
  -- Recent activity (last 24h)
  COUNT(CASE WHEN iv.viewed_at > NOW() - INTERVAL '24 hours' THEN 1 END) as views_24h,
  
  -- Geographic distribution
  COUNT(DISTINCT iv.country_code) as countries_count,
  STRING_AGG(DISTINCT iv.country_code, ', ') as countries,
  
  -- Device breakdown
  COUNT(CASE WHEN iv.device_type = 'mobile' THEN 1 END) as mobile_views,
  COUNT(CASE WHEN iv.device_type = 'desktop' THEN 1 END) as desktop_views,
  
  -- Time analysis
  AVG(iv.session_duration) as avg_session_duration,
  MAX(iv.viewed_at) as last_viewed_at
  
FROM invites i
LEFT JOIN invite_views iv ON i.id = iv.invite_id
GROUP BY i.id, i.title, i.owner_id, i.view_count, i.max_views, 
         i.created_at, i.expires_at, i.is_revoked;

-- ============================================
-- 11. Create triggers for auto-updating timestamps
-- ============================================

-- Trigger for invites
DROP TRIGGER IF EXISTS update_invites_updated_at ON invites;
CREATE TRIGGER update_invites_updated_at
  BEFORE UPDATE ON invites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 12. Create scheduled functions for expiry checks
-- ============================================

-- This would typically be set up as a cron job
-- For now, we'll create functions that can be called manually
CREATE OR REPLACE FUNCTION process_all_expiries()
RETURNS void AS $$
BEGIN
  PERFORM check_inactivity_expiry();
  PERFORM check_usage_expiry();
  PERFORM check_fixed_expiry();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('invites', 'invite_views', 'invite_auth');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('invites', 'invite_views', 'invite_auth');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
-- If all commands run successfully, you should see:
-- ✅ 3 new tables created (invites, invite_views, invite_auth)
-- ✅ 6 new indexes created
-- ✅ RLS enabled on all tables
-- ✅ 4 security policies created
-- ✅ 4 utility functions created
-- ✅ 1 analytics view created
-- ✅ Triggers for auto-updating timestamps

-- Your database is now ready for advanced link sharing!
