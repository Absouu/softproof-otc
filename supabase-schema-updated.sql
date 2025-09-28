-- ============================================================================
-- SoftProof OTC Schema Migration (idempotent)
-- Includes:
--   * Profiles (global contact info)
--   * Proofs & proof_sessions
--   * User wallets with RLS
--   * Wallet profiles (per-wallet overrides & bundles)
--   * Intermediaries (delegates) & wallet assignments
--   * Idempotent policy creation (safe to rerun)
-- ============================================================================

-- Enable UUID extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (global contacts)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  email_social TEXT,
  telegram TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Idempotent policy helpers --------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile') THEN
    DROP POLICY "Users can view own profile" ON profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    DROP POLICY "Users can update own profile" ON profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile') THEN
    DROP POLICY "Users can insert own profile" ON profiles;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ---------------------------------------------------------------------------
-- proofs & proof_sessions (existing structure preserved)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proofs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  chain TEXT NOT NULL,
  token TEXT NOT NULL,
  challenge_amount DECIMAL NOT NULL,
  deposit_address TEXT NOT NULL,
  tx_hash TEXT,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proofs' AND policyname = 'Users can view own proofs') THEN
    DROP POLICY "Users can view own proofs" ON proofs;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proofs' AND policyname = 'Users can insert own proofs') THEN
    DROP POLICY "Users can insert own proofs" ON proofs;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proofs' AND policyname = 'Users can view own proofs'
  ) THEN
    CREATE POLICY "Users can view own proofs" ON proofs
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proofs' AND policyname = 'Anyone can view proofs for published profiles'
  ) THEN
    CREATE POLICY "Anyone can view proofs for published profiles" ON proofs
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM wallet_profiles wp
          WHERE wp.proof_id = id AND wp.published IS TRUE
        )
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proofs' AND policyname = 'Users can insert own proofs'
  ) THEN
    CREATE POLICY "Users can insert own proofs" ON proofs
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_proofs_user_id ON proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_proofs_verified_at ON proofs(verified_at);

ALTER TABLE IF EXISTS proofs
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Keep last-modified timestamp for proofs (used by API updates)
ALTER TABLE IF EXISTS proofs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TABLE IF NOT EXISTS proof_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  expected_amount DECIMAL NOT NULL,
  deposit_address TEXT NOT NULL,
  claimed_wallet TEXT NOT NULL,
  chain TEXT NOT NULL,
  token TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  tx_hash TEXT,
  confirmations INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE proof_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proof_sessions' AND policyname = 'Users can view own proof sessions') THEN
    DROP POLICY "Users can view own proof sessions" ON proof_sessions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proof_sessions' AND policyname = 'Users can insert own proof sessions') THEN
    DROP POLICY "Users can insert own proof sessions" ON proof_sessions;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proof_sessions' AND policyname = 'Users can update own proof sessions') THEN
    DROP POLICY "Users can update own proof sessions" ON proof_sessions;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proof_sessions' AND policyname = 'Users can view own proof sessions'
  ) THEN
    CREATE POLICY "Users can view own proof sessions" ON proof_sessions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proof_sessions' AND policyname = 'Users can insert own proof sessions'
  ) THEN
    CREATE POLICY "Users can insert own proof sessions" ON proof_sessions
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'proof_sessions' AND policyname = 'Users can update own proof sessions'
  ) THEN
    CREATE POLICY "Users can update own proof sessions" ON proof_sessions
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_proof_sessions_user_id ON proof_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_proof_sessions_session_id ON proof_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_proof_sessions_deposit_address ON proof_sessions(deposit_address);

-- ---------------------------------------------------------------------------
-- user_wallets (receive-only keys)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_wallets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  address TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, chain)
);

ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_wallets' AND policyname = 'Users can view own wallets') THEN
    DROP POLICY "Users can view own wallets" ON user_wallets;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_wallets' AND policyname = 'Users can insert own wallets') THEN
    DROP POLICY "Users can insert own wallets" ON user_wallets;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_wallets' AND policyname = 'Users can view own wallets'
  ) THEN
    CREATE POLICY "Users can view own wallets" ON user_wallets
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_wallets' AND policyname = 'Users can insert own wallets'
  ) THEN
    CREATE POLICY "Users can insert own wallets" ON user_wallets
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id_chain ON user_wallets(user_id, chain);

-- ---------------------------------------------------------------------------
-- wallet_profiles (per-wallet overrides & bundles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  proof_id UUID REFERENCES proofs(id) ON DELETE CASCADE,
  publish_mode TEXT DEFAULT 'per_wallet', -- per_wallet | bundle
  bundle_id UUID,
  override_global BOOLEAN DEFAULT FALSE,
  phone TEXT,
  email TEXT,
  telegram TEXT,
  note TEXT,
  share_token TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, proof_id)
);

ALTER TABLE wallet_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Users can view own wallet profiles') THEN
    DROP POLICY "Users can view own wallet profiles" ON wallet_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Users can insert own wallet profiles') THEN
    DROP POLICY "Users can insert own wallet profiles" ON wallet_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Users can update own wallet profiles') THEN
    DROP POLICY "Users can update own wallet profiles" ON wallet_profiles;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Users can delete own wallet profiles') THEN
    DROP POLICY "Users can delete own wallet profiles" ON wallet_profiles;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Users can view own wallet profiles'
  ) THEN
    CREATE POLICY "Users can view own wallet profiles" ON wallet_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Anyone can view published wallet profiles'
  ) THEN
    CREATE POLICY "Anyone can view published wallet profiles" ON wallet_profiles
      FOR SELECT USING (published IS TRUE);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Users can insert own wallet profiles'
  ) THEN
    CREATE POLICY "Users can insert own wallet profiles" ON wallet_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Users can update own wallet profiles'
  ) THEN
    CREATE POLICY "Users can update own wallet profiles" ON wallet_profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_profiles' AND policyname = 'Users can delete own wallet profiles'
  ) THEN
    CREATE POLICY "Users can delete own wallet profiles" ON wallet_profiles
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallet_profiles_user_id ON wallet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_profiles_proof_id ON wallet_profiles(proof_id);
CREATE INDEX IF NOT EXISTS idx_wallet_profiles_bundle_id ON wallet_profiles(bundle_id);
CREATE INDEX IF NOT EXISTS idx_wallet_profiles_published ON wallet_profiles(user_id, published);

-- ---------------------------------------------------------------------------
-- intermediaries (delegates) & wallet assignments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intermediaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  supabase_user_id UUID, -- filled once invite accepted
  status TEXT DEFAULT 'pending', -- pending | accepted | revoked
  invite_token TEXT,
  role TEXT DEFAULT 'mandate',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE intermediaries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'intermediaries' AND policyname = 'Users can manage own intermediaries') THEN
    DROP POLICY "Users can manage own intermediaries" ON intermediaries;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'intermediaries' AND policyname = 'Users can manage own intermediaries'
  ) THEN
    CREATE POLICY "Users can manage own intermediaries" ON intermediaries
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_intermediaries_user_id ON intermediaries(user_id);
CREATE INDEX IF NOT EXISTS idx_intermediaries_token ON intermediaries(invite_token);

ALTER TABLE IF EXISTS intermediaries
  ADD COLUMN IF NOT EXISTS note TEXT;

CREATE TABLE IF NOT EXISTS wallet_intermediaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proof_id UUID REFERENCES proofs(id) ON DELETE CASCADE,
  intermediary_id UUID REFERENCES intermediaries(id) ON DELETE CASCADE,
  scope TEXT DEFAULT 'some', -- one | some | all
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (proof_id, intermediary_id)
);

ALTER TABLE wallet_intermediaries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_intermediaries' AND policyname = 'Users can manage wallet intermediaries') THEN
    DROP POLICY "Users can manage wallet intermediaries" ON wallet_intermediaries;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_intermediaries' AND policyname = 'Users can manage wallet intermediaries'
  ) THEN
    CREATE POLICY "Users can manage wallet intermediaries" ON wallet_intermediaries
      USING (
        auth.uid() = (
          SELECT user_id FROM proofs WHERE proofs.id = wallet_intermediaries.proof_id
        )
      )
      WITH CHECK (
        auth.uid() = (
          SELECT user_id FROM proofs WHERE proofs.id = wallet_intermediaries.proof_id
        )
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallet_intermediaries_proof_id ON wallet_intermediaries(proof_id);
CREATE INDEX IF NOT EXISTS idx_wallet_intermediaries_intermediary_id ON wallet_intermediaries(intermediary_id);

-- ---------------------------------------------------------------------------
-- wallet_bundles (per-user bundles)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallet_bundles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  telegram TEXT,
  note TEXT,
  override_global BOOLEAN DEFAULT FALSE,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE wallet_bundles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_bundles' AND policyname = 'Users can manage wallet bundles') THEN
    DROP POLICY "Users can manage wallet bundles" ON wallet_bundles;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'wallet_bundles' AND policyname = 'Users can manage wallet bundles'
  ) THEN
    CREATE POLICY "Users can manage wallet bundles" ON wallet_bundles
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallet_bundles_user_id ON wallet_bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_bundles_share_token ON wallet_bundles(share_token);

-- Ensure wallet_profiles has new columns in existing installations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'wallet_profiles' AND column_name = 'bundle_id'
  ) THEN
    ALTER TABLE wallet_profiles ADD COLUMN bundle_id UUID;
  END IF;
END $$;

ALTER TABLE IF EXISTS wallet_profiles
  ADD COLUMN IF NOT EXISTS publish_mode TEXT DEFAULT 'per_wallet',
  ADD COLUMN IF NOT EXISTS override_global BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS telegram TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS share_token TEXT,
  ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'wallet_profiles'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'wallet_profiles_bundle_id_fkey'
  ) THEN
    ALTER TABLE wallet_profiles
      ADD CONSTRAINT wallet_profiles_bundle_id_fkey FOREIGN KEY (bundle_id)
      REFERENCES wallet_bundles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- end of migration
-- ---------------------------------------------------------------------------
