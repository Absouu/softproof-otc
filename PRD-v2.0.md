# SoftProof OTC v2.0 - Dual Role System PRD

## Overview
SoftProof OTC v2.0 introduces a dual-role system enabling both **Wallet Holders** (self-proving) and **Agents** (facilitating client proofs) to use the platform for secure OTC trading verification.

## Core Features

### 1. Dual Role System
- **Role Selection**: Users choose between "Wallet Holder" or "Agent" during signup
- **Role Storage**: Stored in Supabase `profiles` table with `role` field
- **Role-based UI**: Different dashboards and functionality based on user role
- **Role Switching**: Users can update their role in settings

### 2. Wallet Holder Features
- **Self-Verification**: Create wallet proofs as before
- **Agent Association**: Post-proof, associate wallet to an agent via email
- **Contact Management**: Manage contact details per wallet
- **Profile Sharing**: Share verified wallet profiles publicly

### 3. Agent Features
- **Client Proof Creation**: Generate 24h-expiring shareable links for client verification
- **Client Dashboard**: Manage client assignments and proof links
- **Instant Revocation**: Revoke client proof links immediately for security
- **QR Code Generation**: Share client proof links via QR codes

### 4. Client Proof System
- **Shareable Links**: JWT-based tokens with 24h expiration
- **Exact Amount Verification**: Clients must send exact amount (0.0001 BTC ~$6.50)
- **Auto-verification**: Links auto-verify when payment is sent
- **Security**: Links can be revoked instantly by agents

## Technical Implementation

### Database Schema
```sql
-- Enhanced profiles table
ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'wallet_holder';

-- Agent assignments
CREATE TABLE agent_assignments (
  id UUID PRIMARY KEY,
  wallet_holder_id UUID REFERENCES auth.users(id),
  agent_id UUID REFERENCES auth.users(id),
  proof_id UUID REFERENCES proofs(id),
  status TEXT DEFAULT 'pending'
);

-- Client proof links
CREATE TABLE client_proof_links (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES auth.users(id),
  receiving_address TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  chain TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active'
);
```

### API Endpoints
- `POST /api/softproof?action=get_role` - Get user role
- `POST /api/softproof?action=update_role` - Update user role
- `POST /api/softproof?action=associate_agent` - Associate wallet to agent
- `POST /api/softproof?action=create_client_proof` - Create client proof link
- `POST /api/softproof?action=agent_dashboard` - Get agent dashboard data
- `POST /api/softproof?action=verify_client_proof` - Verify client proof (public)
- `POST /api/softproof?action=complete_client_proof` - Complete client proof
- `POST /api/softproof?action=revoke_client_proof` - Revoke client proof link

### Frontend Components
- **Role Selection**: Dropdown in signup/login forms
- **Agent Dashboard**: Role-based dashboard with client management
- **Client Proof Page**: Public page for client verification
- **Agent Create Proof**: Page for agents to create client proof links

## User Flows

### Wallet Holder Flow
1. **Signup/Login**: Select "Wallet Holder" role
2. **Create Proof**: Verify wallet ownership as before
3. **Associate Agent**: Optionally associate wallet to an agent
4. **Manage Profile**: Add contact details and notes
5. **Share Profile**: Publish wallet profile for public access

### Agent Flow
1. **Signup/Login**: Select "Agent" role
2. **Create Client Proof**: Generate shareable link with receiving address
3. **Share Link**: Send link/QR code to client
4. **Monitor Progress**: Track client proof status
5. **Manage Clients**: View client assignments and details

### Client Proof Flow
1. **Receive Link**: Client gets shareable link from agent
2. **View Instructions**: See exact amount and receiving address
3. **Send Payment**: Send exact amount to specified address
4. **Auto-verification**: System automatically verifies payment
5. **Completion**: Agent receives notification of successful verification

## Security Features

### Instant Revocation
- Agents can revoke client proof links immediately
- Revoked links become invalid instantly
- Prevents unauthorized access to expired links

### JWT Security
- Client proof links use JWT tokens with expiration
- Tokens are cryptographically secure
- No sensitive data exposed in URLs

### Role-based Access Control
- Supabase RLS policies enforce role-based access
- Agents can only access their own client data
- Wallet holders can only associate their own wallets

## UI/UX Enhancements

### Role-based Navigation
- Different tabs for wallet holders vs agents
- Clear role indicators in dashboard
- Contextual actions based on user role

### Agent Dashboard
- **Client Assignments Tab**: View clients who associated wallets
- **Client Proofs Tab**: Manage active client proof links
- **Create Proof Button**: Quick access to client proof creation

### Client Proof Interface
- Clean, mobile-friendly verification page
- Clear instructions for payment
- Real-time status updates
- QR code for easy mobile sharing

## Deployment Requirements

### Database Migration
1. Run `supabase-schema-v2.sql` in Supabase SQL Editor
2. Verify all tables and policies are created
3. Test RLS policies with different user roles

### Environment Variables
- All existing environment variables remain the same
- No additional configuration required

### Netlify Deployment
- Deploy as before with existing configuration
- API routes will work with new endpoints
- No additional build steps required

## Success Metrics

### User Adoption
- Number of users by role (wallet holders vs agents)
- Client proof link creation rate
- Agent-wallet holder associations

### Security
- Zero unauthorized access incidents
- Successful instant revocation rate
- Client proof completion rate

### Performance
- API response times for new endpoints
- Client proof verification speed
- Dashboard load times

## Future Enhancements

### Phase 2 Features
- **Bulk Client Proofs**: Create multiple client proofs at once
- **Client Analytics**: Detailed reporting for agents
- **API Integration**: REST API for third-party integrations
- **Mobile App**: Native mobile applications

### Advanced Security
- **Multi-signature Support**: Enhanced security for large amounts
- **Time-locked Proofs**: Proofs that expire after specific time
- **Audit Logging**: Comprehensive activity tracking

## Conclusion

SoftProof OTC v2.0 transforms the platform into a comprehensive OTC trading verification system supporting both individual wallet holders and professional agents. The dual-role system enables scalable client onboarding while maintaining the security and simplicity of the original platform.

The implementation preserves all existing functionality while adding powerful new features for professional OTC trading scenarios. The system is designed to scale from individual traders to large OTC desks with hundreds of clients.
