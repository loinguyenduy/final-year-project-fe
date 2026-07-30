# Manual test — Admin auth, persistence and KYC UI hardening

## Preconditions

- Run the frontend and backend in development or test.
- Prepare an active Admin, inactive Admin, Customer and Handyman.
- Prepare pending, approved and rejected KYC submissions with private Cloudinary images.
- Use DevTools Network with `Disable cache` enabled when counting application requests.
- Use two browser profiles for Admin/participant realtime scenarios.

## Admin authentication

1. Sign in with a valid Admin and confirm the portal opens.
2. Try a wrong password, Customer credential, Handyman credential and inactive Admin. No Admin shell or session cookie may be issued for rejected credentials.
3. Open `/admin/kyc?status=PENDING` directly while signed out, sign in, and confirm the deep link is restored.
4. Reload with a valid access token. Confirm one `GET /auth/admin/session` and no refresh loop.
5. Reload with an expired access token and valid refresh cookie. Confirm one `POST /auth/refresh`, then one Admin session verification.
6. Expire/revoke the refresh token. Confirm local logout and redirect to `/admin/login`.
7. Logout, then press Back. The Admin shell must not render.

## Redux Persist compatibility

1. Sign in and inspect `persist:trusted_handyman_root` in localStorage.
2. Confirm it only contains `isAuthenticated`, access token, and basic identity: `id`, `role`, `full_name`, `avatar_url`.
3. Confirm wallets, KYC documents/rejection, auth providers, Handyman level/bond/statistics and page data are absent.
4. Reload using persisted data from the previous schema. The app must not crash and dynamic arrays/objects must start empty until REST profile data arrives.
5. Logout and sign in as another account. No dynamic snapshot from the previous account may appear.

## KYC request count

| Scenario | Expected application requests |
|---|---|
| Reload KYC list | `GET /auth/admin/session`, `GET /admin/queue-counts`, `GET /admin/kyc/requests` |
| Select a submission | One `GET /admin/kyc/requests/:submissionId` |
| Open an image first time | One document-access GET; no list/detail GET |
| Reopen same unexpired image | No document-access GET |
| Retry or reopen expired image | One new document-access GET |
| Approve/Reject | One decision POST and one list/detail/count refresh wave |

The first socket connection after mount must not create another GET wave. A real reconnect after a disconnect must refetch canonical data.

## KYC list and detail

1. Test search, role/status filters and pagination.
2. Confirm each row shows avatar/fallback, full name, email, role, submission number/time, document completeness and status.
3. Open pending, approved, rejected and historical submissions.
4. Confirm Applicant information, friendly document names, submission attempt and history are readable; no raw JSON, public ID or signed URL is rendered.
5. Simulate slow initial requests: each panel has an initial loading state.
6. Trigger focus or realtime refresh: existing data remains visible with a small refreshing indicator.
7. Fail a background refresh: existing detail remains visible and Retry is available.

## Image preview modal

1. Open Citizen ID Front, Citizen ID Back, Selfie, Certificate and CV when present.
2. The modal opens immediately; protected-access and image-download loading are contained inside it.
3. Test portrait, landscape and large images. Aspect ratio is preserved and the image stays inside the viewport.
4. Close with X, backdrop and Escape. Focus returns to the View image button.
5. Simulate document-access failure and image-load failure. The modal shows a safe error and Retry works.
6. Switch submissions and verify the previous submission's in-memory signed URL is not reused.
7. Confirm no large image remains below the document list after closing.
8. Test 1440×900, 768×1024, 390×844 and 320×800 without horizontal overflow.
9. Confirm signed URLs do not appear in Redux Persist, query strings, audit, socket payloads or logs.

## Decisions and realtime

1. Approve with confirmation; rapidly double-click the submit button. Only one POST and audit may be created.
2. Reject with every standard reason; verify `OTHER` requires a non-empty note and the 500-character limit remains enforced.
3. After success, confirm canonical list/detail/count are refreshed once.
4. In the participant browser, confirm `KYC_REVIEWED` triggers one `/identity/profile` refetch without F5.
5. Submit/resubmit KYC in the participant browser. Confirm `ADMIN_KYC_QUEUE_UPDATED` refreshes Admin list/count.
6. Navigate away from and back to KYC repeatedly, then emit one event. Only the currently mounted listeners may issue requests.

## Regression and quality gates

- Customer/Handyman login, refresh, profile and KYC submission still work.
- Admin Review Center remains accessible.
- Chat and Job Lifecycle behavior remains unchanged.
- Run `npm run lint`, `npm run build`, and `git diff --check` in the frontend.
- Run `node --check src/modules/admin/services/AdminKyc.service.js` and `git diff --check` in the backend.
