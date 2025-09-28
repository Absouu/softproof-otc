import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const explorerMap = {
  btc: (addr) => `https://www.blockchain.com/explorer/addresses/btc/${addr}`,
  eth: (addr) => `https://etherscan.io/address/${addr}`,
  trx: (addr) => `https://tronscan.org/#/address/${addr}`,
};

function SharedProfile() {
  const router = useRouter();
  const { token } = router.query;
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setError('');
    setProfile(null);
    axios
      .post('/api/softproof?action=wallet_profile_view', { token })
      .then((res) => setProfile(res.data.profile))
      .catch((e) => setError(e.response?.data?.error || e.message));
  }, [token]);

  const renderProofCard = ({ proofs, note }) => (
    <div key={proofs?.tx_hash || proofs?.address} className="card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <a
            href={explorerMap[proofs?.chain]?.(proofs?.address) || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#333', fontSize: '1rem', display: 'block', textDecoration: 'none', fontWeight: '600' }}
          >
            {proofs?.address}
          </a>
          <span className={`chain-badge ${proofs?.chain}`} style={{ marginTop: '0.25rem', display: 'inline-block' }}>
            {proofs?.chain?.toUpperCase()}
          </span>
        </div>
        <span style={{ color: '#666', fontSize: '0.8rem' }}>
          {proofs?.verified_at ? new Date(proofs.verified_at).toLocaleString() : '—'}
        </span>
      </div>
      <div style={{ color: '#333', fontSize: '1.1rem', fontWeight: '600' }}>
        ✅ Wallet balance: {proofs?.balance != null ? `${Number(proofs.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${proofs?.token}` : '—'}
      </div>
      {proofs?.tx_hash && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
          <strong>TX:</strong>{' '}
          <a
            href={`${explorerMap[proofs?.chain]?.('').replace(/address\/$/, 'tx/')}${proofs.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            {proofs.tx_hash}
          </a>
        </div>
      )}
      {note && (
        <div style={{ marginTop: '1rem', background: '#eef7ff', border: '1px solid #cde3ff', borderRadius: '8px', padding: '0.75rem' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#24507a' }}>
            <strong>Note on this wallet:</strong><br />
            {note}
          </p>
        </div>
      )}
    </div>
  );

  const renderContactCard = (details) => (
    <div className="card">
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#333' }}>
        📞 Contact Information
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📱</div>
          <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>Phone / SMS / WhatsApp</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>
            {details.phone ? (
              <a href={`tel:${details.phone}`} style={{ color: '#007bff', textDecoration: 'none' }}>{details.phone}</a>
            ) : 'Not provided'}
          </div>
        </div>
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>📧</div>
          <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>Email</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>
            {details.email ? (
              <a href={`mailto:${details.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>{details.email}</a>
            ) : 'Not provided'}
          </div>
        </div>
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>✈️</div>
          <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>Telegram</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>
            {details.telegram ? (
              <a href={`https://t.me/${details.telegram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>{details.telegram}</a>
            ) : 'Not provided'}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="softproof-container">
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#333' }}>
          Shared Profile
        </h2>
        <p style={{ margin: 0, fontSize: '1rem', color: '#666' }}>
          Verified Crypto Holdings & Contact Information
        </p>
      </div>

      {error && (
        <div style={{
          background: 'white',
          border: '2px solid #dc3545',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <p style={{ margin: 0, fontSize: '1rem', color: '#dc3545' }}>
            {error}
          </p>
        </div>
      )}

      {!error && !profile && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔄</div>
          <p style={{ color: '#666', fontSize: '1rem' }}>Loading profile...</p>
        </div>
      )}

      {profile && (
        <>
          {renderProofCard({ proofs: profile.proofs, note: profile.note })}
          {renderContactCard(profile)}
        </>
      )}

      {profile && (
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          background: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            🤝 This profile was created by the wallet owner after proving on-chain control to SoftProof OTC.
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>
            The contact details are provided as a soft proof of association (self or authorized mandate).
          </p>
        </div>
      )}
    </div>
  );
}

export default SharedProfile;

