import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';

function CreateClientProof() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    receiving_address: '',
    amount: 0.0001,
    chain: 'btc',
    token: 'BTC'
  });
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('supabase_session');
    if (stored) {
      setSession(JSON.parse(stored));
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/softproof?action=create_client_proof', {
        receiving_address: formData.receiving_address,
        amount: formData.amount,
        chain: formData.chain,
        token: formData.token
      }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      setResult(response.data);
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (!session) {
    return (
      <div className="softproof-container">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2>Login Required</h2>
          <p>Please log in to create client proof links.</p>
          <button onClick={() => router.push('/softproof')} className="btn btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Create Client Proof - SoftProof OTC</title>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      <div className="softproof-container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#333' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', marginRight: '8px' }}>link</span>
            Create Client Proof Link
          </h2>
          <p style={{ margin: 0, fontSize: '1rem', color: '#666' }}>
            Generate a shareable link for client wallet verification
          </p>
        </div>

        {!result ? (
          <div style={{
            background: 'white',
            border: '1px solid #e1e5e9',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>account_balance_wallet</span>
                    Receiving Address
                  </label>
                  <input
                    type="text"
                    placeholder="Enter the address to receive payments"
                    value={formData.receiving_address}
                    onChange={e => setFormData({ ...formData, receiving_address: e.target.value })}
                    className="form-input"
                    style={{ fontFamily: 'IBM Plex Mono, Monaco, monospace', fontSize: '0.9rem' }}
                    required
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
                          amount: chain === 'btc' ? 0.0001 : chain === 'eth' ? 0.0001 : 10
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
                      Amount ({formData.token})
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0.0001 })}
                      className="form-input"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading || !formData.receiving_address}
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
                      Creating Link...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>add_link</span>
                      Create Client Proof Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
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
              <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>check_circle</span>
            </div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#28a745' }}>
              Client Proof Link Created!
            </h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>
                Share this link with your client:
              </p>
              <div style={{
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '1rem',
                fontFamily: 'IBM Plex Mono, Monaco, monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
              onClick={() => copyToClipboard(result.share_url)}
              title="Click to copy"
              >
                {result.share_url}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '4px' }}>content_copy</span>
                Click to copy link
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500', color: '#555' }}>
                QR Code (for mobile sharing):
              </p>
              <div style={{
                background: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '1rem',
                display: 'inline-block'
              }}>
                {/* QR Code would be generated here */}
                <div style={{ 
                  width: '150px', 
                  height: '150px', 
                  background: '#f8f9fa', 
                  border: '2px dashed #dee2e6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: '#666'
                }}>
                  QR Code
                </div>
              </div>
            </div>

            <div style={{
              background: '#e8f5e8',
              border: '1px solid #4caf50',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>info</span>
                Link expires in 24 hours. Client must send exactly {result.client_proof.amount} {result.client_proof.token} to {result.client_proof.receiving_address}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => copyToClipboard(result.share_url)}
                className="btn btn-primary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>content_copy</span>
                Copy Link
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn btn-secondary"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>dashboard</span>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}

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
            Client proof links expire after 24 hours for security. You can revoke them anytime from your dashboard.
          </p>
        </div>
      </div>
    </>
  );
}

export default CreateClientProof;
