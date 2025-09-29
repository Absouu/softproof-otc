import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import { useRouter } from 'next/router';

function InviteViewer() {
  const router = useRouter();
  const { token } = router.query;
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [authData, setAuthData] = useState({ password: '', email: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);

  useEffect(() => {
    if (!token) return;
    
    const fetchInvite = async () => {
      try {
        const response = await axios.post('/api/invites?action=get_invite', {
          link_token: token
        });
        
        setInvite(response.data.invite);
        
        // Track the view
        await axios.post('/api/invites?action=track_view', {
          link_token: token
        });
        
        // Check if authentication is required
        if (response.data.invite.is_gated) {
          setAuthRequired(true);
        }
        
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Invite not found or expired');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    
    try {
      const response = await axios.post('/api/invites?action=auth_invite', {
        link_token: token,
        password: authData.password,
        email: authData.email
      });
      
      setSessionToken(response.data.session_token);
      setAuthRequired(false);
    } catch (err) {
      alert('Authentication failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>refresh</span>
          </div>
          <p>Loading invite...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>error</span>
          </div>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Invite Not Available</h2>
          <p style={{ color: '#666' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (authRequired) {
    return (
      <>
        <Head>
          <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
        </Head>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f8f9fa'
        }}>
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '2rem', 
            maxWidth: '400px', 
            width: '90%',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#3b82f6' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>lock</span>
              </div>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '600' }}>
                {invite.title}
              </h2>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                {invite.description || 'This link requires authentication to view'}
              </p>
            </div>

            <form onSubmit={handleAuth}>
              {invite.gate_type === 'password' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={authData.password}
                    onChange={e => setAuthData({ ...authData, password: e.target.value })}
                    placeholder="Enter password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              {invite.gate_type === 'email' && (
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={authData.email}
                    onChange={e => setAuthData({ ...authData, email: e.target.value })}
                    placeholder="Enter your email"
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: authLoading ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: authLoading ? 'not-allowed' : 'pointer'
                }}
              >
                {authLoading ? 'Authenticating...' : 'Access Link'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{invite.title} - SoftProof OTC</title>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      <div style={{ 
        minHeight: '100vh', 
        background: '#f8f9fa',
        padding: '2rem 0'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
          {/* Header */}
          <div style={{ 
            background: 'white', 
            borderRadius: '12px', 
            padding: '2rem', 
            marginBottom: '2rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>
              {invite.title}
            </h1>
            {invite.description && (
              <p style={{ margin: '0 0 1rem 0', color: '#6b7280', fontSize: '1.1rem' }}>
                {invite.description}
              </p>
            )}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              padding: '0.75rem',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0ea5e9' }}>verified</span>
              <span style={{ fontSize: '0.9rem', color: '#0c4a6e', fontWeight: '500' }}>
                Verified by SoftProof OTC
              </span>
            </div>
          </div>

          {/* Proofs */}
          {invite.proofs && invite.proofs.length > 0 && (
            <div style={{ 
              background: 'white', 
              borderRadius: '12px', 
              padding: '2rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
                Verified Wallets
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {invite.proofs.map((proof, index) => (
                  <div key={proof.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    background: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ 
                          fontFamily: 'Monaco, Consolas, monospace', 
                          fontSize: '0.9rem', 
                          fontWeight: '500',
                          color: '#374151',
                          marginBottom: '0.25rem'
                        }}>
                          {proof.address}
                        </div>
                        <div style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          background: proof.chain === 'btc' ? '#f59e0b' : proof.chain === 'eth' ? '#8b5cf6' : '#06b6d4',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {proof.chain.toUpperCase()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                          {proof.balance} {proof.token}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                          Verified {new Date(proof.verified_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {proof.wallet_profiles && proof.wallet_profiles.length > 0 && (
                      <div style={{ 
                        borderTop: '1px solid #e5e7eb', 
                        paddingTop: '1rem',
                        marginTop: '1rem'
                      }}>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                          Contact Information
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          {proof.wallet_profiles[0].phone && (
                            <div>
                              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Phone</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                <a href={`tel:${proof.wallet_profiles[0].phone}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                  {proof.wallet_profiles[0].phone}
                                </a>
                              </div>
                            </div>
                          )}
                          {proof.wallet_profiles[0].email && (
                            <div>
                              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Email</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                <a href={`mailto:${proof.wallet_profiles[0].email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                  {proof.wallet_profiles[0].email}
                                </a>
                              </div>
                            </div>
                          )}
                          {proof.wallet_profiles[0].telegram && (
                            <div>
                              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Telegram</div>
                              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                                <a href={`https://t.me/${proof.wallet_profiles[0].telegram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                  {proof.wallet_profiles[0].telegram}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                        {proof.wallet_profiles[0].note && (
                          <div style={{ marginTop: '0.75rem' }}>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>Note</div>
                            <div style={{ fontSize: '0.9rem', color: '#374151', fontStyle: 'italic' }}>
                              {proof.wallet_profiles[0].note}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '2rem',
            padding: '1rem',
            color: '#6b7280',
            fontSize: '0.9rem'
          }}>
            <p style={{ margin: 0 }}>
              Powered by <strong>SoftProof OTC</strong> • Secure wallet verification
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default InviteViewer;
