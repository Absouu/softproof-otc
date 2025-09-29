import React, { useState } from 'react';
import axios from 'axios';

function InviteWizard({ isOpen, onClose, onSuccess, proofs, session, shareType = 'simple' }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    selected_proofs: [],
    is_gated: false,
    gate_type: 'none',
    gate_password: '',
    expiry_type: 'none',
    max_uses: 10,
    inactivity_days: 7,
    fixed_days: 14,
    max_views: 10,
    notify_email: ''
  });

  const [createdInvite, setCreatedInvite] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/invites?action=create_invite', {
        ...formData,
        proof_ids: formData.selected_proofs
      }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });

      setCreatedInvite(response.data.invite);
      // Don't close immediately, show the success screen
    } catch (error) {
      alert('Error creating invite: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (createdInvite) {
      onSuccess(createdInvite);
    }
    onClose();
  };

  const handleProofToggle = (proofId) => {
    setFormData(prev => ({
      ...prev,
      selected_proofs: prev.selected_proofs.includes(proofId)
        ? prev.selected_proofs.filter(id => id !== proofId)
        : [...prev.selected_proofs, proofId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            {createdInvite ? 'Link Created Successfully!' : 
             shareType === 'simple' ? 'Share Profile' : 'Create Secure Link'}
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Basic Information</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Link Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., My OTC Trading Profile"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of what this link contains..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Select Wallets to Share *
              </label>
              <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e1e5e9', borderRadius: '8px', padding: '0.5rem' }}>
                {proofs.map(proof => (
                  <label key={proof.id} style={{ display: 'flex', alignItems: 'center', padding: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.selected_proofs.includes(proof.id)}
                      onChange={() => handleProofToggle(proof.id)}
                      style={{ marginRight: '0.5rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                        {proof.address.slice(0, 10)}...{proof.address.slice(-6)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {proof.chain.toUpperCase()} • {proof.balance} {proof.token}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!formData.title || formData.selected_proofs.length === 0}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: formData.title && formData.selected_proofs.length > 0 ? 'pointer' : 'not-allowed',
                opacity: formData.title && formData.selected_proofs.length > 0 ? 1 : 0.6
              }}
            >
              Next: Security Settings
            </button>
          </div>
        )}

        {/* Step 2: Security & Gating */}
        {step === 2 && (
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>
              {shareType === 'simple' ? 'Sharing Options' : 'Security & Access Control'}
            </h3>
            
            {shareType === 'simple' ? (
              <div style={{ 
                background: '#f0f9ff', 
                border: '1px solid #bae6fd', 
                borderRadius: '8px', 
                padding: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0ea5e9' }}>info</span>
                  <span style={{ fontWeight: '500', color: '#0c4a6e' }}>Simple Sharing</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a6e' }}>
                  Creates a public link that anyone can view. Perfect for general sharing.
                </p>
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_gated}
                    onChange={e => setFormData({ ...formData, is_gated: e.target.checked })}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{ fontWeight: '500' }}>Require authentication to view</span>
                </label>
              </div>
            )}

            {formData.is_gated && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Authentication Method
                </label>
                <select
                  value={formData.gate_type}
                  onChange={e => setFormData({ ...formData, gate_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="password">Password Protection</option>
                  <option value="email">Email Verification</option>
                </select>
              </div>
            )}

            {formData.is_gated && formData.gate_type === 'password' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.gate_password}
                  onChange={e => setFormData({ ...formData, gate_password: e.target.value })}
                  placeholder="Enter password for access"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}

            {formData.is_gated && formData.gate_type === 'email' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Email for Verification
                </label>
                <input
                  type="email"
                  value={formData.notify_email}
                  onChange={e => setFormData({ ...formData, notify_email: e.target.value })}
                  placeholder="Enter email for verification"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Next: Expiry Settings
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Expiry & Limits */}
        {step === 3 && (
          <div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Expiry & Usage Limits</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Expiry Type
              </label>
              <select
                value={formData.expiry_type}
                onChange={e => setFormData({ ...formData, expiry_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              >
                <option value="none">No Expiry (Permanent)</option>
                <option value="fixed">Fixed Date (X days)</option>
                <option value="usage">After X Views</option>
                <option value="inactivity">After X Days of Inactivity</option>
              </select>
            </div>

            {formData.expiry_type === 'fixed' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Expires After (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={formData.fixed_days}
                  onChange={e => setFormData({ ...formData, fixed_days: parseInt(e.target.value) || 14 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}

            {formData.expiry_type === 'usage' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Max Views
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.max_uses}
                  onChange={e => setFormData({ ...formData, max_uses: parseInt(e.target.value) || 10 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}

            {formData.expiry_type === 'inactivity' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Inactivity Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={formData.inactivity_days}
                  onChange={e => setFormData({ ...formData, inactivity_days: parseInt(e.target.value) || 7 })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Max Total Views (Optional)
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={formData.max_views}
                onChange={e => setFormData({ ...formData, max_views: parseInt(e.target.value) || 10 })}
                placeholder="Leave empty for unlimited"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </div>
        )}

        {/* Success Screen */}
        {createdInvite && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#10b981' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>check_circle</span>
            </div>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#10b981' }}>
              Invite Link Created!
            </h3>
            
            <div style={{ 
              background: '#f0f9ff', 
              border: '1px solid #bae6fd', 
              borderRadius: '8px', 
              padding: '1.5rem', 
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600' }}>Shareable Link:</h4>
              <div style={{
                background: 'white',
                border: '1px solid #e1e5e9',
                borderRadius: '6px',
                padding: '0.75rem',
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '0.9rem',
                wordBreak: 'break-all',
                cursor: 'pointer',
                marginBottom: '0.5rem'
              }}
              onClick={() => {
                navigator.clipboard.writeText(createdInvite.share_url);
                alert('Link copied to clipboard!');
              }}
              title="Click to copy"
              >
                {createdInvite.share_url}
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '4px' }}>content_copy</span>
                Click to copy link
              </p>
            </div>

            {formData.is_gated && formData.gate_type === 'password' && (
              <div style={{ 
                background: '#fef3c7', 
                border: '1px solid #f59e0b', 
                borderRadius: '8px', 
                padding: '1.5rem', 
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#92400e' }}>
                  🔐 Password Protection:
                </h4>
                <div style={{
                  background: 'white',
                  border: '1px solid #e1e5e9',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  fontFamily: 'Monaco, Consolas, monospace',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#92400e',
                  cursor: 'pointer',
                  marginBottom: '0.5rem'
                }}
                onClick={() => {
                  navigator.clipboard.writeText(formData.gate_password);
                  alert('Password copied to clipboard!');
                }}
                title="Click to copy"
                >
                  {formData.gate_password}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '12px', marginRight: '4px' }}>content_copy</span>
                  Click to copy password
                </p>
              </div>
            )}

            <div style={{ 
              background: '#f3f4f6', 
              border: '1px solid #d1d5db', 
              borderRadius: '8px', 
              padding: '1rem', 
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: '600' }}>Link Settings:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Expiry</div>
                  <div style={{ fontWeight: '500' }}>
                    {formData.expiry_type === 'none' ? 'Never expires' :
                     formData.expiry_type === 'fixed' ? `${formData.fixed_days} days` :
                     formData.expiry_type === 'usage' ? `After ${formData.max_uses} views` :
                     `${formData.inactivity_days} days inactivity`}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Max Views</div>
                  <div style={{ fontWeight: '500' }}>
                    {formData.max_views || 'Unlimited'}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>Protection</div>
                  <div style={{ fontWeight: '500' }}>
                    {formData.is_gated ? 
                      (formData.gate_type === 'password' ? 'Password Protected' : 'Email Required') : 
                      'Public Access'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(createdInvite.share_url);
                  alert('Link copied to clipboard!');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                Copy Link
              </button>
              <button
                onClick={handleClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: '#3b82f6',
                  border: '1px solid #3b82f6',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteWizard;
