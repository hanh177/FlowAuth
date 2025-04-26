# FlowAuth

FlowAuth is an authentication system that uses **JWT (JSON Web Token)** and **refresh tokens**. This project is designed to securely and efficiently manage user login sessions.

## Core Principles
### 1. Why do we need a Refresh Token?
- **Short-lived Access Token**:
    Access tokens are designed to have a short expiration time (e.g., 15 minutes) to minimize the risk of misuse if they are stolen.

- **Long-lived Sessions**:
    Users expect to stay logged in for days or weeks without re-entering credentials.
    Therefore, refresh tokens act as a "long-term key" that can request new access tokens without asking the user to log in again.

  ➔ **Refresh tokens balance security and usability**.

### 2. Why must we support Token Revocation?
- **Risk of Stolen Tokens**:
    If a refresh token is leaked (e.g., through XSS attack, leaked device, etc.), the attacker can continue generating new access tokens indefinitely.

- **Revocation Mechanism**:
    By tracking issued refresh tokens in the database (with status flags like isRevoked), the system can immediately invalidate any stolen token.

- **User Control**:
    Users can manually logout to revoke a token, or the server can auto-revoke if suspicious behavior is detected.

  ➔ **Revocation is critical to terminate compromised sessions early**.

### 3. Why do we need a JTI (JWT ID)?
- **Uniquely Identify Tokens**:
    Each issued refresh token carries a unique jti field (JWT ID) — like a serial number.

- **Track and Manage Tokens Individually**:
  + **JTI allows**:
      + Storing issued tokens separately.
      + Selectively revoking a specific token.
      + Avoiding replay attacks (token reuse after logout).

- **Redis Integration**:
    Revoked JTIs can be stored in Redis for fast, scalable lookup without querying the database on every request.

  ➔ **JTI ensures that each token can be controlled independently and securely**.

## Key Features

### 1. User Registration (`/auth/register`)
- New users can register by providing a `username`, `email`, and `password`.
- Passwords are hashed before being stored in the database.
- After registration, the system returns an `accessToken` and a `refreshToken`.

### 2. User Login (`/auth/login`)
- Users log in using their `email` and `password`.
- If the credentials are valid, the system returns an `accessToken` and a `refreshToken`.

### 3. Refresh Token (`/auth/refresh`)
- When the `accessToken` expires, users can use the `refreshToken` to obtain a new pair of tokens.
- Refresh tokens are stored in the database and can be revoked if necessary.

### 4. Logout (`/auth/logout`)
- When users log out, the corresponding refresh token is revoked.

### 5. Authentication Middleware
- All requests are validated using the `accessToken` in the request header to identify the user.

### 6. Refresh Token Management
- Refresh tokens are stored in MongoDB with details such as `expiresAt`, `isRevoked`, and `jti` (JWT ID).
- The system checks the status of the refresh token before issuing new tokens.

## Technologies Used
- **Express.js**: Backend framework.
- **Mongoose**: ORM for working with MongoDB.
- **JWT**: For token creation and validation.
- **bcrypt**: For password hashing.
- **dotenv**: For environment variable management.

## Objectives
This system provides a secure way to manage login sessions, ensuring that:
- Expired tokens cannot be used.
- Refresh tokens can be revoked if suspicious activity is detected.
- User data is protected through password hashing and token-based authentication.