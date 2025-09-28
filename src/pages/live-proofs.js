import React, { useState, useEffect } from 'react';
import Head from 'next/head';
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

const SecurityTooltip = ({ children, content }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {showTooltip && (
        <div className="absolute z-50 w-64 p-3 mt-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg">
          <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 transform rotate-45"></div>
          {content}
        </div>
      )}
    </div>
  );
};

export default function LiveProofs() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: profiles = [], isLoading, error, refetch } = useQuery({
    queryKey: ['live-proofs-public'],
    queryFn: fetchLiveProofs,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Auto-refresh balances every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRefreshing(true);
      refetch().finally(() => {
        setIsRefreshing(false);
        setLastRefresh(new Date());
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    setLastRefresh(new Date());
  };

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

  const exportToCSV = () => {
    const csvContent = [
      ['Wallet Address', 'Network', 'Balance', 'Token', 'Verified At', 'Profile Link'],
      ...walletEntries.map(entry => [
        entry.address,
        entry.chain?.toUpperCase(),
        entry.balance != null ? `${Number(entry.balance).toLocaleString(undefined, { maximumFractionDigits: 8 })}` : '—',
        entry.token || '—',
        entry.verified_at ? new Date(entry.verified_at).toLocaleString() : '—',
        `${window.location.origin}${entry.link}`
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `softproof-verifications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Live Verifications - SoftProof OTC</title>
          <meta name="description" content="Public registry of verified wallet addresses for OTC trading" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        </Head>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-gray-600">
              <span className="material-symbols-outlined animate-spin">refresh</span>
              <span>Loading verification registry...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Head>
          <title>Live Verifications - SoftProof OTC</title>
          <meta name="description" content="Public registry of verified wallet addresses for OTC trading" />
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        </Head>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span className="material-symbols-outlined">error</span>
              <span className="font-medium">Error loading verification registry</span>
            </div>
            <p className="text-red-600 mt-2">{error.message}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Live Verifications - SoftProof OTC</title>
        <meta name="description" content="Public registry of verified wallet addresses for OTC trading" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </Head>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <span className="material-symbols-outlined text-blue-600">public</span>
                <span>Live Verification Registry</span>
              </h1>
              <p className="text-gray-600 mt-2">Public registry of verified wallet addresses for OTC trading</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <button
                onClick={exportToCSV}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <span className="material-symbols-outlined">download</span>
                <span>Export CSV</span>
              </button>
            </div>
          </div>
          
          {/* Active Verifications Counter */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-blue-600">verified</span>
                <div>
                  <h3 className="font-semibold text-blue-900">Active Verifications</h3>
                  <p className="text-blue-700">{walletEntries.length} verified wallets currently active</p>
                </div>
              </div>
              <div className="text-sm text-blue-600">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Context Tooltip */}
        <div className="mb-6">
          <SecurityTooltip content="This registry shows publicly verified wallet addresses. All verifications are completed through secure micropayment verification - no wallet connections required.">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>Hover for security information</span>
            </div>
          </SecurityTooltip>
        </div>

        {/* Verification Table */}
        {walletEntries.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">inbox</span>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Published Verifications</h3>
            <p className="text-gray-600">No wallet profiles have been published to the public registry yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wallet Address</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Network</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified At</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
              </tr>
            </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {walletEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <a 
                            href={explorerMap[entry.chain]?.(entry.address) || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-mono text-sm text-blue-600 hover:text-blue-800"
                          >
                            {entry.address?.slice(0, 8)}...{entry.address?.slice(-8)}
                          </a>
                          <span className="material-symbols-outlined text-gray-400 text-sm">open_in_new</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {entry.chain?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.balance != null ? (
                          <div>
                            <div className="font-medium">{Number(entry.balance).toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                            <div className="text-gray-500 text-xs">{entry.token}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.verified_at ? new Date(entry.verified_at).toLocaleDateString() : '—'}
                  </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a 
                          href={entry.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span className="text-sm">View Profile</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
        </div>
      )}
    </div>
    </>
  );
}
