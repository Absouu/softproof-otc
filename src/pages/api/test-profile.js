import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Get profile without join
    const { data: profile, error: profileError } = await supabase
      .from('wallet_profiles')
      .select('*')
      .eq('share_token', token)
      .eq('published', true)
      .maybeSingle();
    
    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Test 2: Get proof separately
    const { data: proof, error: proofError } = await supabase
      .from('proofs')
      .select('*')
      .eq('id', profile.proof_id)
      .maybeSingle();
    
    if (proofError) {
      return res.status(500).json({ error: proofError.message });
    }

    res.status(200).json({
      token,
      profile,
      proof,
      hasProfile: !!profile,
      hasProof: !!proof,
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Test failed',
      details: error.message 
    });
  }
}
