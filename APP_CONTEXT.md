# App Context: Host Automation

## Purpose
Host Automation is a full-stack web app that helps short-term rental hosts automate guest onboarding and contract handling.

Core outcomes:
- Host creates and manages reservations.
- Host shares a guest form link.
- Guest submits identity/contact details.
- Contract PDF is generated and stored.
- Guest signs digitally.
- Signed artifacts remain accessible to the host.

## Architecture Snapshot
- Framework: Next.js App Router (single monorepo for frontend + backend)
- Frontend: React pages in `app/`
- Backend: Route Handlers in `app/api/`
- Data access: Prisma services in `lib/services/`
- Database: PostgreSQL
- Storage: Cloudinary (documents, signatures, PDFs)
- Auth: NextAuth/Auth.js (session-based host authentication)

## Actors and Access Model
### Host (authenticated)
- Logs in via credentials.
- Accesses dashboard and reservation management flows.
- Can create reservations, generate guest links, and manage contracts.

### Guest (token-based public access)
- No account required.
- Access is limited to `/guest-form/[token]` and `/guest-form/[token]/sign`.
- Cannot access host dashboard or host APIs.

## Main End-to-End Flow
1. Host creates a reservation.
2. Host generates a guest form token/link for that reservation.
3. Guest opens tokenized form and submits details.
4. Backend marks token as used and updates reservation status.
5. Backend attempts contract generation (HTML -> PDF -> Cloudinary URL).
6. Guest proceeds to sign page (if contract generated).
7. Signing API validates token + guest + contract relationship.
8. Signature is stored, signed PDF is regenerated/uploaded, contract status becomes `signed`.

## Key Business Behaviors
- Guest token has lifecycle constraints: must exist, must not be expired, and can be marked used.
- Contract generation requires reservation context and at least one guest.
- Reservation list/details are scoped by host ownership (`property.userId`).
- Contract signing is explicitly scoped to the reservation attached to the guest token.

## Current Security Boundaries
- Route-level host guard exists for dashboard/reservations/contracts routes.
- Server-side reservation layout guard enforces authenticated access to reservation pages.
- Reservation token generation checks ownership before issuing a token.
- Contract signing checks that:
  - token is valid (exists + not expired)
  - guest belongs to token reservation
  - contract belongs to token reservation

## Important Status/Lifecycle Signals
### Reservation (observed)
- `pending`
- `guest_submitted`
- (other statuses may exist depending on flows)

### Contract (observed)
- `draft`
- `sent`
- `signed`

## Data Model (high-level)
- User -> Property -> Reservation
- Reservation -> Guest
- Reservation -> Contract
- Contract -> Signature
- Reservation -> GuestFormToken

This structure lets one host manage many properties/reservations while maintaining guest-link isolation per reservation.

## API Surface (behavioral groups)
### Host APIs (authenticated)
- `POST /api/reservations`
- `GET /api/reservations`
- `GET /api/reservations/[id]`
- `POST /api/reservations/[id]/token`
- `GET /api/properties`
- `POST /api/contracts/generate`

### Guest APIs (token-scoped)
- `GET /api/guest-form/[token]`
- `POST /api/guest-form/[token]`
- `POST /api/contracts/sign` (requires token and ownership validation)

### Utility API
- `POST /api/upload/document`

## Operational Notes
- Root page currently redirects to dashboard.
- The codebase follows a modular-monolith approach: keep domain logic in services and keep route handlers thin.
- Cloudinary acts as external object storage for generated/collected files.

## Environment Expectations
The app expects environment variables for:
- Database connection (`DATABASE_URL`)
- Auth secrets and base URL (`NEXTAUTH_SECRET`, `AUTH_SECRET`, `NEXTAUTH_URL`)
- Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)

## Recommended Next Documentation Additions
- Sequence diagram for guest token lifecycle.
- Explicit error contract for all APIs.
- Role matrix (Host vs Guest) by endpoint/page.
- Incident playbook for token abuse and credential rotation.
