import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Landing() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>SoftProof OTC - Institutional-Grade Wallet Verification</title>
        <meta name="description" content="Prove wallet ownership without connecting wallets or exposing private keys. Enterprise-grade verification for OTC trading." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </Head>
      
      <div style={{ 
        fontFamily: 'Inter, system-ui, sans-serif',
        lineHeight: '1.5',
        color: '#212529',
        backgroundColor: '#FFFFFF',
        minHeight: '100vh'
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

        {/* Hero Section */}
        <section style={{
          padding: '4rem 0',
          backgroundColor: '#F5F5F5',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <h2 style={{
              fontSize: '3rem',
              fontWeight: '700',
              color: '#1a2332',
              margin: '0 0 1rem 0',
              lineHeight: '1.2'
            }}>
              Institutional-Grade Wallet Verification for OTC Trading
            </h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#6c757d',
              margin: '0 0 2rem 0',
              maxWidth: '800px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Prove wallet ownership without connecting wallets or exposing private keys
            </p>
            
            {/* Trust Badges */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              marginBottom: '3rem',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid #E1E4E8',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>check_circle</span>
                No Wallet Connection Required
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid #E1E4E8',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>security</span>
                Non-Custodial Verification
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid #E1E4E8',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>handshake</span>
                Agent-Facilitated Trading Only
              </div>
            </div>

            <button 
              onClick={() => router.push('/softproof')}
              style={{
                backgroundColor: '#007BFF',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                marginRight: '1rem'
              }}
            >
              Start Verification
            </button>
            <button 
              onClick={() => router.push('/security')}
              style={{
                backgroundColor: 'transparent',
                color: '#007BFF',
                border: '2px solid #007BFF',
                padding: '14px 30px',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              Learn About Security
            </button>
          </div>
        </section>

        {/* How It Works Section */}
        <section style={{ padding: '4rem 0', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <h3 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1a2332',
              textAlign: 'center',
              margin: '0 0 1rem 0'
            }}>
              Why SoftProof is Safer Than Wallet Connections
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#6c757d',
              textAlign: 'center',
              margin: '0 0 3rem 0'
            }}>
              Traditional wallet connections create security risks. SoftProof uses a safer verification method.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '2rem',
              marginBottom: '3rem'
            }}>
              {/* No Smart Contract Risk */}
              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#FF0000' }}>warning</span>
                  <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600', color: '#1a2332' }}>
                    No Smart Contract Risk
                  </h4>
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                  Unlike WalletConnect or MetaMask integrations, SoftProof never accesses your wallet directly
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                  Zero exposure to malicious contracts or approval exploits
                </p>
              </div>

              {/* Micropayment Verification */}
              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#4CAF50' }}>send</span>
                  <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600', color: '#1a2332' }}>
                    Micropayment Verification
                  </h4>
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                  Send a minimal amount (0.0001 BTC) from your wallet to prove control
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                  One-way transaction eliminates phishing and private key risks
                </p>
              </div>

              {/* Agent-Facilitated Only */}
              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#007BFF' }}>handshake</span>
                  <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600', color: '#1a2332' }}>
                    Agent-Facilitated Only
                  </h4>
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                  Not a marketplace - all trades coordinated through your trusted OTC agent
                </p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                  Profiles are verification tools, not trading advertisements
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Security Assurances Section */}
        <section style={{ padding: '4rem 0', backgroundColor: '#F5F5F5' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <h3 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1a2332',
              textAlign: 'center',
              margin: '0 0 1rem 0'
            }}>
              Enterprise Security Standards
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem',
              marginBottom: '3rem'
            }}>
              {[
                'No browser extensions required',
                'No seed phrase exposure',
                'No transaction signing permissions',
                'Verification data encrypted at rest',
                'GDPR compliant data handling',
                'No third-party wallet APIs'
              ].map((feature, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  backgroundColor: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  border: '1px solid #E1E4E8'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>check_circle</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Agents Section */}
        <section style={{ padding: '4rem 0', backgroundColor: 'white' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <h3 style={{
              fontSize: '2.5rem',
              fontWeight: '700',
              color: '#1a2332',
              textAlign: 'center',
              margin: '0 0 1rem 0'
            }}>
              Built for OTC Desks and Agents
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: '#6c757d',
              textAlign: 'center',
              margin: '0 0 2rem 0'
            }}>
              SoftProof is a verification tool, not a trading platform
            </p>
            <p style={{
              fontSize: '1rem',
              color: '#212529',
              textAlign: 'center',
              margin: '0 0 2rem 0',
              fontStyle: 'italic'
            }}>
              We never facilitate direct trader connections or circumvent agent relationships
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '2rem'
            }}>
              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8',
                textAlign: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#007BFF', marginBottom: '1rem' }}>business</span>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#1a2332' }}>
                  White-label Options
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                  Custom branding and integration for OTC desks
                </p>
              </div>

              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8',
                textAlign: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#4CAF50', marginBottom: '1rem' }}>analytics</span>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#1a2332' }}>
                  Bulk Verification Management
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                  Manage multiple client verifications efficiently
                </p>
              </div>

              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8',
                textAlign: 'center'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#007BFF', marginBottom: '1rem' }}>description</span>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.3rem', fontWeight: '600', color: '#1a2332' }}>
                  Client Reports
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                  Generate verification reports for compliance
                </p>
              </div>
            </div>
          </div>
        </section>

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
