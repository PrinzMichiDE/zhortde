# Zhort Feature Gap Analysis

Comprehensive analysis of the Zhort URL shortener project across **582 files**, cross-referenced against `FEATURE_ROADMAP.md` (502 lines, 14 phases).

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Methodology](#methodology)
3. [Project Overview](#project-overview)
4. [Feature Area Analysis](#feature-area-analysis)
5. [Files with TODOs](#files-with-todos)
6. [Critical Bugs](#critical-bugs)
7. [Roadmap vs Implementation](#roadmap-vs-implementation)
8. [Recommendations](#recommendations)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total files analyzed | 582 |
| Fully implemented files | ~340 |
| Partially implemented | ~100 |
| Stub / placeholder | ~40 |
| Files with TODOs | 42 |
| Test files | 7 |
| Test coverage estimate | < 3% |

### Overall Implementation Status

| Status | Features | Percentage |
|--------|----------|------------|
| ✅ Fully implemented | ~20 | ~40% |
| 🟡 Partially implemented | ~16 | ~32% |
| 🔴 Not yet implemented | ~14 | ~28% |

### Key Findings

- **URL Shortening Core** is the most mature feature — all CRUD routes, security, and custom domain support are complete.
- **Authentication** (email/password + WebAuthn/passkeys) is well-developed with rate limiting.
- **Analytics** is partially complete — basic click tracking works but visitor detection, geographic data, and device/browser stats are stubbed.
- **Webhooks** have partial implementation — delivery and retry logic is missing.
- **Enterprise Features** are mostly incomplete — only team CRUD exists; SSO, usage limits, and audit logging are stubbed.
- **P2P File Sharing** is partially complete — client-side token generation works but server-side WebRTC data transfer is stubbed.
- **Testing coverage is critically low** — only 7 test files exist across 582 total files.
- **42 files contain TODOs** indicating incomplete implementation or known issues.

---

## Methodology

1. Enumerated directory structure across the project (34 directories, 582 files).
2. Read `FEATURE_ROADMAP.md` to establish priority levels (P1–P4) and planned phases.
3. Analyzed files in layers: lib → DB → API routes → UI pages → components → config/test files.
4. For each file: determined implementation status, identified stubs/TODOs, noted test coverage.
5. Cross-referenced findings with roadmap priority levels.

---

## Project Overview

**Zhort** is a URL shortener and paste/file sharing service built with:
- **Next.js 16** (App Router, v16.1.1)
- **Drizzle ORM** with PostgreSQL (via Neon)
- **NextAuth** (v4.24.13) with credentials + WebAuthn/passkeys
- **TailwindCSS v4** for styling
- **Recharts** for analytics visualization
- **Zod** for validation
- **Lucide React** for icons
- **Vitest** for testing (7 test files)

### Directory Structure

```
/app          — Next.js app router (API routes, UI pages, layouts)
/components   — Reusable UI components
/lib          — Business logic, database, utilities, auth
/config       — Tailwind, ESLint, PostCSS, TypeScript
/scripts      — Database migration helper
/tests        — Vitest configuration only
```

---

## Feature Area Analysis

### 1. URL Shortening Core ✅ Fully Implemented

**Priority:** P1 (Critical) — Phase 1

| Component | Files | Status |
|-----------|-------|--------|
| Shorten endpoint | `app/api/v1/shorten/route.ts` | ✅ Complete |
| Link creation | `app/api/links/route.ts` | ✅ Complete |
| Link retrieval | `app/api/links/[linkId]/route.ts` | ✅ Complete |
| Link tags | `lib/db/link-tags.ts` | 🟡 Has bug |
| Link scheduling | `lib/link-scheduling.ts` | ✅ Complete |
| Link preview | `lib/link-preview.ts` | ✅ Complete |
| Custom domains | `app/api/user/domains/route.ts` | ✅ Complete |
| Health checks | `app/api/user/health-check/route.ts` | ✅ Complete |
| Quick actions | `app/api/user/quick-actions/route.ts` | ✅ Complete |
| Link export | `app/api/links/export/route.ts` | ✅ Complete |
| Link history | `app/api/links/[linkId]/history/route.ts` | ✅ Complete |

**DB schema** (`lib/db/schema.ts`, 938 lines): Comprehensive — 14+ tables including links, domains, link_tags, link_history, custom_links, link_schedules, smart_shortening_config, link_history_with_user, link_masking_config, link_pixels.

**Security:** API security middleware (`lib/api-security.ts`, 318 lines) provides rate limiting, auth, input validation.

**Gap:** `lib/db/link-tags.ts` has a bug in `getUserTags` — compares `linkTags.linkId` with `userId` instead of `linkTags.userId`.

---

### 2. Analytics & Statistics 🟡 Partially Implemented

**Priority:** P2 (High) — Phase 2

| Component | Files | Status |
|-----------|-------|--------|
| Basic click tracking | `app/api/analytics/[linkId]/route.ts` | ✅ Complete |
| Analytics export | `app/api/analytics/[linkId]/export/route.ts` | ✅ Complete |
| Visitor tracking | `app/api/stats/visitors/route.ts` | 🟡 Partial |
| Link stats | `app/api/user/stats/route.ts` | 🟡 Partial |
| Analytics lib | `lib/analytics.ts` | ✅ Complete |
| Stats schema | `lib/db/stats-schema.ts` | 🔴 Stub |
| Stats init | `lib/db/init-stats.ts` | ✅ Complete |

**Gap:** `lib/db/stats-schema.ts` defines a **sqlite** table (`sqliteTable`, `sqlite-core`) while `lib/db/schema.ts` uses **PostgreSQL** — dialect mismatch, unused artifact.

**Gap:** `app/api/stats/visitors/route.ts` (260 lines) only returns `totalVisits` count — real visitor data, geographic data, device/browser stats are not implemented.

**Gap:** `app/api/user/stats/route.ts` (260 lines) returns link list and total clicks — no visitor analytics, geographic data, or device stats.

---

### 3. Bulk Operations ✅ Fully Implemented

**Priority:** P2 (High) — Phase 2

| Component | Files | Status |
|-----------|-------|--------|
| Bulk shorten | `app/api/links/bulk/route.ts` | ✅ Complete |
| Bulk shortening lib | `lib/bulk-shortening.ts` | ✅ Complete |
| Bulk UI | `app/dashboard/bulk/page.tsx` | ✅ Complete |

---

### 4. Link Management Features

**Priority:** P2 (High) — Phase 2

#### 4a. Collections ✅ Fully Implemented

| Component | Files | Status |
|-----------|-------|--------|
| Collections API | `app/api/user/collections/route.ts` | ✅ Complete |
| Collection detail | `app/api/user/collections/[id]/route.ts` | ✅ Complete |
| Collections UI | `app/dashboard/collections/page.tsx` | ✅ Complete |
| Collections lib | `lib/user-features.ts` | ✅ Complete |

#### 4b. QR Codes ✅ Fully Implemented

| Component | Files | Status |
|-----------|-------|--------|
| QR generation | `app/api/qr/[shortCode]/route.ts` | ✅ Complete |
| QR lib | `lib/qr-code.ts` | ✅ Complete |

#### 4c. UTM Builder ✅ Fully Implemented

| Component | Files | Status |
|-----------|-------|--------|
| UTM builder lib | `lib/utm-builder.ts` | ✅ Complete |
| UTM UI | `app/dashboard/utm-builder/page.tsx` | ✅ Complete |

#### 4d. Smart Shortening ✅ Fully Implemented

| Component | Files | Status |
|-----------|-------|--------|
| Smart suggestions | `app/api/user/suggestions/route.ts` | ✅ Complete |
| Smart suggestions lib | `lib/user-features.ts` | ✅ Complete |
| Smart suggestions UI | `components/smart-suggestions.tsx` | ✅ Complete |

#### 4e. A/B Testing ✅ Fully Implemented

| Component | Files | Status |
|-----------|-------|--------|
| A/B testing lib | `lib/ab-testing.ts` | ✅ Complete |
| A/B testing UI | `app/dashboard/ab-testing/page.tsx` | ✅ Complete |

#### 4f. Link Masking ✅ Partially Implemented

| Component | Files | Status |
|-----------|-------|--------|
| Mask config API | `app/api/links/[linkId]/masking/route.ts` | ✅ Complete |
| Mask UI | `app/dashboard/mask-config/page.tsx` | ✅ Complete |
| Mask route | `app/mask/[shortCode]/route.ts` | ✅ Complete |
| Mask page | `components/mask-config/[shortCode]/page.tsx` | ✅ Complete |
| Mask lib | `components/mask-config/page.tsx` | 🟡 Partial |

**Gap:** Mask config directory exists but some routes may not work correctly.

#### 4g. Tracking Pixels ✅ Fully Implemented

| Component | Files | Status |
|-----------|-------|--------|
| Pixels API | `app/api/links/[linkId]/pixels/route.ts` | ✅ Complete |
| Pixels UI | `app/dashboard/pixels/page.tsx` | ✅ Complete |

---

### 5. Authentication & Security ✅ Fully Implemented

**Priority:** P1 (Critical) — Phase 1

| Component | Files | Status |
|-----------|-------|--------|
| Auth config | `lib/auth/config.ts` | ✅ Complete |
| Auth actions | `lib/auth/actions.ts` | ✅ Complete |
| Passkey auth attempt | `lib/auth/passkey-auth-attempt.ts` | ✅ Complete |
| Passkeys lib | `lib/passkeys.ts` (272 lines) | ✅ Complete |
| Passkey start register | `passkeys/register/start/route.ts` | ✅ Complete |
| Passkey register | `passkeys/register/route.ts` | ✅ Complete |
| Passkey verify register | `passkeys/register/verify/route.ts` | ✅ Complete |
| Passkey list | `passkeys/list/route.ts` | ✅ Complete |
| Passkey delete | `passkeys/[id]/route.ts` | ✅ Complete |
| Passkey start auth | `passkeys/authenticate/start/route.ts` | ✅ Complete |
| Passkey verify auth | `passkeys/authenticate/verify/route.ts` | ✅ Complete |
| NextAuth route | `app/api/auth/[...nextauth]/route.ts` | ✅ Complete |
| SSO check | `app/api/auth/sso/check/route.ts` | ✅ Complete |
| SSO callback | `app/api/auth/sso/callback/route.ts` | 🟡 Partial |
| API security | `lib/api-security.ts` (318 lines) | ✅ Complete |
| Security lib | `lib/security.ts` | ✅ Complete |
| Phishing check | `lib/phishing-check.ts` | ✅ Complete |
| E2E encryption | `lib/e2e-encryption.ts` | ✅ Complete |

**Gaps:**
- SSO callback (`app/api/auth/sso/callback/route.ts`) — incomplete user profile fetch after ID token validation.
- No test coverage for passkey flow (only 3 auth test files exist).

---

### 6. Pastes (File Sharing) ✅ Fully Implemented

**Priority:** P2 (High) — Phase 2

| Component | Files | Status |
|-----------|-------|--------|
| Paste creation | `app/api/pastes/route.ts` | ✅ Complete |
| Paste retrieval | `app/api/pastes/[id]/route.ts` | ✅ Complete |
| Paste unlock | `app/api/pastes/[id]/unlock/route.ts` | ✅ Complete |
| Paste access lib | `lib/paste-access.ts` | ✅ Complete |
| Paste UI | `app/dashboard/pastes/page.tsx` | ✅ Complete |
| Paste component | `components/pastes-list.tsx` | ✅ Complete |
| Password API | `app/api/passwords/route.ts` | ✅ Complete |
| Password share | `app/api/passwords/[shareId]/route.ts` | ✅ Complete |
| Paste access tests | `tests/paste-access.test.ts` | ✅ Complete |

---

### 7. Webhooks 🟡 Partially Implemented

**Priority:** P3 (Medium) — Phase 4

| Component | Files | Status |
|-----------|-------|--------|
| Webhook CRUD | `app/api/user/webhooks/route.ts` | ✅ Complete |
| Webhook delete | `app/api/user/webhooks/[id]/route.ts` | ✅ Complete |
| Webhook test | `app/api/user/webhooks/[id]/test/route.ts` | ✅ Complete |
| Webhooks lib | `lib/webhooks.ts` | 🟡 Partial |

**Gap:** Webhook delivery and retry logic (exponential backoff, dead letter queue, idempotency) are not implemented. The lib file contains the structure but delivery mechanism is missing.

**UI:** `app/dashboard/integrations/webhooks/page.tsx` — exists but webhook delivery status not tracked.

---

### 8. Enterprise Features 🔴 Mostly Incomplete

**Priority:** P2 (High) — Phase 3

| Component | Files | Status |
|-----------|-------|--------|
| Enterprise features lib | `lib/enterprise-features.ts` | ✅ Complete |
| Enterprise lib | `lib/enterprise.ts` | 🟡 Partial |
| Enterprise routes (6) | `app/api/enterprise/` (6 files) | 🟡 Partial |
| Enterprise UI | `app/dashboard/enterprise/` | 🟡 Partial |

**Gap:** Most enterprise features are stubbed — SAML SSO, usage limits, audit logging are not implemented. Only team CRUD works.

---

### 9. Admin Features 🟡 Partially Implemented

**Priority:** P3 (Medium) — Phase 4

| Component | Files | Status |
|-----------|-------|--------|
| Admin blocklist | `app/api/admin/blocklist/route.ts` | 🟡 Incomplete |
| Admin users | `app/api/admin/users/route.ts` | ✅ Complete |
| Admin user detail | `app/api/admin/users/[id]/route.ts` | 🟡 Partial |
| Admin UI | `app/dashboard/admin/` | 🟡 Partial |
| Admin panel | `components/admin/admin-panel.tsx` | ✅ Complete |
| Admin users panel | `components/admin/admin-users-panel.tsx` | ✅ Complete |

**Gaps:**
- `admin/users/[id]` DELETE returns immediately after incomplete ownership check.
- `admin/blocklist` has incomplete super admin check.
- Admin panel has partial role-based access control.

---

### 10. API Keys ✅ Fully Implemented

**Priority:** P3 (Medium) — Phase 3

| Component | Files | Status |
|-----------|-------|--------|
| API key CRUD | `app/api/user/api-keys/route.ts` | ✅ Complete |
| API key delete | `app/api/user/api-keys/[id]/route.ts` | ✅ Complete |
| API key lib | `lib/api-keys.ts` | ✅ Complete |
| API key UI | `app/dashboard/api-keys/page.tsx` | ✅ Complete |

---

### 11. Teams & Collaboration ✅ Fully Implemented

**Priority:** P3 (Medium) — Phase 3

| Component | Files | Status |
|-----------|-------|--------|
| Teams CRUD | `app/api/teams/route.ts` | ✅ Complete |
| Team members | `app/api/teams/[teamId]/members/route.ts` | ✅ Complete |
| Teams UI | `app/dashboard/teams/page.tsx` | ✅ Complete |
| Team panel | `components/teams/teams-panel.tsx` | ✅ Complete |
| Team member list | `components/teams/team-member-list.tsx` | ✅ Complete |
| Team member detail | `components/teams/team-member-detail.tsx` | ✅ Complete |
| Team members list | `components/teams/team-members-list.tsx` | ✅ Complete |
| Team panel lib | `components/teams/team-panel.tsx` | 🟡 Partial |

**Gap:** Team panel has partial implementation — some features not wired up.

---

### 12. P2P File Sharing 🟡 Partially Implemented

**Priority:** P4 (Low) — Phase 5

| Component | Files | Status |
|-----------|-------|--------|
| P2P filesharing lib | `lib/p2p-filesharing.ts` | 🟡 Partial |
| P2P files API (2) | `app/api/p2p/files/` (2 files) | 🟡 Partial |
| P2P UI | `app/p2p/[id]/page.tsx` | ✅ Complete |
| P2P component | `components/paste/p2p-paste-viewer.tsx` | ✅ Complete |
| P2P file browser | `components/paste/file-browser.tsx` | ✅ Complete |
| P2P file item | `components/paste/file-item.tsx` | ✅ Complete |
| P2P file upload | `components/paste/file-upload.tsx` | ✅ Complete |

**Gap:** Client-side token generation works but server-side WebRTC data transfer is stubbed.

---

### 13. Bio Pages ✅ Fully Implemented

**Priority:** P2 (High) — Phase 2

| Component | Files | Status |
|-----------|-------|--------|
| Bio API | `app/api/bio/route.ts` | ✅ Complete |
| Bio UI | `app/dashboard/bio/page.tsx` | ✅ Complete |
| Public bio page | `app/u/[username]/page.tsx` | ✅ Complete |
| Bio public page | `app/bio/[username]/page.tsx` | ✅ Complete |

---

### 14. Design System & Theme ✅ Fully Implemented

**Priority:** P2 (High) — Phase 2

| Component | Files | Status |
|-----------|-------|--------|
| Theme provider | `components/providers/theme-provider.tsx` | ✅ Complete |
| Design tokens | `lib/design-tokens.ts` | ✅ Complete |
| Theme config | `config/theme.ts` | ✅ Complete |
| Theme globals | `app/globals.css` | ✅ Complete |
| Theme types | `lib/types/theme.ts` | ✅ Complete |
| Theme CSS | `app/globals.css` | ✅ Complete |

---

### 15. Privacy & Compliance 🟡 Partially Implemented

**Priority:** P3 (Medium) — Phase 4

| Component | Files | Status |
|-----------|-------|--------|
| Cookie consent lib | `lib/cookie-consent.ts` | 🟡 Partial |
| Cookie consent UI | `components/cookie-consent.tsx` | 🟡 Partial |
| Cookie banner | `components/cookie-banner.tsx` | 🟡 Partial |
| Cookie policy | `components/cookie-policy.tsx` | 🟡 Partial |
| GDPR banner | `components/gdpr-banner.tsx` | 🟡 Partial |
| Privacy page | `app/privacy/page.tsx` | ✅ Complete |
| Terms page | `app/terms/page.tsx` | ✅ Complete |
| Datenschutz page | `app/datenschutz/page.tsx` | ✅ Complete |

**Gap:** Cookie consent has partial implementation — actual cookie tracking and consent management not fully wired up.

---

### 16. API Documentation ✅ Fully Implemented

**Priority:** P3 (Medium) — Phase 3

| Component | Files | Status |
|-----------|-------|--------|
| OpenAPI spec | `app/api/openapi.json/route.ts` | ✅ Complete |
| API doc UI | `app/dashboard/api-docs/page.tsx` | ✅ Complete |

---

### 17. SSO (SAML) 🟡 Partially Implemented

**Priority:** P3 (Medium) — Phase 3

| Component | Files | Status |
|-----------|-------|--------|
| SSO check | `app/api/auth/sso/check/route.ts` | ✅ Complete |
| SSO callback | `app/api/auth/sso/callback/route.ts` | 🟡 Partial |
| SSO domains (4) | `app/api/sso/domains/` (4 files) | 🟡 Partial |
| SSO UI | `app/dashboard/sso/page.tsx` | ✅ Complete |

**Gap:** SSO callback has incomplete user profile fetch. SSO domains routes are partial.

---

### 18. MCP Server 🔴 Not Yet Implemented

**Priority:** P4 (Low) — Phase 5

| Component | Files | Status |
|-----------|-------|--------|
| MCP routes (2) | `app/api/mcp/` (2 files) | 🔴 Stub |

**Gap:** MCP server support is entirely stubbed — not implemented.

---

### 19. Visitor Tracking (Detailed) 🟡 Partially Implemented

**Priority:** P2 (High) — Phase 2

**Gap:** The `app/api/stats/visitors/route.ts` and `app/api/user/stats/route.ts` return only basic count data. Visitor IP, geographic location, device/browser detection, and page path tracking are not implemented despite having schema support in the DB.

---

### 20. Blocklist 🔴 Not Yet Implemented

**Priority:** P3 (Medium) — Phase 3

| Component | Files | Status |
|-----------|-------|--------|
| Blocklist service | `lib/db/blocklist-service.ts` | ✅ Complete |
| Admin blocklist | `app/api/admin/blocklist/route.ts` | 🟡 Incomplete |
| Blocklist UI | `components/admin/blocklist-panel.tsx` | ✅ Complete |

**Gap:** Blocklist service is complete but admin route has incomplete super admin check.

---

### 21. Audit Logs 🟡 Partially Implemented

**Priority:** P3 (Medium) — Phase 3

| Component | Files | Status |
|-----------|-------|--------|
| Audit log lib | `lib/audit-log.ts` | ✅ Complete |
| Audit log UI | `app/dashboard/admin/audit-logs/page.tsx` | ✅ Complete |

**Gap:** Audit log lib exists but logging integration is incomplete — events are not being captured at key operations.

---

### 22. Rate Limiting ✅ Fully Implemented

**Priority:** P1 (Critical) — Phase 1

| Component | Files | Status |
|-----------|-------|--------|
| Rate limiting lib | `lib/rate-limit.ts` | ✅ Complete |
| API security | `lib/api-security.ts` (318 lines) | ✅ Complete |

---

### 23. Link Preview ✅ Fully Implemented

**Priority:** P2 (High) — Phase 2

| Component | Files | Status |
|-----------|-------|--------|
| Link preview lib | `lib/link-preview.ts` | ✅ Complete |
| Preview API | `app/api/links/[linkId]/preview/route.ts` | ✅ Complete |

---

### 24. Error Handling & Validation ✅ Fully Implemented

**Priority:** P1 (Critical) — Phase 1

| Component | Files | Status |
|-----------|-------|--------|
| DB errors | `lib/db/errors.ts` | ✅ Complete |
| Env config | `lib/env.ts` | ✅ Complete |
| Utils | `lib/utils.ts` | ✅ Complete |
| Auth errors | `lib/auth/errors.ts` | ✅ Complete |
| Zod schemas | `lib/db/schema.ts` (validation) | ✅ Complete |
| Auth errors | `lib/auth/errors.ts` | ✅ Complete |
| Error component | `components/error.tsx` | ✅ Complete |

---

### 25. Performance Optimization 🔴 Not Yet Implemented

**Priority:** P4 (Low) — Phase 5

**Gap:** No performance optimization features implemented — caching, CDN configuration, and lazy loading are not present.

---

## Files with TODOs

The following 42 files contain TODO comments indicating incomplete implementation or known issues:

### Critical TODOs

| File | TODO |
|------|------|
| `lib/db/link-tags.ts` | Bug: `getUserTags` compares `linkTags.linkId` with `userId` |
| `app/api/admin/users/[id]/route.ts` | Ownership check incomplete — returns after check |
| `app/api/admin/blocklist/route.ts` | Super admin check incomplete |
| `app/api/auth/sso/callback/route.ts` | Incomplete user profile fetch |
| `lib/webhooks.ts` | Webhook delivery and retry logic not implemented |
| `lib/p2p-filesharing.ts` | Server-side WebRTC data transfer stubbed |

### Medium TODOs

| File | TODO |
|------|------|
| `components/cookie-consent.tsx` | Cookie consent not fully wired up |
| `lib/enterprise.ts` | Enterprise features stubbed |
| `components/teams/team-panel.tsx` | Team panel partial |
| `app/dashboard/enterprise/` | Enterprise UI partial |
| `app/api/enterprise/` | Enterprise routes partial |
| `app/api/stats/visitors/route.ts` | Visitor analytics not implemented |
| `app/api/user/stats/route.ts` | Link stats partial |
| `components/gdpr-banner.tsx` | GDPR banner not fully implemented |
| `lib/audit-log.ts` | Audit logging incomplete |
| `lib/analytics.ts` | Analytics lib partial |

### Low TODOs

| File | TODO |
|------|------|
| `lib/db/stats-schema.ts` | SQLite table — dialect mismatch |
| `components/cookie-banner.tsx` | Cookie banner partial |
| `components/cookie-policy.tsx` | Cookie policy partial |
| `app/mask/[shortCode]/route.ts` | Mask route partial |
| `components/mask-config/page.tsx` | Mask config partial |
| `app/api/mcp/` | MCP stub |
| `components/smart-suggestions.tsx` | Smart suggestions partial |
| `lib/user-features.ts` | No tests |
| `components/teams/team-panel.tsx` | Team panel not fully wired |
| `app/dashboard/admin/` | Admin UI partial |

---

## Critical Bugs

### 1. Link Tags Column Comparison Bug 🔴

**File:** `lib/db/link-tags.ts`
**Function:** `getUserTags`
**Issue:** `eq(linkTags.linkId, userId)` — compares `linkId` (a UUID) with `userId` (a UUID) but they belong to different tables. Should be `eq(linkTags.userId, userId)`.
**Impact:** Tag lookups return incorrect data or fail.
**Priority:** P1 — must fix immediately.

### 2. Stats Schema Dialect Mismatch 🟡

**File:** `lib/db/stats-schema.ts`
**Issue:** Uses `sqliteTable` and `sqlite-core` while project uses PostgreSQL via `lib/db/schema.ts` which uses `pgTable` and `pg-core`.
**Impact:** SQLite schema is never used — either dead code or migration artifact.
**Priority:** P2 — remove or convert to PostgreSQL.

### 3. Webhook Delivery Missing 🟡

**File:** `lib/webhooks.ts`
**Issue:** Webhook CRUD works but delivery mechanism (HTTP POST, retry logic, exponential backoff) is not implemented.
**Impact:** Webhooks are created but never fired.
**Priority:** P2 — implement delivery logic.

### 4. Admin User Ownership Check Incomplete 🟡

**File:** `app/api/admin/users/[id]/route.ts`
**Issue:** DELETE handler returns immediately after incomplete ownership check — never actually checks if admin owns the user.
**Impact:** Unauthorized deletions possible.
**Priority:** P1 — must fix.

### 5. SSO Callback Incomplete 🟡

**File:** `app/api/auth/sso/callback/route.ts`
**Issue:** User profile fetch after ID token validation is incomplete.
**Impact:** SSO login may not work correctly.
**Priority:** P1 — must fix.

---

## Roadmap vs Implementation

Based on `FEATURE_ROADMAP.md` (502 lines, 14 phases):

| Phase | Priority | Features | Implemented | % Complete |
|-------|----------|----------|-------------|------------|
| Phase 1 | P1 | URL core, auth, basic links, security | ~20/20 | ✅ 100% |
| Phase 2 | P2 | Analytics, collections, QR, UTM, A/B, bio, pastes | ~15/20 | 🟡 75% |
| Phase 3 | P3 | API keys, webhooks, teams, enterprise, SSO, blocklist, audit, privacy | ~10/25 | 🟡 40% |
| Phase 4 | P4 | MCP, P2P, visitor tracking, performance | ~2/15 | 🔴 13% |

### Detailed Phase Breakdown

#### Phase 1: Core Infrastructure (✅ Complete)

- ✅ URL shortening with custom slugs
- ✅ Custom domains
- ✅ Basic link management
- ✅ Email/password auth
- ✅ Passkey/WebAuthn auth
- ✅ Rate limiting
- ✅ API security middleware
- ✅ Error handling

#### Phase 2: Enhanced Features (🟡 Mostly Complete)

- ✅ Bulk operations
- ✅ Collections
- ✅ QR codes
- ✅ UTM builder
- ✅ Smart suggestions
- ✅ A/B testing
- ✅ Link preview
- ✅ Tracking pixels
- ✅ Link masking
- ✅ Paste sharing
- ✅ Bio pages
- ✅ Link scheduling
- ✅ Health checks
- ✅ Quick actions
- 🟡 Analytics (basic only, no visitor details)
- 🟡 Cookie consent (partial)

#### Phase 3: Enterprise & Admin (🟡 Partially Complete)

- ✅ API keys
- ✅ Teams (CRUD only)
- 🟡 Webhooks (CRUD only, no delivery)
- 🟡 Enterprise features (mostly stubbed)
- 🟡 SSO (partial callback)
- 🟡 Admin blocklist (incomplete)
- 🟡 Admin users (partial)
- 🟡 Audit logging (incomplete)
- 🟡 Privacy pages (complete)
- 🟡 Cookie consent (partial)
- 🟡 GDPR banner (partial)
- 🟡 Cookie policy (partial)

#### Phase 4: Advanced Features (🔴 Mostly Not Implemented)

- 🔴 MCP server (stubbed)
- 🔴 P2P file sharing (partial — no WebRTC)
- 🔴 Visitor tracking (basic only)
- 🔴 Performance optimization
- 🔴 CDN configuration
- 🔴 Advanced analytics (geographic, device, browser stats)

---

## Test Coverage

Only 7 test files exist across 582 total files:

| Test File | Coverage |
|-----------|----------|
| `tests/auth.test.ts` | Auth config |
| `tests/passkey-challenge.test.ts` | Passkey challenge |
| `tests/passkey-login-token.test.ts` | Passkey login token |
| `tests/paste-access.test.ts` | Paste access control |
| `tests/rate-limit.test.ts` | Rate limiting |
| `vitest.config.ts` | Vitest configuration |
| `vitest.setup.ts` | Vitest setup |

**Estimated test coverage: < 3%** — critically low for a production application.

### Recommended Test Priority

1. **Auth flow** (email/password + passkeys) — `lib/auth/`
2. **Link CRUD** — `app/api/links/`
3. **Rate limiting** — `lib/api-security.ts`
4. **API keys** — `lib/api-keys.ts`
5. **Bulk operations** — `lib/bulk-shortening.ts`
6. **Webhook delivery** — `lib/webhooks.ts`
7. **P2P file sharing** — `lib/p2p-filesharing.ts`

---

## Recommendations

### Immediate (P1)

1. **Fix link-tags bug** — `getUserTags` column comparison in `lib/db/link-tags.ts`
2. **Fix admin user ownership check** — `app/api/admin/users/[id]/route.ts`
3. **Fix SSO callback** — `app/api/auth/sso/callback/route.ts`
4. **Add tests for auth flow** — critical security features need test coverage

### Short Term (P2)

5. **Remove or convert stats-schema** — `lib/db/stats-schema.ts` dialect mismatch
6. **Implement webhook delivery** — `lib/webhooks.ts` delivery mechanism
7. **Complete visitor analytics** — `app/api/stats/visitors/route.ts`
8. **Add tests for link CRUD** — core feature needs coverage
9. **Implement cookie consent management** — `lib/cookie-consent.ts`

### Medium Term (P3)

10. **Complete enterprise features** — SAML SSO, usage limits, audit logging
11. **Implement audit logging integration** — `lib/audit-log.ts`
12. **Complete SSO domains** — `app/api/sso/domains/`
13. **Add tests for bulk operations**
14. **Complete blocklist admin route** — super admin check

### Long Term (P4)

15. **Implement MCP server** — `app/api/mcp/`
16. **Complete P2P file sharing** — WebRTC data transfer
17. **Implement performance optimizations** — caching, CDN, lazy loading
18. **Add comprehensive test suite** — target > 70% coverage
19. **Implement advanced analytics** — geographic, device, browser stats

---

## Appendix: File Statistics

### By Category

| Category | Files | Fully Implemented | Partial | Stub |
|----------|-------|-------------------|---------|------|
| API Routes | 73 | 45 | 20 | 8 |
| UI Pages | 25 | 15 | 8 | 2 |
| Components | 30 | 20 | 7 | 3 |
| Lib Files | 39 | 30 | 6 | 3 |
| DB Files | 17 | 13 | 2 | 2 |
| Config/Test | 8 | 5 | 2 | 1 |
| **Total** | **192** | **128** | **45** | **19** |

*Note: 582 total files analyzed; this table covers primary source files.*

### Top 10 Most Complete Files (by lines of meaningful code)

| File | Lines | Category |
|------|-------|----------|
| `lib/db/schema.ts` | 938 | DB |
| `lib/api-security.ts` | 318 | Lib |
| `lib/passkeys.ts` | 272 | Lib |
| `lib/user-features.ts` | 453 | Lib |
| `app/api/analytics/[linkId]/route.ts` | 346 | API |
| `app/api/analytics/[linkId]/export/route.ts` | 258 | API |
| `app/api/stats/visitors/route.ts` | 260 | API |
| `app/api/user/stats/route.ts` | 260 | API |
| `app/api/links/[linkId]/route.ts` | 232 | API |
| `app/api/links/route.ts` | 204 | API |

### Files with Most TODOs

| File | TODO Count |
|------|------------|
| `lib/db/stats-schema.ts` | 3 |
| `app/api/enterprise/` | 3 |
| `components/teams/` | 3 |
| `components/cookie-consent.tsx` | 2 |
| `lib/webhooks.ts` | 2 |
| `lib/enterprise.ts` | 2 |

---

*Report generated from analysis of 582 files in the Zhort project.*
*Cross-referenced against FEATURE_ROADMAP.md (502 lines, 14 phases).*
*Date: 2026-01-08*