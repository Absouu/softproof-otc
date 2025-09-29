import axios from 'axios';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function getAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) return parts[1];
  return '';
}

async function getUserFromToken(token) {
  if (!supabase || !token) return null;
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return null;
    return data?.user || null;
  } catch {
    return null;
  }
}

function createSupabaseForToken(token) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase not configured');
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: token
        ? { Authorization: `Bearer ${token}` }
        : {},
    },
  });
}

// Hash IP for anonymous tracking
function hashIP(ip) {
  return crypto.createHash('sha256').update(ip + 'softproof-salt').digest('hex');
}

// Get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         '127.0.0.1';
}

// Generate secure link token
function generateLinkToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Create JWT for invite access
function createInviteJWT(inviteId, ownerId, quota, expiresAt) {
  return jwt.sign(
    {
      invite_id: inviteId,
      owner_id: ownerId,
      quota: quota,
      expires_at: expiresAt,
      revoked: false
    },
    JWT_SECRET,
    { expiresIn: '30d' } // Max 30 days
  );
}

// Verify invite JWT
function verifyInviteJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const action = req.query.action;

  try {
    // Create invite link
    if (action === 'create_invite') {
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Login required' });
      const userClient = createSupabaseForToken(tokenHeader);

      const {
        title,
        description,
        proof_ids = [],
        is_gated = false,
        gate_type = 'none',
        gate_password,
        expiry_type = 'fixed',
        max_uses = 10,
        inactivity_days = 7,
        fixed_days = 14,
        max_views = 10,
        notify_email
      } = req.body || {};

      if (!title) return res.status(400).json({ error: 'Title is required' });
      if (!Array.isArray(proof_ids) || proof_ids.length === 0) {
        return res.status(400).json({ error: 'At least one proof ID is required' });
      }

      // Calculate expiry date
      let expiresAt = null;
      if (expiry_type === 'fixed') {
        expiresAt = new Date(Date.now() + fixed_days * 24 * 60 * 60 * 1000);
      } else if (expiry_type === 'none') {
        expiresAt = null; // No expiry
      }

      // Generate link token and JWT
      const linkToken = generateLinkToken();
      const inviteJWT = createInviteJWT(null, user.id, { max_uses, current_uses: 0 }, expiresAt);

      // Hash password if provided
      let passwordHash = null;
      if (gate_type === 'password' && gate_password) {
        passwordHash = crypto.createHash('sha256').update(gate_password + 'softproof-salt').digest('hex');
      }

      // Create invite record
      const { data: invite, error } = await userClient
        .from('invites')
        .insert({
          owner_id: user.id,
          link_token: linkToken,
          title,
          description,
          proof_ids: JSON.stringify(proof_ids),
          is_gated,
          gate_type,
          gate_password: passwordHash,
          expiry_type,
          max_uses,
          inactivity_days,
          fixed_days,
          expires_at: expiresAt?.toISOString(),
          max_views,
          notify_email: notify_email || user.email
        })
        .select()
        .single();

      if (error) {
        console.error('Create invite error:', error);
        return res.status(500).json({ error: `Database error: ${error.message}` });
      }

      // Create auth record if gated
      if (is_gated && gate_type !== 'none') {
        await userClient
          .from('invite_auth')
          .insert({
            invite_id: invite.id,
            auth_type: gate_type,
            email: gate_type === 'email' ? notify_email : null,
            password_hash: gate_type === 'password' ? passwordHash : null
          });
      }

      const shareUrl = `${BASE_URL}/invite/${linkToken}`;
      
      res.json({
        success: true,
        invite: {
          id: invite.id,
          link_token: linkToken,
          share_url: shareUrl,
          qr_data: shareUrl,
          expires_at: expiresAt,
          max_uses,
          max_views
        }
      });
      return;
    }

    // Get invite details (public)
    if (action === 'get_invite') {
      const { link_token } = req.body || {};
      if (!link_token) return res.status(400).json({ error: 'Link token required' });

      const { data: invite, error } = await supabase
        .from('invites')
        .select(`
          *,
          invite_auth(*)
        `)
        .eq('link_token', link_token)
        .eq('is_revoked', false)
        .single();

      if (error || !invite) {
        return res.status(404).json({ error: 'Invite not found or expired' });
      }

      // Check expiry
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return res.status(410).json({ error: 'Invite has expired' });
      }

      // Check usage limits
      if (invite.max_views && invite.view_count >= invite.max_views) {
        return res.status(410).json({ error: 'Invite usage limit reached' });
      }

      // Get associated proofs
      const proofIds = JSON.parse(invite.proof_ids || '[]');
      const { data: proofs } = await supabase
        .from('proofs')
        .select(`
          *,
          wallet_profiles(*)
        `)
        .in('id', proofIds);

      res.json({
        invite: {
          id: invite.id,
          title: invite.title,
          description: invite.description,
          is_gated: invite.is_gated,
          gate_type: invite.gate_type,
          proofs: proofs || []
        }
      });
      return;
    }

    // Track invite view
    if (action === 'track_view') {
      const { link_token } = req.body || {};
      if (!link_token) return res.status(400).json({ error: 'Link token required' });

      const clientIP = getClientIP(req);
      const hashedIP = hashIP(clientIP);
      const userAgent = req.headers['user-agent'] || '';
      const userAgentHash = crypto.createHash('sha256').update(userAgent).digest('hex');

      // Get invite
      const { data: invite } = await supabase
        .from('invites')
        .select('id, view_count, max_views')
        .eq('link_token', link_token)
        .eq('is_revoked', false)
        .single();

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      // Check if already at max views
      if (invite.max_views && invite.view_count >= invite.max_views) {
        return res.status(410).json({ error: 'Usage limit reached' });
      }

      // Increment view count
      await supabase
        .from('invites')
        .update({
          view_count: invite.view_count + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', invite.id);

      // Record detailed view
      await supabase
        .from('invite_views')
        .insert({
          invite_id: invite.id,
          hashed_ip: hashedIP,
          user_agent_hash: userAgentHash,
          device_type: userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          browser: userAgent.includes('Chrome') ? 'Chrome' : 'Other',
          os: userAgent.includes('Windows') ? 'Windows' : 'Other'
        });

      res.json({ success: true });
      return;
    }

    // Authenticate gated invite
    if (action === 'auth_invite') {
      const { link_token, password, email } = req.body || {};
      if (!link_token) return res.status(400).json({ error: 'Link token required' });

      // Get invite and auth details
      const { data: invite } = await supabase
        .from('invites')
        .select(`
          *,
          invite_auth(*)
        `)
        .eq('link_token', link_token)
        .eq('is_revoked', false)
        .single();

      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (!invite.is_gated) {
        return res.status(400).json({ error: 'Invite is not gated' });
      }

      const auth = invite.invite_auth?.[0];
      if (!auth) {
        return res.status(500).json({ error: 'Auth configuration not found' });
      }

      // Check rate limiting
      if (auth.is_locked && auth.locked_until && new Date(auth.locked_until) > new Date()) {
        return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
      }

      let isValid = false;

      if (invite.gate_type === 'password' && password) {
        const passwordHash = crypto.createHash('sha256').update(password + 'softproof-salt').digest('hex');
        isValid = passwordHash === auth.password_hash;
      } else if (invite.gate_type === 'email' && email) {
        // For email auth, we'd typically send an OTP
        // For now, we'll just check if email matches
        isValid = email === auth.email;
      }

      if (!isValid) {
        // Update failed attempts
        await supabase
          .from('invite_auth')
          .update({
            access_attempts: auth.access_attempts + 1,
            last_attempt_at: new Date().toISOString(),
            is_locked: (auth.access_attempts + 1) >= 5,
            locked_until: (auth.access_attempts + 1) >= 5 ? 
              new Date(Date.now() + 60 * 60 * 1000).toISOString() : null // Lock for 1 hour
          })
          .eq('id', auth.id);

        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate session token
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await supabase
        .from('invite_auth')
        .update({
          session_token: sessionToken,
          session_expires_at: sessionExpires.toISOString(),
          last_accessed_at: new Date().toISOString(),
          access_attempts: 0, // Reset on successful auth
          is_locked: false,
          locked_until: null
        })
        .eq('id', auth.id);

      res.json({
        success: true,
        session_token: sessionToken,
        expires_at: sessionExpires
      });
      return;
    }

    // Get user's invites
    if (action === 'get_user_invites') {
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Login required' });
      const userClient = createSupabaseForToken(tokenHeader);

      const { data: invites } = await userClient
        .from('invites')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      res.json({ invites: invites || [] });
      return;
    }

    // Get invite analytics
    if (action === 'get_invite_analytics') {
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Login required' });
      const userClient = createSupabaseForToken(tokenHeader);

      const { invite_id } = req.body || {};
      if (!invite_id) return res.status(400).json({ error: 'Invite ID required' });

      // Get analytics data
      const { data: analytics } = await userClient
        .from('invite_analytics')
        .select('*')
        .eq('id', invite_id)
        .single();

      // Get recent views
      const { data: recentViews } = await userClient
        .from('invite_views')
        .select('*')
        .eq('invite_id', invite_id)
        .order('viewed_at', { ascending: false })
        .limit(50);

      res.json({
        analytics,
        recent_views: recentViews || []
      });
      return;
    }

    // Revoke invite
    if (action === 'revoke_invite') {
      const tokenHeader = getAuthToken(req);
      const user = await getUserFromToken(tokenHeader);
      if (!user) return res.status(401).json({ error: 'Login required' });
      const userClient = createSupabaseForToken(tokenHeader);

      const { invite_id, reason } = req.body || {};
      if (!invite_id) return res.status(400).json({ error: 'Invite ID required' });

      const { error } = await userClient
        .from('invites')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoked_reason: reason || 'Manually revoked'
        })
        .eq('id', invite_id)
        .eq('owner_id', user.id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true });
      return;
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (e) {
    console.error('Invites API error:', e);
    res.status(500).json({ error: String(e?.message || e) });
  }
}

export const config = { api: { bodyParser: true } };
