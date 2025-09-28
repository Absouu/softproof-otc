import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'url';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Missing token' });
  }

  const { query } = parse(req.url, true);
  const mode = query.mode || 'wallet';

  if (mode === 'bundle') {
    const { data, error } = await supabase
      .from('wallet_profiles')
      .select('phone, email, telegram, note, proofs(address, chain, token, challenge_amount, verified_at, tx_hash)')
      .eq('share_token', token)
      .eq('published', true)
      .eq('publish_mode', 'bundle');
    if (error) return res.status(400).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Bundle not found' });
    return res.json({ bundle: data });
  }

  const { data, error } = await supabase
    .from('wallet_profiles')
    .select('phone, email, telegram, note, proofs(address, chain, token, challenge_amount, verified_at, tx_hash)')
    .eq('share_token', token)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  return res.json({ profile: data });
}
