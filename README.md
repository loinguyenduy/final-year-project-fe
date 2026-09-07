# Trusted Handyman

Trusted Handyman is a managed home-service marketplace that helps customers find and work with service providers through a structured job lifecycle. Rather than acting as a simple service directory, it supports role-specific workflows for customers, handymen, and administrators - from onboarding and job preparation through payment, service evidence, completion, and warranty handling.

## Project Overview

- **Customers** can manage their profile and KYC status, prepare service jobs, compare bids, select a handyman, follow service progress, manage payments, submit reviews, and raise warranty claims.
- **Handymen** can complete onboarding and eligibility steps, browse available jobs, submit bids and quotes, manage jobs in progress, and provide work evidence.
- **Administrators** have dedicated workspaces for user and KYC governance, jobs, services, wallets, transactions, and audit records.

The application brings together verified-provider workflows, a shared service lifecycle, payment-related UI, evidence collection, and warranty or claim handling.

## Live Demo

- **Live Demo:** [trusted-handyman.vercel.app](https://trusted-handyman.vercel.app/)
- **Frontend Repository:** [loinguyenduy/final-year-project-fe](https://github.com/loinguyenduy/final-year-project-fe)
- **Backend Repository:** [loinguyenduy/final-year-project-be](https://github.com/loinguyenduy/final-year-project-be)

## Demo Accounts

| Role | Email | Password | Login |
| --- | --- | --- | --- |
| Customer | `Confirm approved demo email before publishing` | `123456` | [Customer login](https://trusted-handyman.vercel.app/login) |
| Handyman | `Confirm approved demo email before publishing` | `123456` | [Handyman login](https://trusted-handyman.vercel.app/login) |
| Admin | `Confirm approved demo email before publishing` | `123456` | [Admin login](https://trusted-handyman.vercel.app/admin/login) |

> These accounts are provided for evaluation purposes and use demo data. Demo data may be reset or changed without notice.

Customer and Handyman accounts share the `/login` route; the authenticated role determines the destination workspace. Administrator accounts use `/admin/login`.

## Main User Workflows

### Customer

Register or sign in, manage profile and KYC-related onboarding, create or edit a job, and optionally prepare a job draft with the AI assistant. Customers can compare bids, select a handyman, manage wallet/deposit and payment steps, follow the lifecycle of an accepted job, view or provide evidence, confirm completion, submit reviews, and manage warranty claims.

### Handyman

Complete profile, KYC, service-area, skill, and eligibility-related steps; browse available jobs; submit bids; manage selected jobs; prepare quotes; update service progress; and provide work evidence. The shared lifecycle also includes completion and warranty/rework-related actions where applicable.

### Admin

Use a separate protected portal to review users and KYC submissions, oversee jobs and services, inspect wallet and transaction views, and access audit-oriented operational screens.

## Frontend Architecture

The frontend is a React single-page application organized by domain modules: `identity`, `customer`, `handyman`, `matchmaking`, `admin`, `chat`, `ai`, and `fintech`.

- **Routing and workspaces:** React Router defines public, customer, handyman, shared job-lifecycle, and administrator routes. `GuestRoute`, `RoleRoute`, and `AdminRoute` keep navigation aligned with the active session and role.
- **Global state:** Redux stores the identity/session slice. Redux Persist restores a sanitized identity snapshot when the application reloads; page and feature state remains local to the relevant UI modules.
- **API layer:** Feature services use a shared Axios instance configured from runtime environment variables. The instance attaches the access token, sends refresh-cookie credentials, queues concurrent refresh attempts, and clears invalidated sessions.
- **Session handling:** `AuthSessionGate` checks persisted access tokens and attempts a refresh when needed before rendering the application. Administrator routes additionally verify the admin session with the backend.
- **Realtime communication:** Socket.IO client connections are authenticated with the access token and shared through reference-counted socket helpers. Chat, account-session, KYC-status, and job-lifecycle features use realtime events alongside REST reads; the backend remains the authoritative state source.
- **Shared UI modules:** The job-lifecycle workspace composes stage-specific views, quote/payment UI, evidence managers, history, contract, warranty, and error/loading states around the same accepted job.

```text
React UI
  -> feature service / shared Axios client
  -> REST API
  -> backend and persisted data
  -> Socket.IO event or REST refetch
  -> refreshed UI state
```

## Frontend Engineering Highlights

- **Role-aware workspaces:** Customer, Handyman, and Admin routes use distinct layouts and route guards so each role is directed to the appropriate operational UI.
- **Recoverable session flow:** A session gate, Axios refresh queue, and invalidation handling help the UI recover an expired access token or return the user to sign-in when the backend revokes a session.
- **Shared lifecycle workspace:** A reusable job lifecycle combines participant-specific stages with shared quote, payment, evidence, contract, completion, cancellation, and warranty UI.
- **Realtime with recovery paths:** Authenticated Socket.IO connections support chat and lifecycle signals, track connection state, and expose reconnect hooks so features can refresh REST-backed data after reconnecting.
- **Evidence and upload UX:** Reusable evidence managers submit image files with `FormData`, report upload progress, and support listing and deletion through the lifecycle API.
- **Location-aware job preparation:** Customer job creation supports browser geolocation, address lookup, map-pin selection, reverse geocoding, and location confirmation through Leaflet-based UI.
- **Operational admin interfaces:** Protected administrator screens provide loading, error, empty, detail, and audit-oriented views for KYC, jobs, users, finance, and services.

## Technology Stack

| Area | Technologies used in this frontend |
| --- | --- |
| Language | JavaScript (ES modules) |
| Framework | React 19 |
| Routing | React Router |
| State management | Redux, Redux Persist, React Redux |
| API and session networking | Axios, `jwt-decode` |
| Realtime | Socket.IO Client |
| Styling and UI | SCSS, Bootstrap, React Icons, React Toastify |
| Forms and validation | React Hook Form, Yup, `@hookform/resolvers` |
| Maps and browser location | Leaflet, Browser Geolocation API |
| Charts | Recharts |
| Date/time formatting | Moment.js |
| Testing | Node.js built-in test runner (`test/runtimeUrls.test.js`) |
| Build and deployment configuration | Vite, Vercel SPA rewrite configuration |

## Environment Variables

Create a local `.env` file from `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes for production | Backend REST base URL. It must end with `/api/v1`. |
| `VITE_SOCKET_URL` | Optional | Socket.IO server origin. If omitted, the backend origin derived from `VITE_API_BASE_URL` is used. |
| `VITE_MAP_TILE_URL` | Optional | Override for the map tile URL. |
| `VITE_MAP_ATTRIBUTION` | Optional | Attribution text for the configured map tiles. |

Example:

```env
VITE_API_BASE_URL=https://your-backend-url/api/v1
VITE_SOCKET_URL=https://your-backend-url
VITE_MAP_TILE_URL=
VITE_MAP_ATTRIBUTION=
```

> `VITE_*` variables are embedded in the browser build. Never put API keys, passwords, tokens, or other secrets in them.

## Local Development

### Prerequisites

- Node.js and npm
- A running [Trusted Handyman backend](https://github.com/loinguyenduy/final-year-project-be) configured to accept the frontend origin

### Run locally

1. Clone this repository.

   ```bash
   git clone https://github.com/loinguyenduy/final-year-project-fe.git
   cd final-year-project-fe
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`, then set `VITE_API_BASE_URL`. For local backend development, the provided example uses `http://localhost:5000/api/v1`.

4. Start the development server.

   ```bash
   npm run dev
   ```

   Vite is configured to use port `5173`.

5. Create a production build when needed.

   ```bash
   npm run build
   ```

Additional available commands:

```bash
npm run lint
npm run test:runtime-urls
npm run preview
```

## Production and Deployment

This frontend is configured as a Vite SPA. [`vercel.json`](./vercel.json) rewrites all routes to `index.html`, which allows client-side routes such as `/customer/dashboard` and `/admin/login` to load correctly after a direct visit or refresh.

For a production deployment, configure `VITE_API_BASE_URL` with the deployed backend URL ending in `/api/v1`. Configure `VITE_SOCKET_URL` only when the Socket.IO server uses a different origin.

## Related Repositories

- **Frontend - this repository:** [loinguyenduy/final-year-project-fe](https://github.com/loinguyenduy/final-year-project-fe)
- **Backend - REST API, data, authentication, realtime, and integrations:** [loinguyenduy/final-year-project-be](https://github.com/loinguyenduy/final-year-project-be)

## Screenshots

Approved public-safe screenshots have not been selected for this repository yet.

<!-- Add approved customer job or lifecycle screenshot here -->

<!-- Add approved handyman workspace screenshot here -->

<!-- Add approved administrator workspace screenshot here -->

## Security and Data Notes

- Runtime URLs are supplied through environment variables; browser-visible `VITE_*` values must not contain secrets.
- Authentication and authorization are enforced by the backend. Frontend route guards improve navigation and user experience, but they are not a security boundary.
- The frontend sends access tokens through the shared API client and relies on backend session and authorization responses to determine access.

## Known Limitations

- Automated frontend tests currently focus on runtime URL configuration; broader end-to-end and integration coverage is outside this repository's current test suite.
- Local and deployed operation depend on the backend and its configured external services.
- Demo data and accounts are disposable and may change as the evaluation environment is reset.
- AI-assisted job drafting depends on the backend integration and its external provider configuration.
