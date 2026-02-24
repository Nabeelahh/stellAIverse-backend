# Traditional Email/Password Authentication

This document describes the traditional email/password authentication system implemented with secure password hashing and JWT tokens.

## Overview

The traditional authentication system provides standard email/password login alongside the existing wallet-based authentication. This implementation includes:

- **User Registration**: Create accounts with email, password, and optional username
- **Secure Password Hashing**: Uses bcrypt with salt rounds for password storage
- **JWT Authentication**: Issues JWT tokens for session management
- **Login/Logout**: Standard authentication flow with secure password verification

## Architecture

### Components

#### 1. **AuthService** (`src/auth/auth.service.ts`)
Handles user registration, login, and authentication status:

```typescript
// Register a new user
const { token, user } = await authService.register({
  email: 'user@example.com',
  password: 'securepassword',
  username: 'optional_username'
});

// Login existing user
const { token, user } = await authService.login({
  email: 'user@example.com',
  password: 'securepassword'
});

// Get authentication status
const status = await authService.getAuthStatus(user);
```

#### 2. **Password Security**
- **Hashing Algorithm**: bcrypt with 12 salt rounds
- **Minimum Requirements**: 8+ characters (configurable)
- **Storage**: Hashed passwords only, never plaintext

#### 3. **JWT Strategy** (`src/auth/jwt.strategy.ts`)
Updated to support both traditional and wallet authentication payloads:

```typescript
// Traditional auth payload
{
  sub: 'user_id',
  email: 'user@example.com',
  username: 'username',
  role: 'user'
}

// Wallet auth payload
{
  address: '0x...',
  email: 'user@example.com',
  role: 'user'
}
```

## API Endpoints

### Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "optional_username"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "username": "optional_username",
    "role": "user"
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** Same as registration

### Authentication Status
```http
GET /auth/status
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "isAuthenticated": true,
  "user": {
    "id": "user_uuid",
    "email": "user@example.com",
    "username": "optional_username",
    "role": "user"
  }
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Security Features

### Password Requirements
- Minimum 8 characters
- Enforced via DTO validation
- Configurable in the future

### Account Protection
- Unique email and username constraints
- Failed login attempt tracking (via throttling)
- JWT token expiration (24 hours default)

### Data Protection
- Passwords hashed with bcrypt (12 rounds)
- No plaintext password storage
- Secure random salts

## Database Schema

The User entity has been updated to support both authentication methods:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  username VARCHAR UNIQUE,
  wallet_address VARCHAR NOT NULL UNIQUE,
  email VARCHAR UNIQUE,
  password VARCHAR, -- NULL for wallet-only users
  email_verified BOOLEAN DEFAULT FALSE,
  role VARCHAR DEFAULT 'user',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Migration

A database migration has been created to add the new fields:

```typescript
// src/migrations/1708600000001-AddUsernameAndPasswordFields.ts
// Adds username and password columns with proper indexes
```

## Testing

Unit tests are provided in `src/auth/auth.service.spec.ts`:

```bash
npm test -- --testPathPattern=auth.service.spec.ts
```

Tests cover:
- User registration (success and conflict cases)
- User login (success and failure cases)
- Password hashing and verification
- Authentication status

## Integration with Existing System

The authentication system is designed to coexist with wallet authentication:

- **Dual Support**: Users can authenticate via email/password OR wallet
- **Shared JWT**: Same JWT strategy handles both auth types
- **Backward Compatibility**: Existing wallet users continue to work
- **Unified Guards**: Same `@UseGuards(JwtAuthGuard)` works for both

## Configuration

Environment variables:
- `JWT_SECRET`: Secret key for JWT signing (required)
- `JWT_MAX_AGE`: Maximum token age in seconds (default: 86400)

## Future Enhancements

Potential improvements:
- Email verification for new registrations
- Password reset functionality
- Account lockout after failed attempts
- Two-factor authentication
- Password strength requirements
- Rate limiting per user</content>
<parameter name="filePath">/Users/mac/Desktop/Programming/stellAIverse-backend/TRADITIONAL_AUTH.md