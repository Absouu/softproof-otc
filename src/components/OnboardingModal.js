import React, { useState, useEffect } from 'react';

export default function OnboardingModal({ isOpen, onClose, isFirstTime }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen && isFirstTime) {
      setCurrentStep(0);
    }
  }, [isOpen, isFirstTime]);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Welcome to SoftProof",
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: '#007BFF' }}>security</span>
          </div>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.8rem', fontWeight: '700', color: '#1a2332' }}>
            Important: This platform verifies wallet ownership without requiring:
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>check_circle</span>
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>Wallet connections (MetaMask, WalletConnect, etc.)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>check_circle</span>
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>Private keys or seed phrases</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>check_circle</span>
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>Browser extensions</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4CAF50' }}>check_circle</span>
              <span style={{ fontSize: '1rem', fontWeight: '500' }}>Smart contract interactions</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '1.1rem', color: '#1a2332', fontWeight: '600' }}>
            You maintain complete custody of your funds at all times.
          </p>
        </div>
      )
    },
    {
      title: "How SoftProof Works",
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#007BFF' }}>send</span>
          </div>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem', fontWeight: '700', color: '#1a2332' }}>
            Micropayment Verification Method
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#007BFF' }}>account_balance_wallet</span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>1. Enter Your Wallet</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Provide your wallet address (no connection needed)</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#4CAF50' }}>send</span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>2. Send Micro-Amount</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Send a tiny amount (0.0001 BTC) to prove control</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#4CAF50' }}>verified_user</span>
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>3. Get Verified</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>Receive verification for your OTC agent</p>
            </div>
          </div>
          <div style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '8px', padding: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#155724', fontWeight: '500' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '8px' }}>security</span>
              This method is safer than wallet connections because you never grant permissions or expose private keys.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Agent-Facilitated Trading",
      content: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#007BFF' }}>handshake</span>
          </div>
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.8rem', fontWeight: '700', color: '#1a2332' }}>
            Built for OTC Desks and Agents
          </h2>
          <div style={{ backgroundColor: '#fff3cd', border: '2px solid #ffeaa7', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '24px', color: '#856404' }}>warning</span>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600', color: '#856404' }}>Important Notice</h3>
            </div>
            <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#856404', fontWeight: '500' }}>
              SoftProof is a verification tool, not a trading platform.
            </p>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: '#856404' }}>
              We never facilitate direct trader connections or circumvent agent relationships.
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#856404', fontStyle: 'italic' }}>
              All trading is coordinated through your trusted OTC agent.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '8px', border: '1px solid #007BFF' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#007BFF', marginBottom: '0.5rem' }}>business</span>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>Agent Tools</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>Verification management for OTC desks</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '8px', border: '1px solid #007BFF' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#007BFF', marginBottom: '0.5rem' }}>security</span>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>Secure Profiles</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>Share verification with your agent only</p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#e8f4fd', borderRadius: '8px', border: '1px solid #007BFF' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#007BFF', marginBottom: '0.5rem' }}>description</span>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>Reports</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>Generate compliance reports</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={handleSkip}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#6c757d',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>close</span>
        </button>

        {/* Progress Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem',
          gap: '0.5rem'
        }}>
          {steps.map((_, index) => (
            <div
              key={index}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index <= currentStep ? '#007BFF' : '#e9ecef',
                transition: 'background-color 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div style={{ marginBottom: '2rem' }}>
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <button
            onClick={handleSkip}
            style={{
              background: 'transparent',
              color: '#6c757d',
              border: '1px solid #e9ecef',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            Skip Tutorial
          </button>
          
          <button
            onClick={handleNext}
            style={{
              background: '#007BFF',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                Get Started
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
