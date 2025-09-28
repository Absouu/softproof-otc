import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Security() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Security - SoftProof OTC</title>
        <meta name="description" content="Learn about SoftProof's security practices and why our verification method is safer than wallet connections." />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      
      <div style={{ 
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: '1.5',
        color: '#212529',
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
        padding: '2rem 0'
      }}>
        {/* Header */}
        <header style={{
          backgroundColor: '#1a2332',
          color: 'white',
          padding: '1rem 0',
          borderBottom: '1px solid #E1E4E8'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>security</span>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>SoftProof OTC</h1>
            </div>
            <button 
              onClick={() => router.push('/softproof')}
              style={{
                backgroundColor: '#007BFF',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: '500',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              Access Platform
            </button>
          </div>
        </header>

        {/* Trust Banner */}
        <div style={{
          backgroundColor: '#e8f5e8',
          border: '1px solid #4CAF50',
          padding: '12px 0',
          textAlign: 'center',
          fontSize: '0.9rem',
          fontWeight: '500',
          color: '#2e7d32'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>lock</span>
          No wallet connection required • We never ask for your private keys • Agent-facilitated OTC only
        </div>

        {/* Main Content */}
        <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ padding: '3rem 0' }}>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: '#1a2332',
              margin: '0 0 1rem 0',
              textAlign: 'center'
            }}>
              Security Practices
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#6c757d',
              textAlign: 'center',
              margin: '0 0 3rem 0',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Enterprise-grade security standards that protect your assets and privacy
            </p>

            {/* Technical Security Section */}
            <section style={{ marginBottom: '4rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1a2332',
                margin: '0 0 2rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#007BFF' }}>shield</span>
                Technical Security
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  backgroundColor: '#F5F5F5',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #E1E4E8'
                }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#1a2332',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>lock</span>
                    No Wallet API Integrations
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                    SoftProof never integrates with wallet APIs like MetaMask, WalletConnect, or browser extensions.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                    <li>No JavaScript wallet libraries</li>
                    <li>No browser extension permissions</li>
                    <li>No smart contract interactions</li>
                  </ul>
                </div>

                <div style={{
                  backgroundColor: '#F5F5F5',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #E1E4E8'
                }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#1a2332',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>encrypted</span>
                    Encrypted Data Storage
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                    All verification data is encrypted at rest using AES-256 encryption.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                    <li>Database encryption at rest</li>
                    <li>Secure key management</li>
                    <li>Regular security audits</li>
                  </ul>
                </div>

                <div style={{
                  backgroundColor: '#F5F5F5',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #E1E4E8'
                }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#1a2332',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>verified_user</span>
                    Single-Use Addresses
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                    Each verification uses a unique, single-use address that cannot be reused.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                    <li>Prevents address reuse attacks</li>
                    <li>Unique verification per session</li>
                    <li>Automatic address rotation</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Operational Security Section */}
            <section style={{ marginBottom: '4rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1a2332',
                margin: '0 0 2rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#007BFF' }}>admin_panel_settings</span>
                Operational Security
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem',
                marginBottom: '2rem'
              }}>
                <div style={{
                  backgroundColor: '#F5F5F5',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #E1E4E8'
                }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#1a2332',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>schedule</span>
                    Session Management
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                    Automatic session timeouts and secure session handling.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                    <li>Automatic session timeouts</li>
                    <li>Secure session tokens</li>
                    <li>IP-based rate limiting</li>
                  </ul>
                </div>

                <div style={{
                  backgroundColor: '#F5F5F5',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #E1E4E8'
                }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#1a2332',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>visibility_off</span>
                    Privacy Protection
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                    No public profile discovery or directory listings.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                    <li>No public profile discovery</li>
                    <li>Direct link access only</li>
                    <li>Agent-facilitated sharing</li>
                  </ul>
                </div>

                <div style={{
                  backgroundColor: '#F5F5F5',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #E1E4E8'
                }}>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: '600',
                    color: '#1a2332',
                    margin: '0 0 1rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>security</span>
                    Access Control
                  </h3>
                  <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                    Strict access controls and authentication requirements.
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#6c757d' }}>
                    <li>Multi-factor authentication support</li>
                    <li>Role-based access control</li>
                    <li>Activity logging and monitoring</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Why This Method is Safer Section */}
            <section style={{ marginBottom: '4rem' }}>
              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#1a2332',
                margin: '0 0 2rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#FF0000' }}>warning</span>
                Why SoftProof is Safer Than Wallet Connections
              </h2>
              
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#856404',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#FF0000' }}>dangerous</span>
                  Wallet Connection Risks
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#856404' }}>
                  Traditional wallet connections (MetaMask, WalletConnect) create significant security risks:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#856404' }}>
                  <li><strong>Smart Contract Exploits:</strong> Malicious contracts can drain your entire wallet</li>
                  <li><strong>Permission Abuse:</strong> Websites can request unlimited transaction approvals</li>
                  <li><strong>Phishing Attacks:</strong> Fake websites can steal your private keys</li>
                  <li><strong>Browser Extension Vulnerabilities:</strong> Compromised extensions can access all funds</li>
                </ul>
              </div>

              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '12px',
                padding: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#155724',
                  margin: '0 0 1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>security</span>
                  SoftProof's Safe Method
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#155724' }}>
                  SoftProof eliminates these risks by using a one-way verification method:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#155724' }}>
                  <li><strong>No Wallet Connection:</strong> We never access your wallet directly</li>
                  <li><strong>One-Way Transaction:</strong> You send a tiny amount to prove control</li>
                  <li><strong>No Smart Contracts:</strong> Zero exposure to malicious contract exploits</li>
                  <li><strong>No Permissions:</strong> We never request transaction signing permissions</li>
                  <li><strong>Minimal Risk:</strong> Only the verification amount is at risk (e.g., 0.0001 BTC)</li>
                </ul>
              </div>
            </section>

            {/* Contact Section */}
            <section style={{
              backgroundColor: '#F5F5F5',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: '600',
                color: '#1a2332',
                margin: '0 0 1rem 0'
              }}>
                Questions About Security?
              </h2>
              <p style={{ margin: '0 0 2rem 0', fontSize: '1rem', color: '#6c757d' }}>
                Contact our security team for technical questions or security concerns.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => router.push('/softproof')}
                  style={{
                    backgroundColor: '#007BFF',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                >
                  Start Verification
                </button>
                <button 
                  onClick={() => router.push('/privacy')}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#007BFF',
                    border: '2px solid #007BFF',
                    padding: '10px 22px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif'
                  }}
                >
                  Privacy Policy
                </button>
              </div>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          backgroundColor: '#1a2332',
          color: 'white',
          padding: '2rem 0',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
              Powered by enterprise-grade blockchain infrastructure
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>
              Non-custodial verification protocol • GDPR compliant • No third-party wallet APIs
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
