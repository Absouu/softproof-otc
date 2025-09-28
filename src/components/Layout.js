import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Head from 'next/head';

const menuItems = [
  { href: '/softproof', label: 'Verify Wallet', icon: 'verified_user' },
  { href: '/dashboard', label: 'My Wallets', icon: 'account_balance_wallet' },
  { href: '/live-proofs', label: 'Browse Profiles', icon: 'search' },
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
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif', background: '#f4f5f7' }}>
        {/* Trust Banner */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#3b82f6',
        color: 'white',
        padding: '8px 0',
        textAlign: 'center',
        fontSize: '0.8rem',
        fontWeight: '500',
        zIndex: 1000
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '8px' }}>shield</span>
        Secure • Non-custodial • Agent-facilitated
      </div>
      
      <div style={{ display: 'flex', flex: 1 }}>
        <aside style={{ width: '260px', background: '#1a2332', color: '#fff', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '48px' }}>
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
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>{item.icon}</span>
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
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              SoftProof OTC v2.0
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
              Professional Registry
            </div>
          </div>
        </div>
        </aside>
        <main style={{ flex: 1, padding: '3rem 3.5rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginTop: '48px' }}>
          {children}
        </main>
      </div>
      
      {/* Footer with Trust Signals */}
      <footer style={{
        backgroundColor: '#1a2332',
        color: 'white',
        padding: '2rem 0',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4CAF50' }}>security</span>
              <span>256-bit Encryption</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4CAF50' }}>lock</span>
              <span>Non-Custodial</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4CAF50' }}>verified_user</span>
              <span>GDPR Compliant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4CAF50' }}>shield</span>
              <span>Enterprise Security</span>
            </div>
          </div>
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
            Powered by enterprise-grade blockchain infrastructure
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>
            Non-custodial verification protocol • No third-party wallet APIs • Agent-facilitated OTC only
          </p>
        </div>
      </footer>
      </div>
    </>
  );
}
