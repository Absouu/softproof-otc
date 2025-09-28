import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SecurityTooltip from '../components/SecurityTooltip';
import OnboardingModal from '../components/OnboardingModal';
import Head from 'next/head';

function SoftProof() {
  const [session, setSession] = useState(null);
  const [auth, setAuth] = useState({ email: '', password: '', isSignup: false });

  const [formData, setFormData] = useState({ wa: '', chain: 'btc', token: 'BTC', baseAmount: 0.0001, baseAmountCurrency: 'btc' });
  const [proof, setProof] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('supabase_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSession(parsed);
        
        // Check if this is a first-time user
        const hasSeenOnboarding = localStorage.getItem('softproof_onboarding_seen');
        if (!hasSeenOnboarding) {
          setIsFirstTime(true);
          setShowOnboarding(true);
        }
      }
    } catch (e) {
      console.error('Error parsing session:', e);
      localStorage.removeItem('supabase_session');
    }
  }, []);

  // Auto-check payment status every 30 seconds if proof exists
  useEffect(() => {
    let interval;
    if (proof && !result?.verified && session) {
      interval = setInterval(async () => {
        try {
          const response = await axios.post('/api/softproof?action=check_status', {
            sessionId: proof.sessionId
          }, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          if (response.data.verified) {
            setResult({
              verified: true,
              message: response.data.message,
              txHash: response.data.txHash,
              confirmations: response.data.confirmations
            });
            clearInterval(interval);
          } else {
            setResult({
              verified: false,
              message: response.data.message
            });
          }
        } catch (e) {
          console.error('Status check error:', e);
        }
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [proof, result, formData.wa, session]);

  const handleAuth = async () => {
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
        alert('Signup successful. Please check your email to confirm, then log in.');
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
        alert('Login failed: no session token returned.');
      }
    } catch (e) {
      alert('Auth error: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleInitiate = async () => {
    if (!session) {
      alert('Login required before creating a proof');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await axios.post('/api/softproof?action=initiate', formData, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      setProof(response.data);
      setTxHash('');
    } catch (e) {
      alert('Error: ' + (e.response?.data?.error || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/softproof?action=submit',
        { sessionId: proof.sessionId, txHash },
        {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        }
      );
      setResult(response.data);
      // On success, go to dashboard after delay
      if (response.data?.status === 'Verified' && session) {
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      }
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message;
      if (errorMsg.includes('not confirmed yet')) {
        setResult({
          status: 'Pending',
          error: 'Payment pending confirmation. We\'ll check automatically every 5 seconds...'
        });
      } else {
        alert('Error: ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!session) {
      alert('Login required');
      return;
    }
    setCheckingStatus(true);
    try {
      const response = await axios.post('/api/softproof?action=check_status', {
        sessionId: proof.sessionId
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (response.data.verified) {
        setResult({
          verified: true,
          message: response.data.message,
          txHash: response.data.txHash,
          confirmations: response.data.confirmations
        });
        if (session) {
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        }
      } else {
        setResult({
          verified: false,
          message: response.data.message || 'Payment still pending. Please wait for blockchain confirmations...'
        });
      }
    } catch (e) {
      alert('Error checking status: ' + (e.response?.data?.error || e.message));
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    localStorage.setItem('softproof_onboarding_seen', 'true');
  };

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      <div className="softproof-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#333' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', marginRight: '8px' }}>security</span>
          SoftProof OTC
        </h2>
        <p style={{ margin: 0, fontSize: '1rem', color: '#666' }}>
          On-chain Verification · Agent-Facilitated Trading · Enterprise Security
        </p>
      </div>

      {!session && (
        <div className="auth-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#333', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '8px' }}>login</span>
            SoftProof OTC Login
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem', textAlign: 'center' }}>
            Access your verified wallets and profiles
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              placeholder="Email"
              value={auth.email}
              onChange={e => setAuth({ ...auth, email: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={auth.password}
              onChange={e => setAuth({ ...auth, password: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handleAuth}
                style={{
                  flex: 1,
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {auth.isSignup ? 'Sign Up' : 'Login'}
              </button>
              <button 
                onClick={() => setAuth({ ...auth, isSignup: !auth.isSignup })}
                style={{
                  flex: 1,
                  background: 'transparent',
                  color: '#007bff',
                  border: '1px solid #007bff',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                {auth.isSignup ? 'Switch to Login' : 'Switch to Sign Up'}
              </button>
            </div>
          </div>
          
          {/* Security Elements */}
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4CAF50' }}>lock</span>
              <span style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: '500' }}>
                Protected by 256-bit encryption
              </span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <a href="/security" style={{
                fontSize: '0.8rem',
                color: '#007BFF',
                textDecoration: 'none',
                fontWeight: '500'
              }}>
                Forgot Password?
              </a>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6c757d' }}>
              Powered by enterprise-grade blockchain infrastructure
            </p>
          </div>
          
          {/* New User Section */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#e8f4fd',
            border: '1px solid #007BFF',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#1a2332', fontWeight: '500' }}>
              New to SoftProof?
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>
              Contact sales@softproof.io for enterprise access
            </p>
          </div>
        </div>
      )}

      <div style={{
        background: 'white',
        border: '1px solid #e1e5e9',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        maxWidth: '600px',
        margin: '0 auto 2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#333', textAlign: 'center' }}>
          Verify Wallet Ownership
        </h3>
        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#6c757d', textAlign: 'center' }}>
          Complete on-chain verification in under 2 minutes
        </p>
        
        {/* Safety Reminder Box */}
        <div style={{
          backgroundColor: '#fff3cd',
          border: '2px solid #FF0000',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#FF0000' }}>security</span>
            <strong style={{ color: '#FF0000', fontSize: '14px' }}>Security Notice</strong>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#856404', fontWeight: '500' }}>
            • No wallet connection required - keep your keys secure
          </p>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#856404', fontWeight: '500' }}>
            • You're sending FROM your wallet, not connecting it
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404', fontWeight: '500' }}>
            • SoftProof never has access to your funds
          </p>
        </div>
        <div style={{ 
          background: '#f8f9fa', 
          border: '1px solid #e9ecef', 
          borderRadius: '8px', 
          padding: '1rem', 
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          color: '#555',
          lineHeight: '1.5'
        }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>
            <strong>How it works:</strong> SoftProof verifies wallet control via on-chain micropayments to a dedicated address. Funds remain non-custodial and are not returned for security purposes.
          </p>
          <p style={{ margin: 0, color: '#FF0000', fontWeight: '600', fontSize: '14px' }}>
            ⚠️ Send only verification amount (e.g., 0.0001 BTC) — funds are non-refundable
          </p>
        </div>

        {/* Why This Method Info Box */}
        <details style={{ marginBottom: '1.5rem' }}>
          <summary style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: '#e8f4fd',
            border: '1px solid #007BFF',
            borderRadius: '8px',
            fontWeight: '600',
            color: '#007BFF',
            fontSize: '0.9rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>help</span>
            Why micropayments instead of wallet connections?
          </summary>
          <div style={{
            padding: '1rem',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            fontSize: '0.9rem',
            color: '#555'
          }}>
            <p style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#FF0000' }}>
              Wallet connections (like MetaMask) grant websites permission to:
            </p>
            <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
              <li>Read all your balances</li>
              <li>Request transaction signatures</li>
              <li>Potentially drain wallets through exploits</li>
            </ul>
            <p style={{ margin: '0 0 1rem 0', fontWeight: '600', color: '#4CAF50' }}>
              SoftProof's method:
            </p>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>You send a tiny amount from your wallet (one-way)</li>
              <li>Proves control without any permissions</li>
              <li>Similar to how exchanges verify ownership</li>
              <li>No smart contract risks</li>
            </ul>
          </div>
        </details>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '0.5rem' }}>
              <SecurityTooltip content="Enter your wallet address here. You'll send a small amount FROM this address to prove you control it. We never connect to your wallet directly.">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance_wallet</span>
                  Your Wallet Address
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#6c757d' }}>help</span>
                </span>
              </SecurityTooltip>
            </label>
            <input
              placeholder="Enter your wallet address (e.g., bc1q... or 0x...)"
              value={formData.wa}
              onChange={e => setFormData({ ...formData, wa: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>link</span>Blockchain
              </label>
              <select
                value={formData.chain}
                onChange={e => {
                  const chain = e.target.value;
                  setFormData({
                    ...formData,
                    chain,
                    token: chain.toUpperCase(),
                    baseAmountCurrency: chain,
                    baseAmount: chain === 'btc' ? 0.0001 : chain === 'eth' ? 0.0001 : 10
                  });
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
              >
                <option value="btc">Bitcoin (BTC)</option>
                <option value="eth">Ethereum (ETH)</option>
                <option value="trx">TRON (TRX)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>attach_money</span>Small Proof Amount
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                placeholder={`Amount in ${formData.baseAmountCurrency.toUpperCase()}`}
                value={formData.baseAmount}
                onChange={e =>
                  setFormData({
                    ...formData,
                    baseAmount: parseFloat(e.target.value) || 0.0001,
                  })
                }
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }}
              />
            </div>
          </div>

          <SecurityTooltip content="This creates a unique address tied to your account. Sending the micropayment from your wallet proves you control it without exposing keys.">
            <button 
              onClick={handleInitiate} 
              disabled={loading || !formData.wa || !session}
              style={{
                background: loading || !formData.wa || !session ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.875rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading || !formData.wa || !session ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                if (!loading && formData.wa && session) {
                  e.target.style.background = '#0056b3';
                }
              }}
              onMouseOut={(e) => {
                if (!loading && formData.wa && session) {
                  e.target.style.background = '#007bff';
                }
              }}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
                  Generating Address...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
                  Generate Verification Address
                </>
              )}
            </button>
          </SecurityTooltip>
        </div>
      </div>

      {proof && (
        <div style={{
          background: 'white',
          border: '1px solid #e1e5e9',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem'
        }}>
          <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#333', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '8px' }}>payment</span>Payment Instructions
          </h4>
          
          <div style={{ 
            background: '#f8f9fa', 
            border: '1px solid #e9ecef', 
            borderRadius: '8px', 
            padding: '1.5rem', 
            marginBottom: '1.5rem' 
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>my_location</span>Send to Address:
              </p>
              <code style={{ 
                wordBreak: 'break-all', 
                fontSize: '0.85rem',
                background: '#e9ecef',
                padding: '0.5rem',
                borderRadius: '4px',
                display: 'block',
                fontFamily: 'Monaco, Consolas, monospace'
              }}>
                {proof.depositAddress}
              </code>
            </div>

            <div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>attach_money</span>Exact Amount to Send:
              </p>
              <code style={{ 
                fontSize: '1.1rem',
                fontWeight: '600',
                background: '#007bff',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                fontFamily: 'Monaco, Consolas, monospace'
              }}>
                {proof.expectedAmount} {formData.token}
              </code>
            </div>
          </div>

          <div style={{
            background: '#e8f5e8',
            border: '1px solid #4caf50',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32', textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>schedule</span>We'll automatically check for your payment every 30 seconds.
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={handleCheckStatus} 
              disabled={checkingStatus}
              style={{
                background: checkingStatus ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: checkingStatus ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
              onMouseOver={(e) => {
                if (!checkingStatus) {
                  e.target.style.background = '#218838';
                }
              }}
              onMouseOut={(e) => {
                if (!checkingStatus) {
                  e.target.style.background = '#28a745';
                }
              }}
            >
              {checkingStatus ? (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>refresh</span>
                  Checking...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>check_circle</span>
                  Check Status Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {result && result.verified && (
        <div style={{
          background: 'white',
          border: '2px solid #28a745',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>celebration</span>
          </div>
          <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#28a745' }}>
            Verification Successful!
          </h4>
          <p style={{ margin: '0 0 1.5rem 0', fontSize: '1rem', color: '#333' }}>
            {result.message}
          </p>
          
          {result.txHash && (
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>
                Transaction Hash:
              </p>
              <code style={{ 
                fontSize: '0.85rem',
                background: '#f8f9fa',
                padding: '0.5rem',
                borderRadius: '4px',
                fontFamily: 'Monaco, Consolas, monospace',
                wordBreak: 'break-all'
              }}>
                {result.txHash}
              </code>
            </div>
          )}
          
          {result.confirmations !== undefined && (
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#666' }}>
              <strong>Confirmations:</strong> {result.confirmations}
            </p>
          )}
          
          {session && (
            <div style={{
              background: '#e8f5e8',
              border: '1px solid #4caf50',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>refresh</span>Redirecting to dashboard...
              </p>
            </div>
          )}
        </div>
      )}

      {result && !result.verified && result.message && (
        <div style={{
          background: 'white',
          border: '1px solid #ffeaa7',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>schedule</span>
          </div>
          <p style={{ margin: 0, fontSize: '1rem', color: '#856404' }}>
            {result.message}
          </p>
        </div>
      )}

      {result && result.error && !result.verified && (
        <div style={{
          background: 'white',
          border: '2px solid #dc3545',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          maxWidth: '600px',
          margin: '0 auto 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>error</span>
          </div>
          <p style={{ margin: 0, fontSize: '1rem', color: '#dc3545' }}>
            {result.error}
          </p>
        </div>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        isFirstTime={isFirstTime}
      />
      </div>
    </>
  );
}

export default SoftProof;
