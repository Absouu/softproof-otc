import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Privacy() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Privacy Policy - SoftProof OTC</title>
        <meta name="description" content="Learn about SoftProof's privacy practices and data handling policies." />
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
              Privacy Policy
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
              Your privacy and data protection are our top priorities
            </p>

            {/* Last Updated */}
            <div style={{
              backgroundColor: '#F5F5F5',
              border: '1px solid #E1E4E8',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '3rem',
              textAlign: 'center'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Data Collection Section */}
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
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#007BFF' }}>data_object</span>
                Data We Collect
              </h2>
              
              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#1a2332',
                  margin: '0 0 1rem 0'
                }}>
                  Account Information
                </h3>
                <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '1rem', color: '#212529' }}>
                  <li>Email address (for authentication)</li>
                  <li>Account creation timestamp</li>
                  <li>Last login timestamp</li>
                </ul>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d', fontStyle: 'italic' }}>
                  We do not collect names, phone numbers, or other personal identifiers unless you choose to add them to your profile.
                </p>
              </div>

              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '600',
                  color: '#1a2332',
                  margin: '0 0 1rem 0'
                }}>
                  Verification Data
                </h3>
                <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '1rem', color: '#212529' }}>
                  <li>Wallet addresses (for verification purposes)</li>
                  <li>Blockchain transaction hashes</li>
                  <li>Verification timestamps</li>
                  <li>Contact information (if you choose to add it)</li>
                </ul>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d', fontStyle: 'italic' }}>
                  All verification data is encrypted at rest and is only accessible to you and your designated OTC agent.
                </p>
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
                  margin: '0 0 1rem 0'
                }}>
                  Technical Data
                </h3>
                <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '1rem', color: '#212529' }}>
                  <li>IP addresses (for security and rate limiting)</li>
                  <li>Browser type and version</li>
                  <li>Session information</li>
                  <li>Error logs (anonymized)</li>
                </ul>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d', fontStyle: 'italic' }}>
                  Technical data is used solely for security, performance, and service improvement purposes.
                </p>
              </div>
            </section>

            {/* Data Usage Section */}
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
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#007BFF' }}>how_to_reg</span>
                How We Use Your Data
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
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
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>verified_user</span>
                    Verification Services
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                    Process wallet verification requests and maintain verification records for your OTC agent.
                  </p>
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
                    Security & Safety
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                    Monitor for suspicious activity, prevent abuse, and maintain platform security.
                  </p>
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
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>support</span>
                    Customer Support
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                    Provide technical support and respond to your inquiries about the service.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Protection Section */}
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
                Data Protection & Security
              </h2>
              
              <div style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '12px',
                padding: '2rem',
                marginBottom: '2rem'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#155724',
                  margin: '0 0 1rem 0'
                }}>
                  GDPR Compliance
                </h3>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#155724' }}>
                  SoftProof is fully compliant with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.9rem', color: '#155724' }}>
                  <li><strong>Right to Access:</strong> You can request a copy of all data we have about you</li>
                  <li><strong>Right to Rectification:</strong> You can correct inaccurate personal data</li>
                  <li><strong>Right to Erasure:</strong> You can request deletion of your personal data</li>
                  <li><strong>Right to Portability:</strong> You can export your data in a machine-readable format</li>
                  <li><strong>Right to Object:</strong> You can object to processing of your personal data</li>
                </ul>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
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
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>encrypted</span>
                    Encryption
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                    All data is encrypted at rest using AES-256 encryption and in transit using TLS 1.3.
                  </p>
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
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>schedule</span>
                    Data Retention
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                    Verification data is automatically deleted after 90 days of inactivity unless you request earlier deletion.
                  </p>
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
                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#4CAF50' }}>block</span>
                    No Third-Party Sharing
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
                    We never sell, rent, or share your personal data with third parties except as required by law.
                  </p>
                </div>
              </div>
            </section>

            {/* Your Rights Section */}
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
                <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#007BFF' }}>gavel</span>
                Your Rights
              </h2>
              
              <div style={{
                backgroundColor: '#F5F5F5',
                padding: '2rem',
                borderRadius: '12px',
                border: '1px solid #E1E4E8'
              }}>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#212529' }}>
                  You have the following rights regarding your personal data:
                </p>
                <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem', fontSize: '1rem', color: '#212529' }}>
                  <li><strong>Access:</strong> Request a copy of all data we have about you</li>
                  <li><strong>Correction:</strong> Update or correct any inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
                  <li><strong>Portability:</strong> Export your data in a standard format</li>
                  <li><strong>Restriction:</strong> Limit how we process your data</li>
                  <li><strong>Objection:</strong> Object to certain types of data processing</li>
                </ul>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d', fontStyle: 'italic' }}>
                  To exercise any of these rights, contact us at privacy@softproof.io
                </p>
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
                Questions About Privacy?
              </h2>
              <p style={{ margin: '0 0 2rem 0', fontSize: '1rem', color: '#6c757d' }}>
                Contact our privacy team for questions about data handling or to exercise your rights.
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
                  Access Platform
                </button>
                <button 
                  onClick={() => router.push('/security')}
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
                  Security Practices
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
