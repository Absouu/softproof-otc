import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import { useRouter } from 'next/router';

function ClientProof() {
  const router = useRouter();
  const { token } = router.query;
  const [clientProof, setClientProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    if (!token) return;
    
    const fetchClientProof = async () => {
      try {
        const response = await axios.post('/api/softproof?action=verify_client_proof', {
          share_token: token
        });
        setClientProof(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Client proof not found or expired');
      } finally {
        setLoading(false);
      }
    };

    fetchClientProof();
  }, [token]);

  const handleSubmit = async () => {
    if (!walletAddress.trim()) {
      alert('Please enter your wallet address');
      return;
    }

    try {
      await axios.post('/api/softproof?action=complete_client_proof', {
        share_token: token,
        client_wallet_address: walletAddress.trim()
      });
      setPaymentStatus('completed');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return (
      <div className="softproof-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading-spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined">refresh</span>
          </div>
          <p>Loading client proof...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="softproof-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#dc3545' }}>
            <span className="material-symbols-outlined">error</span>
          </div>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Client Proof Not Found</h2>
          <p style={{ color: '#666' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'completed') {
    return (
      <div className="softproof-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#28a745' }}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <h2 style={{ color: '#28a745', marginBottom: '1rem' }}>Payment Verified!</h2>
          <p style={{ color: '#666' }}>Your wallet ownership has been verified successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      <div className="softproof-container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#333' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', marginRight: '8px' }}>security</span>
            Client Proof Verification
          </h2>
          <p style={{ margin: 0, fontSize: '1rem', color: '#666' }}>
            Verify your wallet ownership for agent-facilitated trading
          </p>
        </div>

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
            <span className="material-symbols-outlined" style={{ fontSize: '20px', marginRight: '8px' }}>send</span>
            Send Payment to Verify
          </h3>
          
          <div className="alert alert-info" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <p style={{ margin: 0, fontWeight: '500' }}>
              Send exactly <strong>{clientProof.amount} {clientProof.token}</strong> to the address below
            </p>
          </div>
          
          <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>
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
              onClick={() => navigator.clipboard.writeText(clientProof.receiving_address)}
              title="Click to copy"
              >
                {clientProof.receiving_address}
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '4px' }}>content_copy</span>
                Click to copy address
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#64748b' }}>
                Amount to Send
              </p>
              <div style={{ 
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#3b82f6',
                fontFamily: 'IBM Plex Mono, Monaco, monospace'
              }}>
                {clientProof.amount} {clientProof.token}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#333' }}>
              Your Wallet Address
            </label>
            <input
              type="text"
              placeholder="Enter the wallet address you're sending from"
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontFamily: 'IBM Plex Mono, Monaco, monospace'
              }}
            />
          </div>

          <button 
            onClick={handleSubmit}
            disabled={!walletAddress.trim()}
            style={{
              width: '100%',
              background: '#28a745',
              color: 'white',
              border: 'none',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: walletAddress.trim() ? 'pointer' : 'not-allowed',
              opacity: walletAddress.trim() ? 1 : 0.6
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>check_circle</span>
            Verify Payment
          </button>
          
          <p style={{ margin: '1rem 0 0 0', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '4px' }}>schedule</span>
            Link expires: {new Date(clientProof.expires_at).toLocaleString()}
          </p>
        </div>

        <div style={{
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          padding: '1rem',
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>info</span>
            This is a secure verification process. Your payment proves ownership of your wallet.
          </p>
        </div>
      </div>
    </>
  );
}

export default ClientProof;
