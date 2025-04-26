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

### 4. Why do we use Redis for Revoked Tokens?
   - **Performance**: Instead of querying the database on every request to check if a token has been revoked, we store revoked JTIs in Redis.

  -  **Scalability**: Redis operates in memory, offering extremely fast lookup times even at large scales.

  - **Automatic Expiration**: When a token is revoked, its jti is stored in Redis with an expiration time equal to the remaining lifetime of the refresh token. After expiration, Redis automatically deletes the key — no manual cleanup is needed.
  - **Support for Distributed Systems (Microservices)**: In a microservice architecture, different services might need to validate tokens independently. By storing revoked JTIs in a shared Redis instance, all services can instantly access the latest revocation data without needing centralized coordination or complex sync mechanisms.

  ➔ **Redis ensures fast, scalable, and efficient revocation checking.**

  
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
- The token's `jti` is added to Redis to prevent further use.

### 5. Authentication Middleware
- All protected requests are validated using the `accessToken` in the Authorization header.
- Middleware ensures that the access token is valid and not expired.
- Still return Unauthorized if the access token is valid, not expired but its refresh token has been invoked by checking in redis.


### 6. Refresh Token Management
- Refresh tokens are stored in MongoDB with details such as `expiresAt`, `isRevoked`, and `jti` (JWT ID).
- Revoked JTIs are cached in Redis with automatic expiration.
- On each refresh attempt, the system checks:
    + Token validity.
    + Token expiration.
    + Whether the JTI is listed as revoked.

## Technologies Used
- **Express.js**: Backend framework.
- **Mongoose**: ORM for working with MongoDB.
- **JWT**: For token creation and validation.
- **bcrypt**: For password hashing.
- **dotenv**: For environment variable management.
- **Redis**: For fast, scalable token revocation checking.

## Objectives
This system provides a secure way to manage login sessions, ensuring that:
- Expired or revoked tokens cannot be used.
- Users can stay logged in securely over long periods.
- Token misuse can be detected and invalidated quickly.
- User data is protected through password hashing and token-based authentication.