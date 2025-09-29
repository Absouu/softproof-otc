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

const fetchUserRole = async (token) => {
  const { data } = await axios.post('/api/softproof?action=get_role', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data.role;
};

const fetchAgentDashboard = async (token) => {
  const { data } = await axios.post('/api/softproof?action=agent_dashboard', {}, {
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
  const [userRole, setUserRole] = useState('wallet_holder');

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

  const roleQuery = useQuery({
    queryKey: ['userRole', token],
    queryFn: () => fetchUserRole(token),
    enabled: Boolean(token),
  });

  // Update userRole when roleQuery data changes
  useEffect(() => {
    if (roleQuery.data) {
      console.log('Role data received:', roleQuery.data);
      setUserRole(roleQuery.data);
      // Set default tab based on role
      if (roleQuery.data === 'agent') {
        setActiveTab('assignments');
      } else {
        setActiveTab('active');
      }
    }
  }, [roleQuery.data]);

  const agentDashboardQuery = useQuery({
    queryKey: ['agentDashboard', token, userRole],
    queryFn: () => fetchAgentDashboard(token),
    enabled: Boolean(token && userRole === 'agent'),
  });

  useEffect(() => {
    if (!sessionReady) return;
    const queries = [dashboardQuery, roleQuery, agentDashboardQuery];
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

          {/* Role-based Navigation */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ 
                padding: '0.5rem 1rem', 
                background: userRole === 'wallet_holder' ? '#e3f2fd' : '#f3e5f5', 
                borderRadius: '8px',
                border: `2px solid ${userRole === 'wallet_holder' ? '#2196f3' : '#9c27b0'}`
              }}>
                <span style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: '600', 
                  color: userRole === 'wallet_holder' ? '#1976d2' : '#7b1fa2' 
                }}>
                  {userRole === 'wallet_holder' ? '👤 Wallet Holder' : '🤝 Agent'}
                </span>
              </div>
              {userRole === 'agent' && (
                <button
                  onClick={() => router.push('/agent/create-proof')}
                  className="btn btn-primary hover-lift"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                  Create Client Proof
                </button>
              )}
              {/* Debug Role Button */}
              <button
                onClick={async () => {
                  try {
                    const response = await axios.post('/api/softproof?action=update_role', {
                      role: userRole === 'agent' ? 'wallet_holder' : 'agent'
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    console.log('Role updated:', response.data);
                    queryClient.invalidateQueries(['userRole', token]);
                    alert('Role updated successfully!');
                  } catch (error) {
                    console.error('Error updating role:', error);
                    const errorMsg = error.response?.data?.error || error.message;
                    alert(`Error updating role: ${errorMsg}`);
                  }
                }}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Switch to {userRole === 'agent' ? 'Wallet Holder' : 'Agent'}
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
              {userRole === 'wallet_holder' ? (
                <>
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
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      background: 'none',
                      borderBottom: activeTab === 'assignments' ? '2px solid #3b82f6' : '2px solid transparent',
                      color: activeTab === 'assignments' ? '#3b82f6' : '#64748b',
                      fontWeight: activeTab === 'assignments' ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>assignment</span>
                    Client Assignments
                  </button>
                  <button
                    onClick={() => setActiveTab('client_proofs')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      border: 'none',
                      background: 'none',
                      borderBottom: activeTab === 'client_proofs' ? '2px solid #3b82f6' : '2px solid transparent',
                      color: activeTab === 'client_proofs' ? '#3b82f6' : '#64748b',
                      fontWeight: activeTab === 'client_proofs' ? '600' : '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>link</span>
                    Client Proofs
                  </button>
                </>
              )}
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
          {userRole === 'agent' && activeTab === 'assignments' && (
            <div className="card fade-in">
              <h3 className="text-tertiary" style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3b82f6' }}>assignment</span>
                Client Assignments
              </h3>
              {agentDashboardQuery.data?.assignments?.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Wallet Address</th>
                        <th>Chain</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentDashboardQuery.data.assignments.map((assignment) => (
                        <tr key={assignment.id}>
                          <td>
                            <div>
                              <div style={{ fontWeight: '500' }}>
                                {assignment.profiles?.phone || assignment.profiles?.email_social || 'Unknown'}
                              </div>
                              {assignment.profiles?.telegram && (
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                  @{assignment.profiles.telegram}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <code style={{ fontSize: '0.8rem' }}>
                              {assignment.proofs?.address}
                            </code>
                          </td>
                          <td>
                            <span className={`chain-badge ${assignment.proofs?.chain}`}>
                              {assignment.proofs?.chain?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${assignment.status}`}>
                              {assignment.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                // Handle assignment actions
                              }}
                            >
                              Add Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>assignment</span>
                  <p>No client assignments yet</p>
                  <p style={{ fontSize: '0.9rem' }}>Clients will appear here when they associate their wallets to you</p>
                </div>
              )}
            </div>
          )}

          {userRole === 'agent' && activeTab === 'client_proofs' && (
            <div className="card fade-in">
              <h3 className="text-tertiary" style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#3b82f6' }}>link</span>
                Client Proof Links
              </h3>
              {agentDashboardQuery.data?.client_links?.length > 0 ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Receiving Address</th>
                        <th>Amount</th>
                        <th>Chain</th>
                        <th>Status</th>
                        <th>Expires</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentDashboardQuery.data.client_links.map((link) => (
                        <tr key={link.id}>
                          <td>
                            <code style={{ fontSize: '0.8rem' }}>
                              {link.receiving_address}
                            </code>
                          </td>
                          <td>
                            <strong>{link.amount} {link.token}</strong>
                          </td>
                          <td>
                            <span className={`chain-badge ${link.chain}`}>
                              {link.chain?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${link.status}`}>
                              {link.status}
                            </span>
                          </td>
                          <td>
                            {new Date(link.expires_at).toLocaleString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${window.location.origin}/client-proof/${link.share_token}`);
                                  alert('Link copied to clipboard!');
                                }}
                              >
                                Copy Link
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to revoke this link?')) {
                                    try {
                                      await axios.post('/api/softproof?action=revoke_client_proof', {
                                        client_proof_id: link.id
                                      }, {
                                        headers: { Authorization: `Bearer ${token}` }
                                      });
                                      queryClient.invalidateQueries(['agentDashboard', token]);
                                    } catch (err) {
                                      alert('Error revoking link: ' + err.message);
                                    }
                                  }
                                }}
                              >
                                Revoke
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}>link</span>
                  <p>No client proof links created yet</p>
                  <p style={{ fontSize: '0.9rem' }}>Create client proof links to facilitate client verifications</p>
                </div>
              )}
            </div>
          )}

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
    agentEmail: '',
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
          <div>
            <label className="field-label" style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '500' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>handshake</span>
              Associate to Agent (Optional)
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="agent@example.com"
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #e1e5e9', borderRadius: '6px', fontSize: '0.85rem' }}
                onChange={(e) => setContact((prev) => ({ ...prev, agentEmail: e.target.value }))}
              />
              <button
                onClick={async () => {
                  if (!contact.agentEmail) {
                    alert('Please enter agent email');
                    return;
                  }
                  try {
                    await axios.post('/api/softproof?action=associate_agent', {
                      proof_id: proof.id,
                      agent_email: contact.agentEmail
                    }, {
                      headers: { Authorization: `Bearer ${session?.access_token}` }
                    });
                    alert('Agent association request sent!');
                  } catch (error) {
                    alert('Error: ' + (error.response?.data?.error || error.message));
                  }
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>send</span>
                Send
              </button>
      </div>
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
