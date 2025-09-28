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
        <h3 className="text-secondary" style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>
          Verify Wallet Ownership
        </h3>
        <p className="text-body" style={{ margin: '0 0 1.5rem 0', color: '#64748b', textAlign: 'center' }}>
          Complete on-chain verification in under 2 minutes
        </p>
        
        {/* Progress Steps */}
        <div className="progress-steps" style={{ marginBottom: '2rem' }}>
          <div className={`progress-step ${!proof ? 'active' : 'completed'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
          </div>
          <div style={{ flex: 1, height: '2px', background: proof ? '#4CAF50' : '#E1E4E8', margin: '0 8px' }}></div>
          <div className={`progress-step ${proof && !result?.verified ? 'active' : result?.verified ? 'completed' : 'pending'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
          </div>
          <div style={{ flex: 1, height: '2px', background: result?.verified ? '#4CAF50' : '#E1E4E8', margin: '0 8px' }}></div>
          <div className={`progress-step ${result?.verified ? 'completed' : 'pending'}`}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="text-caption" style={{ fontWeight: '500', color: !proof ? '#3b82f6' : '#64748b' }}>
              Step 1: Enter Details
            </div>
            <div className="text-meta" style={{ color: '#64748b' }}>
              Wallet address & amount
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="text-caption" style={{ fontWeight: '500', color: proof && !result?.verified ? '#3b82f6' : '#64748b' }}>
              Step 2: Send Payment
            </div>
            <div className="text-meta" style={{ color: '#64748b' }}>
              Micropayment verification
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div className="text-caption" style={{ fontWeight: '500', color: result?.verified ? '#3b82f6' : '#64748b' }}>
              Step 3: Verified
            </div>
            <div className="text-meta" style={{ color: '#64748b' }}>
              Access dashboard
            </div>
          </div>
        </div>
        
        {/* Simplified Security Notice */}
        <div className="alert alert-info" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>shield</span>
            <span className="text-body" style={{ fontWeight: '600' }}>Secure Verification</span>
          </div>
          <p className="text-caption" style={{ margin: 0, color: '#0c5460' }}>
            Send a small amount to verify ownership • No wallet connection needed • Funds non-refundable
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">
              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>account_balance_wallet</span>
              Wallet Address
            </label>
            <input
              placeholder="bc1q... or 0x..."
              value={formData.wa}
              onChange={e => setFormData({ ...formData, wa: e.target.value })}
              className="form-input"
              style={{ fontFamily: 'IBM Plex Mono, Monaco, monospace', fontSize: '0.9rem' }}
            />
          </div>

          <div className="card-grid-2" style={{ gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>link</span>
                Network
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
                className="form-select"
              >
                <option value="btc">Bitcoin</option>
                <option value="eth">Ethereum</option>
                <option value="trx">TRON</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>attach_money</span>
                Amount ({formData.baseAmountCurrency.toUpperCase()})
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={formData.baseAmount}
                onChange={e =>
                  setFormData({
                    ...formData,
                    baseAmount: parseFloat(e.target.value) || 0.0001,
                  })
                }
                className="form-input"
              />
            </div>
          </div>

          <button 
            onClick={handleInitiate} 
            disabled={loading || !formData.wa || !session}
            className="btn btn-primary hover-lift"
            style={{
              width: '100%',
              fontSize: '1rem',
              padding: '1rem',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined loading-spinner" style={{ fontSize: '16px', marginRight: '8px' }}>refresh</span>
                Generating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>rocket_launch</span>
                Start Verification
              </>
            )}
          </button>
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
          <h4 className="text-secondary" style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '8px' }}>send</span>
            Send Payment
          </h4>
          
          <div className="alert alert-success" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <p className="text-body" style={{ margin: 0, fontWeight: '500' }}>
              Send exactly <strong>{proof.expectedAmount} {formData.token}</strong> to the address below
            </p>
          </div>
          
          <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p className="text-caption" style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>
                Verification Address
              </p>
              <div style={{
                background: '#1a2332',
                color: 'white',
                padding: '1rem',
                borderRadius: '8px',
                fontFamily: 'IBM Plex Mono, Monaco, monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                cursor: 'pointer'
              }}
              onClick={() => navigator.clipboard.writeText(proof.depositAddress)}
              title="Click to copy"
              >
                {proof.depositAddress}
              </div>
              <p className="text-meta" style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '4px' }}>content_copy</span>
                Click to copy address
              </p>
            </div>

            <div>
              <p className="text-caption" style={{ margin: '0 0 0.5rem 0', color: '#64748b' }}>
                Amount to Send
              </p>
              <div style={{ 
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#3b82f6',
                fontFamily: 'IBM Plex Mono, Monaco, monospace'
              }}>
                {proof.expectedAmount} {formData.token}
              </div>
            </div>
          </div>

          <button 
            onClick={handleCheckStatus} 
            disabled={checkingStatus}
            className="btn btn-success hover-lift"
            style={{
              width: '100%',
              fontSize: '1rem',
              padding: '1rem'
            }}
          >
            {checkingStatus ? (
              <>
                <span className="material-symbols-outlined loading-spinner" style={{ fontSize: '16px', marginRight: '8px' }}>refresh</span>
                Checking Payment...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>search</span>
                Check Payment Status
              </>
            )}
          </button>
          
          <p className="text-caption" style={{ margin: '1rem 0 0 0', textAlign: 'center', color: '#64748b' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>schedule</span>
            Auto-checking every 30 seconds
          </p>
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
        <div className="card fade-in" style={{
          border: '2px solid #dc3545',
          maxWidth: '600px',
          margin: '0 auto 2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#dc3545' }}>error</span>
          </div>
          <h4 className="text-tertiary" style={{ margin: '0 0 1rem 0', color: '#dc3545' }}>
            Verification Failed
          </h4>
          <p className="text-body" style={{ margin: '0 0 1.5rem 0', color: '#dc3545' }}>
            {result.error}
          </p>
          <div style={{
            background: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <p className="text-caption" style={{ margin: 0, color: '#721c24', fontWeight: '500' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>lightbulb</span>
              Common solutions:
            </p>
            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem', textAlign: 'left' }}>
              <li className="text-caption" style={{ color: '#721c24' }}>Ensure you sent the exact amount</li>
              <li className="text-caption" style={{ color: '#721c24' }}>Wait for blockchain confirmations</li>
              <li className="text-caption" style={{ color: '#721c24' }}>Check the transaction hash is correct</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setResult(null);
              setProof(null);
              setTxHash('');
            }}
            className="btn btn-primary"
            style={{ marginRight: '1rem' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>refresh</span>
            Try Again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="btn btn-secondary"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>dashboard</span>
            Go to Dashboard
          </button>
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
