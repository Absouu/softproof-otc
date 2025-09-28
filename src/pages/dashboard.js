import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import ActivityChart from '../components/ActivityChart';

const explorerMap = {
  btc: (addr) => `https://www.blockchain.com/explorer/addresses/btc/${addr}`,
  eth: (addr) => `https://etherscan.io/address/${addr}`,
  trx: (addr) => `https://tronscan.org/#/address/${addr}`,
};

const fetchDashboard = async (token) => {
  const { data } = await axios.post('/api/softproof?action=dashboard', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [auth, setAuth] = useState({ email: '', password: '', isSignup: false });
  const [authLoading, setAuthLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('supabase_session');
    if (stored) {
      setSession(JSON.parse(stored));
    }
    setSessionReady(true);
  }, []);

  const token = session?.access_token;

  const dashboardQuery = useQuery({
    queryKey: ['dashboard', token],
    queryFn: () => fetchDashboard(token),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!sessionReady) return;
    const queries = [dashboardQuery];
    for (const q of queries) {
      const err = q.error;
      if (err && axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem('supabase_session');
        setSession(null);
        setSessionReady(true);
        window.dispatchEvent(new Event('supabase-session-updated'));
        break;
      }
    }
  }, [dashboardQuery, sessionReady]);

  const saveWalletProfileMutation = useMutation({
    mutationFn: ({ proofId, phone, email, telegram, note, published }) => axios.post('/api/softproof?action=wallet_profile_upsert', {
      proofId,
      phone,
      email,
      telegram,
      note,
      published,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', token]);
      window.dispatchEvent(new Event('wallet-profiles-updated'));
    },
  });

  const saveWalletProfile = (payload) => saveWalletProfileMutation.mutateAsync(payload);

  const publishWalletMutation = useMutation({
    mutationFn: ({ proofId, copyOnly }) => axios.post('/api/softproof?action=wallet_profile_share', {
      proofId,
      copyOnly,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries(['dashboard', token]);
      window.dispatchEvent(new Event('wallet-profiles-updated'));
      const link = res.data?.shareLink;
      if (link) {
        if (variables.copyOnly) {
          navigator.clipboard?.writeText(`${window.location.origin}${link}`).catch(() => {});
          alert('Share link copied to clipboard');
        } else {
          alert('Wallet published');
        }
      }
    },
    onError: (error) => {
      alert(error.response?.data?.error || error.message);
    }
  });

  const unpublishWalletMutation = useMutation({
    mutationFn: ({ proofId }) => axios.post('/api/softproof?action=wallet_profile_delete', {
      proofId,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', token]);
      window.dispatchEvent(new Event('wallet-profiles-updated'));
    },
  });

  const handleAuth = async () => {
    if (!auth.email || !auth.password) {
      alert('Email and password required');
      return;
    }
    setAuthLoading(true);
    try {
      if (auth.isSignup) {
        const { data } = await axios.post('/api/softproof?action=signup', {
          email: auth.email,
          password: auth.password,
        });
        const signupSession = data?.session;
        const signupUser = data?.user || signupSession?.user;
        if (signupSession?.access_token) {
          const sess = { access_token: signupSession.access_token, user: signupUser };
          setSession(sess);
          localStorage.setItem('supabase_session', JSON.stringify(sess));
          window.dispatchEvent(new Event('supabase-session-updated'));
          setAuth({ email: '', password: '', isSignup: false });
          return;
        }
        alert('Signup successful. Please confirm via email, then log in.');
        setAuth((prev) => ({ ...prev, isSignup: false }));
        return;
      }

      const { data } = await axios.post('/api/softproof?action=login', {
        email: auth.email,
        password: auth.password,
      });
      const loginSession = data?.session;
      const access_token = loginSession?.access_token || data?.access_token || null;
      const user = loginSession?.user || data?.user || null;
      if (access_token) {
        const sess = { access_token, user };
        setSession(sess);
        localStorage.setItem('supabase_session', JSON.stringify(sess));
        window.dispatchEvent(new Event('supabase-session-updated'));
        setAuth({ email: '', password: '', isSignup: false });
      } else {
        alert('Login failed: no access token returned.');
      }
    } catch (error) {
      alert(error.response?.data?.error || error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const loading = dashboardQuery.isLoading;
  const error = dashboardQuery.error;

  const proofs = useMemo(() => (dashboardQuery.data?.proofs || []).map((proof) => ({
    ...proof,
    wallet_profile: proof.wallet_profiles?.[0] || null,
  })), [dashboardQuery.data?.proofs]);

  if (!sessionReady) {
    return (
      <div style={{ maxWidth: '960px', width: '100%', margin: '0 auto' }}>
        <p>Loading session…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ width: '100%', maxWidth: '500px', margin: '4rem auto', background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e1e5e9' }}>
        <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.6rem', fontWeight: '600', textAlign: 'center', color: '#333' }}>Login Required</h2>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.95rem', color: '#555', textAlign: 'center' }}>
          Sign in to manage your proofs, representatives, and contact details.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            placeholder="Email"
            value={auth.email}
            onChange={(e) => setAuth({ ...auth, email: e.target.value })}
            style={{ padding: '0.75rem', border: '1px solid #e1e5e9', borderRadius: '8px', fontSize: '0.9rem' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={auth.password}
            onChange={(e) => setAuth({ ...auth, password: e.target.value })}
            style={{ padding: '0.75rem', border: '1px solid #e1e5e9', borderRadius: '8px', fontSize: '0.9rem' }}
          />
          <button
            onClick={handleAuth}
            disabled={authLoading}
            style={{
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: authLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {authLoading ? 'Processing…' : auth.isSignup ? 'Sign Up' : 'Log In'}
          </button>
          <button
            onClick={() => setAuth({ ...auth, isSignup: !auth.isSignup })}
            style={{
              background: 'transparent',
              color: '#007bff',
              border: 'none',
              padding: '0.75rem 1rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            {auth.isSignup ? 'Already have an account? Log in' : 'Create a new account'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '960px', width: '100%', margin: '0 auto' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    const message = axios.isAxiosError(error)
      ? (error.response?.data?.error || error.message)
      : error.message;
    return (
      <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{
          background: '#fff4e5',
          border: '1px solid #ffd9a8',
          borderRadius: '12px',
          padding: '2rem',
        }}>
          <h3 style={{ margin: '0 0 0.75rem 0', color: '#9c6500' }}>Create your first proof</h3>
          <p style={{ color: '#8a5a00', fontSize: '0.95rem' }}>
            Once you prove ownership of a wallet, this dashboard will display balances, contact info, and sharing options.
          </p>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#9c6500' }}>
            Details: {message}
          </p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => router.push('/softproof')}
            style={{
              background: '#007bff',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Go to Create Proof
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Wallet Verification Registry - SoftProof OTC</title>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      <div style={{ width: '100%', maxWidth: '1100px', margin: '0 auto' }}>
        {/* Professional Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 className="text-primary" style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#3b82f6' }}>dashboard</span>
                Wallet Verification Registry
              </h1>
              <p className="text-body" style={{ margin: 0, color: '#64748b' }}>
                Manage your verified wallets and contact profiles for OTC trading
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => queryClient.invalidateQueries(['dashboard', token])}
                className="btn btn-primary hover-lift"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                Update Balances
              </button>
              <button
                onClick={() => router.push('/softproof')}
                className="btn btn-success hover-lift"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                Create New Verification
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ marginBottom: '2rem' }}>
            <div className="tab-nav" style={{ 
              display: 'flex', 
              borderBottom: '2px solid #E1E4E8',
              marginBottom: '1.5rem'
            }}>
              <button
                onClick={() => setActiveTab('active')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'active' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === 'active' ? '#3b82f6' : '#64748b',
                  fontWeight: activeTab === 'active' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance_wallet</span>
                My Wallets
              </button>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'history' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: activeTab === 'history' ? '#3b82f6' : '#64748b',
                  fontWeight: activeTab === 'history' ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>timeline</span>
                Activity
              </button>
            </div>
          </div>

          {/* Welcome Section for New Users */}
          {proofs.length === 0 && (
            <div style={{
              backgroundColor: '#e8f4fd',
              border: '1px solid #007BFF',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '600', color: '#1a2332', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#007BFF' }}>info</span>
                Getting Started with Safe Verification
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#1a2332' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4CAF50' }}>check_circle</span>
                  <span>1. Enter your wallet address (you won't connect it)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#1a2332' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4CAF50' }}>check_circle</span>
                  <span>2. Send a micro-amount to verify ownership</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#1a2332' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4CAF50' }}>check_circle</span>
                  <span>3. Share your verification with your OTC agent</span>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6c757d', fontStyle: 'italic' }}>
                Remember: We never ask for seed phrases, private keys, or wallet connections.
              </p>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'active' && (
            <>
              {/* Agent Information Section */}
              <div className="card fade-in" style={{ marginBottom: '2rem' }}>
                <h3 className="text-tertiary" style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3b82f6' }}>handshake</span>
                  Agent Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label className="form-label">
                      Your OTC Agent/Desk (Optional)
                    </label>
                    <input
                      placeholder="Enter your OTC agent or desk name"
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Agent Reference Code (Optional)
                    </label>
                    <input
                      placeholder="For tracking purposes"
                      className="form-input"
                    />
                  </div>
                </div>
                <p className="text-caption" style={{ margin: '1rem 0 0 0', fontStyle: 'italic' }}>
                  Note: Profiles shared through agent channels only
                </p>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="fade-in">
              <ActivityChart 
                data={proofs.map(proof => ({
                  date: new Date(proof.created_at).toISOString().split('T')[0],
                  verifications: 1,
                  balance: parseFloat(proof.balance) || 0
                }))}
                title="Verification Activity"
              />
              
              <div className="card fade-in" style={{ marginTop: '1.5rem' }}>
                <h3 className="text-tertiary" style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3b82f6' }}>timeline</span>
                  Activity Timeline
                </h3>
                <p className="text-body" style={{ color: '#64748b', marginBottom: '1rem' }}>
                  Recent verification activity and transaction history.
                </p>
                
                {proofs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {proofs.slice(0, 5).map((proof, index) => (
                      <div 
                        key={proof.id}
                        className="hover-lift"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          background: '#f8f9fa',
                          border: '1px solid #E1E4E8',
                          borderRadius: '8px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{
                          width: '40px',
                          height: '40px',
                          background: '#3b82f6',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="text-body" style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                            {proof.chain.toUpperCase()} Wallet Verified
                          </div>
                          <div className="text-caption" style={{ color: '#64748b' }}>
                            {new Date(proof.created_at).toLocaleDateString()} • {proof.balance} {proof.chain.toUpperCase()}
                          </div>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          background: '#e8f5e8',
                          color: '#2e7d32',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          Verified
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #E1E4E8', 
                    borderRadius: '8px', 
                    padding: '2rem', 
                    textAlign: 'center'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#64748b', marginBottom: '1rem' }}>timeline</span>
                    <p className="text-body" style={{ margin: 0, color: '#64748b' }}>
                      Historical data will appear here as you complete more verifications
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Active Verifications Table - Only show in active tab */}
          {activeTab === 'active' && (
            <div className="card fade-in">
              <h3 className="text-tertiary" style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3b82f6' }}>account_balance_wallet</span>
                Verified Wallets
              </h3>
              {proofs.length === 0 ? (
                <p className="text-body" style={{ color: '#64748b', margin: 0 }}>No proofs yet. Create your first proof to get started.</p>
              ) : (
            <div className="wallet-table-wrapper">
              <table className="wallet-table">
                <thead>
                  <tr>
                    <th>Wallet Address</th>
                    <th>Network</th>
                    <th>Balance</th>
                    <th>Verification Date</th>
                    <th>Contact Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
              <tbody>
                {proofs.map((proof) => (
                  <WalletRow
                    key={proof.id}
                    proof={proof}
                    explorerUrl={explorerMap[proof.chain]?.(proof.address) || '#'}
                    onSaveProfile={saveWalletProfile}
                    savingProfile={saveWalletProfileMutation.isLoading}
                    onPublish={(options = {}) => publishWalletMutation.mutate({ proofId: proof.id, copyOnly: options.copyOnly === true })}
                    onUnpublish={() => unpublishWalletMutation.mutate({ proofId: proof.id })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function WalletRow({ proof, explorerUrl, onSaveProfile, savingProfile, onPublish, onUnpublish }) {
  const profile = proof.wallet_profile || {};
  const [contact, setContact] = useState({
    phone: profile.phone || '',
    email: profile.email || '',
    telegram: profile.telegram || '',
    note: profile.note || '',
  });

  useEffect(() => {
    // Only reset if we have a profile and the current contact is empty
    const hasCurrentData = contact.phone || contact.email || contact.telegram || contact.note;
    const hasProfileData = profile.phone || profile.email || profile.telegram || profile.note;
    
    // Only update if we have profile data and no current data, or if profile data has changed
    if (hasProfileData && !hasCurrentData) {
      setContact({
        phone: profile.phone || '',
        email: profile.email || '',
        telegram: profile.telegram || '',
        note: profile.note || '',
      });
    }
  }, [profile.phone, profile.email, profile.telegram, profile.note]);

  const handleSave = async (published = undefined) => {
    await onSaveProfile({ proofId: proof.id, ...contact, published });
  };

  const handlePublish = async () => {
    await handleSave(true);
    onPublish({ copyOnly: false });
  };

  return (
    <tr>
      <td>
        <div className="wallet-cell">
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'IBM Plex Mono, Monaco, Consolas, monospace', fontSize: '0.85rem' }}>
            <span 
              className="text-truncate" 
              style={{ 
                display: 'inline-block', 
                maxWidth: '150px',
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '0.8rem'
              }}
              title={proof.address}
            >
              {proof.address.slice(0, 10)}…{proof.address.slice(-6)}
            </span>
          </a>
        </div>
      </td>
      <td>
        <span className={`chain-badge ${proof.chain}`} style={{ fontSize: '0.8rem', fontWeight: '500' }}>
          {proof.chain.toUpperCase()}
        </span>
      </td>
      <td style={{ fontFamily: 'IBM Plex Mono, Monaco, Consolas, monospace', fontSize: '0.85rem' }}>
        {proof.balance != null ? `${proof.balance.toFixed(6)} ${proof.token}` : '—'}
      </td>
      <td style={{ fontSize: '0.85rem', color: '#6c757d' }}>
        {proof.verified_at ? new Date(proof.verified_at).toLocaleDateString() : '—'}
      </td>
      <td>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <div>
            <label className="field-label" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '500' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>phone</span>
              Phone / SMS / WhatsApp
            </label>
            <input
              value={contact.phone}
              onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="+1 234 567 8900"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e5e9', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label className="field-label" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '500' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>email</span>
              Email
            </label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="contact@example.com"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e5e9', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label className="field-label" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '500' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>send</span>
              Telegram
            </label>
            <input
              value={contact.telegram}
              onChange={(e) => setContact((prev) => ({ ...prev, telegram: e.target.value }))}
              placeholder="@username"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #e1e5e9', borderRadius: '6px', fontSize: '0.85rem' }}
            />
          </div>
          <div>
            <label className="field-label" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '500' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>note</span>
              Trader Notes
            </label>
            <textarea
              value={contact.note}
              onChange={(e) => setContact((prev) => ({ ...prev, note: e.target.value }))}
              placeholder="Add context about this wallet"
              style={{ width: '100%', minHeight: '80px', padding: '0.5rem', border: '1px solid #e1e5e9', borderRadius: '6px', fontSize: '0.85rem', resize: 'vertical' }}
            />
          </div>
          <button
            onClick={() => handleSave()}
            disabled={savingProfile}
            style={{ 
              marginTop: '0.25rem', 
              padding: '0.5rem 1rem', 
              borderRadius: '6px', 
              border: 'none', 
              cursor: savingProfile ? 'not-allowed' : 'pointer', 
              background: '#4CAF50', 
              color: 'white',
              fontSize: '0.85rem',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              justifyContent: 'center'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>save</span>
            {savingProfile ? 'Saving…' : 'Update Details'}
          </button>
        </div>
      </td>
      <td>
        <div className="wallet-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {proof.wallet_profile?.published ? (
            <>
              <button 
                onClick={() => onPublish({ copyOnly: true })}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#007BFF',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  justifyContent: 'center'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>content_copy</span>
                Copy URL
              </button>
              <button 
                onClick={() => onUnpublish()}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#dc3545',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  justifyContent: 'center'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>visibility_off</span>
                Unpublish
              </button>
            </>
          ) : (
            <button 
              onClick={handlePublish} 
              disabled={savingProfile}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: 'none',
                background: savingProfile ? '#6c757d' : '#4CAF50',
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: '500',
                cursor: savingProfile ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                justifyContent: 'center'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>publish</span>
              {savingProfile ? 'Publishing…' : 'Publish'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default Dashboard;
