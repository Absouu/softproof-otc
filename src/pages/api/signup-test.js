import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      return res.status(400).json({ 
        error: 'Signup failed',
        details: error.message 
      });
    }

    res.status(200).json({ 
      message: 'Signup successful',
      user: data.user?.id 
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Signup test failed',
      details: error.message 
    });
  }
}
