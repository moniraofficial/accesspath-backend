# AccessPath Backend

**AccessPath** is an Urban Accessibility & Mobility Platform backend built with **TypeScript**, **Node.js**, **Express 5**, and **MongoDB Atlas (Mongoose)**. It powers accessibility-aware location discovery, barrier reporting, community verification, route accessibility scoring, secure image uploads, and administrative analytics.

---

## Tech Stack

- **Runtime & Language:** Node.js + TypeScript (`nodenext`, `strict: true`)
- **Framework:** Express 5
- **Database:** MongoDB Atlas (Mongoose 9 with `2dsphere` geospatial indexes & ACID transactions)
- **Authentication & Security:** `jsonwebtoken` (dual access/refresh secrets), `bcryptjs`, AES-256-GCM encrypted refresh-grace payloads, atomic MongoDB failed-login tracking & rate limiting, RBAC + ownership separation

---

## Setup & Running

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` (never commit `.env`):
   - `PORT=5000`
   - `MONGO_URI=<MongoDB Atlas Replica Set URI>`
   - `JWT_SECRET=<32+ char secret>`
   - `JWT_REFRESH_SECRET=<separate 32+ char secret>`
   - `TOKEN_RESPONSE_ENCRYPTION_KEY=<32-byte key or 64-hex chars>`
3. Build & start:
   ```bash
   npm run build
   npm start
   ```
   Or run in development:
   ```bash
   npm run dev
   ```
4. Seed minimum dataset (10,000+ locations, 50,000+ barriers, 100,000+ feedback records) and run benchmarks:
   ```bash
   npm run seed
   ```

---

## Demo Credentials (All 4 Roles)

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@accesspath.demo` | `DemoPass123!` |
| **Moderator** | `moderator@accesspath.demo` | `DemoPass123!` |
| **Contributor** | `contributor@accesspath.demo` | `DemoPass123!` |
| **Regular User** | `user@accesspath.demo` | `DemoPass123!` |

*(Created idempotently by `npm run seed`.)*

---

## Database Design

- **`users`**: `name`, `email` (unique), `password` (`select: false`), `role` (`admin | moderator | contributor | regular`), `isActive`, `tokenVersion`.
- **`refreshtokens`**: `userId`, `jti` (unique), `familyId` (indexed), `tokenHash` (SHA-256, `select: false`), `isUsed`, `isRevoked`, `expiresAt` (TTL index), `rotatedAt`, and AES-256-GCM encrypted 15s grace-window envelope (`replacementPayload`, `encryptionIv`, `encryptionTag`, `encryptionKeyVersion`, `replacementExpiresAt`).
- **`failedlogins`**: `key` (unique), `attempts`, `expiresAt` (TTL index) for atomic sliding/fixed-window rate limiting and brute-force lockout.
- **`locations`**: `name`, `description`, `address`, GeoJSON `location` (`2dsphere` index), `category`, `accessibilityScore` (0–100), 7 `accessibilityFeatures` booleans, `photos`, `verificationStatus` (`pending | verified | rejected`), `submittedBy`, `verifiedBy`, `verifiedAt`.
- **`barriers`**: `category` (5 barrier types), `description`, `imageUrl`, GeoJSON `location` (`2dsphere` index), `reportedBy`, `status` (`pending | verified | rejected | resolved`), `verifiedBy`, `resolvedBy`.
- **`feedbacks`**: `locationId`, `userId`, `rating` (1–5), `comment`, `status` (`active | hidden`), `moderatedBy`.
- **`favorites`**: `userId`, `locationId` with unique compound index `{ userId: 1, locationId: 1 }`.

---

## Route Scoring & Accessibility Algorithm

Implemented in `src/services/route.service.ts` (`POST /api/v1/routes/discover`):

1. **Candidate Generation:** Builds multiple distinct corridors between `start` and `destination`: Direct Corridor, Northern Accessible Detour, Southern Accessible Detour, and (when available) a route via a nearby verified high-score accessible hub.
2. **Spatial Corridor Query:** Queries MongoDB `barriers` (`verified` and `pending`) and verified `locations` inside the route bounding box.
3. **Multi-Factor Scoring (`0–100`, base `75`):**
   - **Shorter Distance:** `+10` if within 5% of shortest candidate; proportional detour penalty up to `-10`.
   - **Verified Ramp Available:** `+8`
   - **Verified Elevator Available:** `+8`
   - **Stair-free Corridor Facilities:** `+6`
   - **Barriers within 150m of route:** Verified barriers subtract `-20` (`Broken Footpath`, `Unsafe Crossing`), `-22` (`Missing Ramp`, `Broken Elevator`), or `-25` (`Blocked Sidewalk`), with extra preference penalties (`wheelchairFriendly`, `requireRamp`, `requireElevator`). Unverified (`pending`) barriers apply `50%` penalty and emit explicit unverified-data warnings.
4. **Accessibility-First Ranking:** Routes are sorted by `accessibilityScore` descending, using `distanceMeters` ascending only as a tie-breaker.

---

## API Endpoints Summary

- **Health:** `GET /`
- **Auth (`/api/v1/auth`):** `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `POST /logout-all`, `GET /me`
- **Locations (`/api/v1/locations`):** `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/verify`
- **Barriers (`/api/v1/barriers`):** `GET /`, `GET /my`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/verify`
- **Feedback (`/api/v1/feedback`):** `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `PATCH /:id/moderate`
- **Favorites (`/api/v1/favorites`):** `GET /`, `POST /:locationId`, `DELETE /:locationId`
- **Routes (`/api/v1/routes`):** `POST /discover`
- **Uploads (`/api/v1/uploads`):** `POST /` (PNG/JPEG/WebP verified by magic bytes, max 5MB, served at `/uploads/<file>`)
- **Admin (`/api/v1/admin`):** `GET /users`, `PATCH /users/:id`, `GET /analytics`
