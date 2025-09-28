import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';

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
            style={{ color: '#007bff', fontSize: '1rem', display: 'block', textDecoration: 'underline', fontWeight: '600' }}
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
      <div style={{ color: '#333', fontSize: '1.1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>check_circle</span>
        <span>Wallet balance: {proofs?.balance != null ? `${Number(proofs.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${proofs?.token}` : '—'}</span>
      </div>
      {proofs?.tx_hash && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
          <strong>Proof TX:</strong>{' '}
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
    </div>
  );

  const downloadPDFReport = () => {
    // Create a simple PDF-like report
    const reportContent = `
SOFTPROOF OTC - WALLET VERIFICATION REPORT
Generated: ${new Date().toLocaleString()}

WALLET INFORMATION:
Address: ${profile?.proofs?.address || 'N/A'}
Network: ${profile?.proofs?.chain?.toUpperCase() || 'N/A'}
Balance: ${profile?.proofs?.balance ? `${Number(profile.proofs.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${profile.proofs.token}` : 'N/A'}
Verified: ${profile?.proofs?.verified_at ? new Date(profile.proofs.verified_at).toLocaleString() : 'N/A'}

CONTACT INFORMATION:
Phone: ${profile?.phone || 'Not provided'}
Email: ${profile?.email || 'Not provided'}
Telegram: ${profile?.telegram || 'Not provided'}
Notes: ${profile?.note || 'None'}

IMPORTANT NOTICE:
This verification is for OTC trading through authorized agents only.
SoftProof does not facilitate direct trader-to-trader transactions.
Profile access requires direct link - not searchable or publicly listed.

For trading inquiries, contact your OTC desk or referring agent.
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `softproof-verification-${profile?.proofs?.address?.slice(0, 8) || 'report'}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderContactCard = (details) => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600', color: '#333' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>contact_phone</span>Contact Info & Notes
        </h3>
        <button
          onClick={downloadPDFReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            backgroundColor: '#007BFF',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
          Download Report
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>phone</span>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>Phone / SMS / WhatsApp</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>
            {details.phone ? (
              <a href={`tel:${details.phone}`} style={{ color: '#007bff', textDecoration: 'none' }}>{details.phone}</a>
            ) : 'Not provided'}
          </div>
        </div>
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>email</span>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>Email</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>
            {details.email ? (
              <a href={`mailto:${details.email}`} style={{ color: '#007bff', textDecoration: 'none' }}>{details.email}</a>
            ) : 'Not provided'}
          </div>
        </div>
        <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>send</span>
          </div>
          <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#555', marginBottom: '0.25rem' }}>Telegram</div>
          <div style={{ fontSize: '0.9rem', color: '#333' }}>
            {details.telegram ? (
              <a href={`https://t.me/${details.telegram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>{details.telegram}</a>
            ) : 'Not provided'}
          </div>
        </div>
        {details.note && (
          <div style={{ background: '#fff8e1', border: '1px solid #ffe08a', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>note</span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '500', color: '#665c00', marginBottom: '0.25rem' }}>Note from wallet owner</div>
            <div style={{ fontSize: '0.9rem', color: '#665c00' }}>
              {details.note}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Agent-Facilitated Profile - SoftProof OTC</title>
        <meta name="description" content="This verification profile is designed for sharing via your OTC agent. Not part of any public directory or marketplace." />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      <div className="softproof-container">
        {/* Agent Protection Header Notice */}
        <div style={{
          backgroundColor: '#e8f4fd',
          border: '2px solid #007BFF',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#007BFF' }}>handshake</span>
            <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600', color: '#007BFF' }}>
              Agent-Facilitated Profile
            </h3>
          </div>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#1a2332', fontWeight: '500' }}>
            This verification profile is designed for sharing via your OTC agent.
          </p>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            Not part of any public directory or marketplace.
          </p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#333' }}>
            Wallet Verification Profile
          </h2>
          <p style={{ margin: 0, fontSize: '1rem', color: '#666' }}>
            On-chain verified crypto holdings & contact information
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
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#dc3545' }}>error</span>
          </div>
          <p style={{ margin: 0, fontSize: '1rem', color: '#dc3545' }}>
            {error}
          </p>
        </div>
      )}

      {!error && !profile && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="loading" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>refresh</span>
          </div>
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
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>verified_user</span>
            This profile was created by the wallet owner after proving on-chain control to SoftProof OTC.
          </p>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#666' }}>
            The contact details are provided as a soft proof of association (self or authorized mandate).
          </p>
        </div>
      )}

      {/* Agent Protection Footer Disclaimer */}
      <div style={{
        backgroundColor: '#fff3cd',
        border: '2px solid #ffeaa7',
        borderRadius: '12px',
        padding: '1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#856404' }}>warning</span>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600', color: '#856404' }}>
            Important Notice
          </h3>
        </div>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#856404', fontWeight: '500' }}>
          This verification is for OTC trading through authorized agents only.
        </p>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#856404', fontWeight: '500' }}>
          SoftProof does not facilitate direct trader-to-trader transactions.
        </p>
        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#856404', fontWeight: '500' }}>
          Profile access requires direct link - not searchable or publicly listed.
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#856404', fontStyle: 'italic' }}>
          For trading inquiries, contact your OTC desk or referring agent.
        </p>
      </div>
      </div>
    </>
  );
}

export default SharedProfile;

