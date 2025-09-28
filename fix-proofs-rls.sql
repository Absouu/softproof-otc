-- Fix RLS policies for proofs table to allow anonymous access to published profiles
-- This allows the wallet_profile_view API to work with the proofs!inner join

-- Add public SELECT policy for proofs table
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'proofs' 
    AND policyname = 'Allow public read for published profiles'
  ) THEN
    CREATE POLICY "Allow public read for published profiles" ON "public"."proofs"
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM wallet_profiles 
        WHERE wallet_profiles.proof_id = proofs.id 
        AND wallet_profiles.published = true
      )
    );
  END IF;
END $$;
