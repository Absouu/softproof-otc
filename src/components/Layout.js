import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const menuItems = [
  { href: '/softproof', label: 'Create Proof', icon: '🧾' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/live-proofs', label: 'Live Proofs', icon: '🌐' },
];

export default function Layout({ children }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [liveProofs, setLiveProofs] = useState([]);

  const syncSession = useCallback(() => {
    try {
      const stored = localStorage.getItem('supabase_session');
      setSession(stored ? JSON.parse(stored) : null);
    } catch (error) {
      console.error('Failed to read session:', error);
      localStorage.removeItem('supabase_session');
      setSession(null);
    }
  }, []);

  const fetchLiveProofs = useCallback(async () => {
    try {
      const { data } = await axios.post('/api/softproof?action=wallet_profile_list');
      const proofs = data.profiles || [];
      setLiveProofs(proofs.map((p) => ({
        id: p.id,
        proofId: p.proof_id,
        address: p.proofs?.address,
        chain: p.proofs?.chain,
        token: p.proofs?.token,
        balance: p.proofs?.balance,
        shareToken: p.share_token,
        note: p.note ?? p.proofs?.note ?? null,
      })));
    } catch (error) {
      console.error('Failed to load live proofs:', error.response?.data?.error || error.message);
      setLiveProofs([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    syncSession();
    const handleUpdate = () => {
      syncSession();
      fetchLiveProofs();
    };
    window.addEventListener('storage', syncSession);
    window.addEventListener('supabase-session-updated', handleUpdate);
    window.addEventListener('wallet-profiles-updated', handleUpdate);
    fetchLiveProofs();
    return () => {
      window.removeEventListener('storage', syncSession);
      window.removeEventListener('supabase-session-updated', handleUpdate);
      window.removeEventListener('wallet-profiles-updated', handleUpdate);
    };
  }, [syncSession, fetchLiveProofs]);

  useEffect(() => {
    fetchLiveProofs();
  }, [fetchLiveProofs]);

  const handleLogout = () => {
    localStorage.removeItem('supabase_session');
    window.dispatchEvent(new Event('supabase-session-updated'));
    setSession(null);
    router.push('/softproof');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: '#f4f5f7' }}>
      <aside style={{ width: '260px', background: '#111827', color: '#fff', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>SoftProof OTC</div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', lineHeight: 1.4, color: 'rgba(255,255,255,0.7)' }}>
            Verify wallet ownership and share trusted OTC contact profiles.
          </p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {menuItems.map((item) => {
            const active = router.pathname === item.href;
            return (
              <Link key={item.href} href={item.href} legacyBehavior>
                <a
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: active ? 600 : 500,
                    transition: 'background 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              </Link>
            );
          })}
          {session && liveProofs.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                Live proofs
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {liveProofs.map((proof) => (
                  <a
                    key={proof.id}
                    href={`/profile/${proof.shareToken}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      background: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{proof.address?.slice(0, 6)}…{proof.address?.slice(-4)}</span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)' }}>
                        {proof.balance != null ? `${Number(proof.balance).toFixed(6)} ${proof.token}` : 'Balance —'}
                      </span>
                      {proof.note && (
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.15rem' }}>
                          {proof.note.slice(0, 40)}{proof.note.length > 40 ? '…' : ''}
                        </span>
                      )}
                    </div>
                    <span className={`chain-badge ${proof.chain}`} style={{ fontSize: '0.65rem' }}>{proof.chain?.toUpperCase()}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
          {session ? (
            <>
              <div style={{ marginBottom: '0.75rem', wordBreak: 'break-word' }}>
                Signed in as<br />
                <span style={{ color: '#fff', fontWeight: 500 }}>{session.user?.email || 'Unknown'} </span>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  transition: 'background 0.2s ease',
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <button
              onClick={() => router.push('/softproof')}
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'background 0.2s ease',
              }}
            >
              Log in
            </button>
          )}
        </div>
      </aside>
      <main style={{ flex: 1, padding: '3rem 3.5rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        {children}
      </main>
    </div>
  );
}
