# Wallet Management API Documentation

This document describes the wallet management endpoints for linking, unlinking, and recovering wallet access in the stellAIverse backend.

## Overview

The wallet management system allows users to:
- Link new wallets to their existing account
- Unlink wallets (with email verification requirement)
- Recover wallet access using verified email

All sensitive operations are protected with rate limiting and require proper authentication.

## Endpoints

### 1. Link Wallet

Link a new wallet address to an existing authenticated user account.

**Endpoint:** `POST /auth/link-wallet`

**Authentication:** Required (JWT Bearer token)

**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "walletAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  "message": "Sign this message to prove ownership: challenge-id-123",
  "signature": "0x1234...5678"
}
```

**Request Fields:**
- `walletAddress` (string, required): Ethereum address to link (must be valid Ethereum address)
- `message` (string, required): Challenge message that was signed
- `signature` (string, required): Signature proving ownership (132 characters including 0x prefix)

**Success Response (200):**
```json
{
  "message": "Wallet successfully linked",
  "walletAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input or current user not found
- `401 Unauthorized`: Invalid authentication or signature verification failed
- `409 Conflict`: Wallet address already linked to another account
- `429 Too Many Requests`: Rate limit exceeded

**Example Flow:**
```bash
# 1. Get authentication token
curl -X POST http://localhost:3000/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"address": "0x1234567890abcdef1234567890abcdef12345678"}'

# 2. Sign the challenge message with your current wallet
# (Use MetaMask or web3 library)

# 3. Verify and get JWT token
curl -X POST http://localhost:3000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Sign this message...",
    "signature": "0x..."
  }'

# 4. Request challenge for new wallet
curl -X POST http://localhost:3000/auth/challenge \
  -H "Content-Type: application/json" \
  -d '{"address": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"}'

# 5. Sign with new wallet and link
curl -X POST http://localhost:3000/auth/link-wallet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "walletAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    "message": "Sign this message...",
    "signature": "0x..."
  }'
```

---

### 2. Unlink Wallet

Unlink a wallet from the user account. Requires verified email for account recovery.

**Endpoint:** `POST /auth/unlink-wallet`

**Authentication:** Required (JWT Bearer token)

**Rate Limit:** 5 requests per minute

**Request Body:**
```json
{
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
}
```

**Request Fields:**
- `walletAddress` (string, required): Ethereum address to unlink (must match authenticated user's address)

**Success Response (200):**
```json
{
  "message": "Wallet unlink requested. Please use email recovery to regain access."
}
```

**Error Responses:**
- `400 Bad Request`: 
  - Addresses don't match
  - User not found
  - Email not verified (must verify email before unlinking for recovery purposes)
- `401 Unauthorized`: Invalid authentication
- `429 Too Many Requests`: Rate limit exceeded

**Example:**
```bash
curl -X POST http://localhost:3000/auth/unlink-wallet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678"
  }'
```

**Important Notes:**
- Email must be verified before unlinking wallet
- This ensures account recovery is possible
- Link an email first using `POST /auth/link-email` if not already linked

---

### 3. Recover Wallet

Recover wallet access using verified email address.

**Endpoint:** `POST /auth/recover-wallet`

**Authentication:** Not required (public endpoint)

**Rate Limit:** 3 requests per minute (strict limit for security)

**Request Body:**
```json
{
  "email": "user@example.com",
  "recoveryToken": "a1b2c3d4e5f6..."
}
```

**Request Fields:**
- `email` (string, required): Verified email address linked to account
- `recoveryToken` (string, required): Recovery token (64 characters)

**Success Response (201):**
```json
{
  "message": "Recovery initiated. Sign the challenge with your wallet.",
  "walletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "challenge": "Sign this message to prove ownership: challenge-id-456"
}
```

**Error Responses:**
- `400 Bad Request`: 
  - Invalid email format
  - Invalid recovery token length
  - No verified account found with email
- `429 Too Many Requests`: Rate limit exceeded

**Example Flow:**
```bash
# 1. Request recovery
curl -X POST http://localhost:3000/auth/recover-wallet \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "recoveryToken": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6abcd"
  }'

# 2. Sign the returned challenge with your wallet
# (Use MetaMask or web3 library)

# 3. Verify signature to regain access
curl -X POST http://localhost:3000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Sign this message...",
    "signature": "0x..."
  }'
```

---

## Security Features

### Rate Limiting

All wallet management endpoints are protected with rate limiting:

- **Link Wallet**: 5 requests per minute
- **Unlink Wallet**: 5 requests per minute  
- **Recover Wallet**: 3 requests per minute (strictest limit)

Rate limits are enforced per IP address to prevent abuse.

### Authentication

- Link and unlink operations require valid JWT authentication
- Recovery is public but strictly rate-limited
- All operations validate signatures cryptographically

### Validation

- Wallet addresses must be valid Ethereum addresses
- Signatures must be exactly 132 characters (including 0x prefix)
- Email addresses must be properly formatted
- Recovery tokens must be exactly 64 characters

### Email Verification Requirement

- Unlinking a wallet requires verified email
- This ensures users can recover their account
- Users must link and verify email before unlinking wallet

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common error codes:
- `400`: Validation error or bad request
- `401`: Authentication failed
- `409`: Resource conflict (e.g., wallet already linked)
- `429`: Rate limit exceeded

---

## Integration Examples

### JavaScript/TypeScript (with ethers.js)

```typescript
import { ethers } from 'ethers';

async function linkNewWallet(
  currentToken: string,
  newWalletAddress: string,
  provider: ethers.providers.Web3Provider
) {
  // 1. Request challenge for new wallet
  const challengeRes = await fetch('http://localhost:3000/auth/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: newWalletAddress })
  });
  const { message } = await challengeRes.json();

  // 2. Sign challenge with new wallet
  const signer = provider.getSigner(newWalletAddress);
  const signature = await signer.signMessage(message);

  // 3. Link wallet
  const linkRes = await fetch('http://localhost:3000/auth/link-wallet', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentToken}`
    },
    body: JSON.stringify({
      walletAddress: newWalletAddress,
      message,
      signature
    })
  });

  return await linkRes.json();
}

async function recoverWallet(
  email: string,
  recoveryToken: string,
  provider: ethers.providers.Web3Provider
) {
  // 1. Request recovery
  const recoveryRes = await fetch('http://localhost:3000/auth/recover-wallet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, recoveryToken })
  });
  const { challenge, walletAddress } = await recoveryRes.json();

  // 2. Sign challenge
  const signer = provider.getSigner(walletAddress);
  const signature = await signer.signMessage(challenge);

  // 3. Verify and get token
  const verifyRes = await fetch('http://localhost:3000/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: challenge,
      signature
    })
  });

  return await verifyRes.json();
}
```

### React Hook Example

```typescript
import { useWallet } from './hooks/useWallet';

function WalletManager() {
  const { linkWallet, unlinkWallet, recoverWallet } = useWallet();

  const handleLinkWallet = async (newAddress: string) => {
    try {
      const result = await linkWallet(newAddress);
      console.log('Wallet linked:', result);
    } catch (error) {
      console.error('Failed to link wallet:', error);
    }
  };

  const handleRecovery = async (email: string, token: string) => {
    try {
      const result = await recoverWallet(email, token);
      console.log('Recovery successful:', result);
    } catch (error) {
      console.error('Recovery failed:', error);
    }
  };

  return (
    <div>
      <button onClick={() => handleLinkWallet('0x...')}>
        Link New Wallet
      </button>
      <button onClick={() => handleRecovery('user@example.com', 'token')}>
        Recover Wallet
      </button>
    </div>
  );
}
```

---

## Testing

Run the test suite:

```bash
# Unit tests
npm run test src/auth/wallet-auth.service.spec.ts

# E2E tests
npm run test:e2e test/wallet-management.e2e-spec.ts

# All tests
npm run test
```

---

## Best Practices

1. **Always verify email before unlinking wallet** - This ensures account recovery
2. **Store recovery tokens securely** - Never expose them in client-side code
3. **Implement proper error handling** - Handle rate limits and validation errors gracefully
4. **Use HTTPS in production** - Never send signatures over unencrypted connections
5. **Validate addresses client-side** - Reduce unnecessary API calls
6. **Implement retry logic** - Handle rate limits with exponential backoff

---

## Related Documentation

- [Wallet Authentication](./WALLET_AUTH.md) - Basic wallet authentication flow
- [Email Linking](./test/email-linking.spec.ts) - Email linking and verification
- [Recovery Flow](./test/recovery.spec.ts) - Account recovery process
- [Security Guide](./SECURITY.md) - Security best practices
