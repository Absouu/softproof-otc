import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all wallet profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('wallet_profiles')
      .select('id, user_id, share_token, published, phone, email, telegram, note')
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      return res.status(500).json({ error: profilesError.message });
    }

    // Get all proofs
    const { data: proofs, error: proofsError } = await supabase
      .from('proofs')
      .select('id, user_id, address, chain, token, verified_at')
      .order('created_at', { ascending: false });
    
    if (proofsError) {
      return res.status(500).json({ error: proofsError.message });
    }

    res.status(200).json({
      profiles: profiles || [],
      proofs: proofs || [],
      totalProfiles: profiles?.length || 0,
      totalProofs: proofs?.length || 0,
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Debug failed',
      details: error.message 
    });
  }
}
