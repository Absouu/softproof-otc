import React from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';

const explorerMap = {
  btc: (addr) => `https://www.blockchain.com/explorer/addresses/btc/${addr}`,
  eth: (addr) => `https://etherscan.io/address/${addr}`,
  trx: (addr) => `https://tronscan.org/#/address/${addr}`,
};

const fetchLiveProofs = async () => {
  const { data } = await axios.post('/api/softproof?action=wallet_profile_list');
  return data.profiles || [];
};

export default function LiveProofs() {
  const { data: profiles = [], isLoading, error } = useQuery({
    queryKey: ['live-proofs-public'],
    queryFn: fetchLiveProofs,
  });

  if (isLoading) {
    return (
      <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
        <p>Error: {error.message}</p>
      </div>
    );
  }

  const walletEntries = profiles
    .filter((p) => (p.publish_mode || 'per_wallet') === 'per_wallet')
    .map((p) => ({
      type: 'wallet',
      id: `${p.proof_id}-${p.id}`,
      address: p.proofs?.address,
      chain: p.proofs?.chain,
      balance: p.proofs?.balance,
      token: p.proofs?.token,
      verified_at: p.proofs?.verified_at,
      link: `/profile/${p.share_token}`,
    }));

  const combined = [...walletEntries];

  return (
    <div style={{ width: '100%', maxWidth: '960px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: '600', color: '#333' }}>Live Proofs</h2>
      {combined.length === 0 ? (
        <p style={{ color: '#666' }}>No published wallet profiles yet.</p>
      ) : (
        <div className="wallet-table-wrapper">
          <table className="wallet-table">
            <thead>
              <tr>
                <th>Wallet</th>
                <th>Chain</th>
                <th>Wallet balance</th>
                <th>Verified at</th>
                <th>Share link</th>
              </tr>
            </thead>
            <tbody>
              {combined.map((entry) => (
                <tr key={entry.id}>
                  <td>
                    <a href={explorerMap[entry.chain]?.(entry.address) || '#'} target="_blank" rel="noopener noreferrer">
                      {entry.address?.slice(0, 10)}…{entry.address?.slice(-6)}
                    </a>
                  </td>
                  <td>{entry.chain?.toUpperCase()}</td>
                  <td>{entry.balance != null ? `${Number(entry.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })} ${entry.token}` : '—'}</td>
                  <td>{entry.verified_at ? new Date(entry.verified_at).toLocaleString() : '—'}</td>
                  <td>
                    <a href={entry.link} target="_blank" rel="noopener noreferrer">
                      View profile
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
