# Security Implementation Guide

This document outlines the security measures implemented in the Zhort URL Shortener application, following OWASP Top 10 best practices.

## OWASP Top 10 Compliance

### A01:2021 - Broken Access Control ✅

- **Session Management**: JWT-based sessions with 24-hour expiration
- **Authorization Checks**: Server-side session validation on all protected routes
- **Rate Limiting**: Edge and DB-based rate limiting prevents abuse
- **CORS Policy**: Strict Cross-Origin Resource Policy headers

### A02:2021 - Cryptographic Failures ✅

- **Password Hashing**: bcrypt with cost factor 12
- **Secure Tokens**: `crypto.randomBytes()` for token generation
- **API Key Hashing**: SHA-256 hashing for API keys
- **HTTPS Enforcement**: Strict-Transport-Security header with preload

### A03:2021 - Injection ✅

- **SQL Injection Prevention**: Drizzle ORM with parameterized queries
- **Input Validation**: Zod schemas for all user inputs
- **Command Injection Prevention**: Pattern detection in security middleware
- **XSS Prevention**: HTML entity escaping and Content-Security-Policy

### A04:2021 - Insecure Design ✅

- **Security Headers**: Comprehensive headers in middleware and next.config.ts
- **Honeypot Fields**: Anti-bot protection on forms
- **URL Validation**: SSRF prevention (blocks localhost, private IPs)
- **Blocklist Integration**: Google Safe Browsing + Hagezi DNS blocklist

### A05:2021 - Security Misconfiguration ✅

- **Disabled X-Powered-By**: Hides Next.js server fingerprint
- **Strict CSP**: Content Security Policy prevents XSS
- **Permissions Policy**: Disables unnecessary browser features
- **Production Mode**: Source maps disabled in production

### A06:2021 - Vulnerable Components ✅

- **Dependency Management**: Regular updates with `ncu -u`
- **Minimal Dependencies**: Only essential packages installed
- **Latest Versions**: All dependencies use latest stable versions

### A07:2021 - Identification and Authentication Failures ✅

- **Password Strength**: Enforced complexity requirements
- **Rate Limiting**: Auth endpoints have stricter limits
- **Timing-Safe Comparison**: Prevents timing attacks on password validation
- **Session Security**: HttpOnly, Secure, SameSite cookies

### A08:2021 - Software and Data Integrity Failures ✅

- **CSRF Protection**: NextAuth built-in CSRF tokens
- **Subresource Integrity**: External scripts verified
- **Secure Headers**: Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy

### A09:2021 - Security Logging and Monitoring ✅

- **Security Event Logging**: All auth events logged
- **Audit Trail**: Link actions logged with user context
- **Rate Limit Logging**: Blocked requests logged for analysis

### A10:2021 - Server-Side Request Forgery (SSRF) ✅

- **URL Validation**: Blocks localhost, 127.0.0.1, private IP ranges
- **Protocol Restriction**: Only HTTP/HTTPS allowed
- **Domain Blocklist**: Prevents abuse of malicious domains

## Security Headers

All responses include the following security headers:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Content-Security-Policy: [see middleware.ts for full policy]
```

## Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| General API | 100 requests | 1 minute |
| Authentication | 10 requests | 1 minute |
| Link Creation (Anonymous) | 10 requests | 1 hour |
| Link Creation (Authenticated) | 50 requests | 1 hour |
| Password-Protected Links | 5 attempts | 15 minutes |

## Input Validation

All user inputs are validated using Zod schemas:

- **Email**: RFC-compliant format, max 254 chars
- **Password**: Min 8 chars, uppercase, lowercase, number, special char
- **URLs**: Valid protocol (http/https), no SSRF vectors
- **Short Codes**: Alphanumeric + hyphens/underscores, 3-50 chars

## Bot Protection

- **Honeypot Fields**: Hidden form fields to detect bots
- **User-Agent Analysis**: Known bad bots are blocked
- **Request Pattern Analysis**: Suspicious patterns blocked at edge

## Secure Cookies

```typescript
{
  httpOnly: true,
  sameSite: 'lax',
  secure: true, // in production
  path: '/'
}
```

## Environment Variables

Sensitive configuration is stored in environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT signing secret (min 32 chars)
- `NEXTAUTH_URL` - Application URL
- `GOOGLE_SAFE_BROWSING_KEY` - Optional, for phishing detection

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. Do NOT create a public GitHub issue
2. Email security details to the maintainers
3. Allow reasonable time for a fix before disclosure

## Security Checklist for Deployment

- [ ] Set strong `NEXTAUTH_SECRET` (32+ random characters)
- [ ] Enable HTTPS in production
- [ ] Configure proper `NEXTAUTH_URL`
- [ ] Review and test rate limits
- [ ] Set up security monitoring/alerting
- [ ] Enable database connection encryption (SSL)
- [ ] Regular dependency updates
- [ ] Review access logs periodically
