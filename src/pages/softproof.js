import React, { useEffect, useState } from 'react';
import axios from 'axios';

function SoftProof() {
  const [session, setSession] = useState(null);
  const [auth, setAuth] = useState({ email: '', password: '', isSignup: false });

  const [formData, setFormData] = useState({ wa: '', chain: 'btc', token: 'BTC', baseAmount: 0.0001, baseAmountCurrency: 'btc' });
  const [proof, setProof] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('supabase_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSession(parsed);
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

  return (
    <div className="softproof-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#333' }}>
          SoftProof OTC
        </h2>
        <p style={{ margin: 0, fontSize: '1rem', color: '#666' }}>
          Self-Generated Addresses · Micro-Proofs · Instant Verification
        </p>
      </div>

      {!session && (
        <div className="auth-container">
          <h3>Login Required</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            Login to create proofs, track status, and manage your contact profile.
          </p>
          <input
            placeholder="Email"
            value={auth.email}
            onChange={e => setAuth({ ...auth, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={auth.password}
            onChange={e => setAuth({ ...auth, password: e.target.value })}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleAuth}>{auth.isSignup ? 'Sign Up' : 'Login'}</button>
            <button onClick={() => setAuth({ ...auth, isSignup: !auth.isSignup })}>
              {auth.isSignup ? 'Switch to Login' : 'Switch to Sign Up'}
            </button>
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
        <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#333', textAlign: 'center' }}>
          Create Your Proof
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '500', color: '#555', marginBottom: '0.5rem' }}>
              💳 Wallet Address
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
                🔗 Blockchain
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
                    baseAmount: chain === 'btc' ? 0.0001 : chain === 'eth' ? 0.001 : 10
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
                💰 Amount to Prove
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
              fontFamily: 'Inter, system-ui, sans-serif'
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
            {loading ? '🔄 Generating Address...' : '🚀 Generate Payment Address'}
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
          <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#333', textAlign: 'center' }}>
            💳 Payment Instructions
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
                🎯 Send to Address:
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
                💰 Exact Amount to Send:
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
              ⏰ We'll automatically check for your payment every 30 seconds.
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
              {checkingStatus ? '🔄 Checking...' : '✅ Check Status Now'}
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
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
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
                🔄 Redirecting to dashboard...
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
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
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
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ margin: 0, fontSize: '1rem', color: '#dc3545' }}>
            {result.error}
          </p>
        </div>
      )}
    </div>
  );
}

export default SoftProof;
