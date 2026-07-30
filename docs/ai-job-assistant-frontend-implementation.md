# AI Job Assistant Frontend Implementation

## Outcome

The Customer route `/customer/ai-diagnosis` now owns two optional modes:

- `AI Assistant`: text conversation, canonical draft, historical price guidance
  and Customer price decision. The Assistant keeps one canonical VI/EN
  language and presents a diagnosis review before price guidance.
- `Manual Form`: the existing Create Job implementation, unchanged in its
  location, GPS, schedule, image, validation and canonical submit behavior.

The assistant never creates a Job. It prepares only Service, issue description
and an optional budget. The Customer must confirm the remaining form fields.

## Gate results

| Gate | Result | Evidence |
|---|---|---|
| 0 — Backend/ENV | Passed with one documented model change | AI tables and indexes verified with `DB_SYNC_ALTER=false`; provider smoke passed; live session/message/decision API passed; manual and AI-assisted Create Job smoke passed. |
| 1 — API/state | Implemented | Axios service, one local-state hook, stable UUID message keys, revision reconciliation, failed-row retry and URL session resume. |
| 2 — Conversation/draft | Implemented | Responsive localized conversation, plain-text bubbles, processing/failed states, diagnosis review/correction/confirmation, estimate/insufficient states and four price decisions. |
| 3 — Create Job | Implemented | Existing form is reused; approved prefill only; optional session ID only when Service matches; manual detach and canonical 409 handling. |
| 4 — Handyman guidance | Implemented | Safe guidance hint in available list and full reference card before the Bid panel; Bid state and validators are unchanged. |
| 5 — Verification/docs | Partially passed | Lint/build/security searches passed. Automated browser control was unavailable, so the six visual breakpoint checks remain manual and are not claimed as passed. |

## Backend preflight

Verified without displaying the Gemini key:

- `GEMINI_API_KEY` configured.
- AI configuration resolves the approved timeout/session/rate/estimator values.
- All three AI tables and seven required indexes exist.
- Normal runtime schema verification passes with schema alteration disabled.
- Live session → message → structured draft → insufficient historical estimate
  works against real active Services.
- `CONTINUE_WITHOUT_ESTIMATE` and `USE_OWN_BUDGET` both reach `DRAFT_READY`.
- A manual Create Job creates no AI snapshot and is cancelled through the
  canonical pre-acceptance endpoint.
- An AI-assisted Create Job creates exactly one snapshot, changes its session
  to `APPLIED_TO_JOB`, and is cancelled through the same canonical endpoint.

### Provider model deviation

`gemini-2.5-flash` returned HTTP 404 for the configured new Google project:
the model is not available to new users. `gemini-2.5-flash-lite` had the same
result. A temporary smoke with `gemini-3.5-flash-lite` passed the existing
structured schema without prompt, schema or validator changes.

Only backend `.env` `GEMINI_MODEL` was changed to
`gemini-3.5-flash-lite`. The key never enters frontend source or Vite
configuration.

## Frontend architecture

```text
AiJobAssistantPage
├── useAiJobAssistant
│   └── aiJobAssistantService (existing Axios singleton)
├── AiConversationPanel
├── AiJobDraftPanel
│   ├── AiDiagnosisReviewCard
│   ├── AiPriceGuidanceCard
│   └── AiPriceDecisionModal (ParticipantModal)
└── CustomerCreateJobPage (existing form, mounted once)
```

The form stays mounted while modes change so Customer edits are not lost.
Starting directly in Manual Form with no session performs no AI API request.

State that remains local only:

- session DTO and messages;
- draft and decision UI;
- loading/error states;
- current composer/modal values.

There is no AI Redux state, localStorage/sessionStorage persistence, polling,
streaming or Socket.IO integration.

## URL and request behavior

Supported query state:

```text
?mode=ai|manual
?session=<owned UUID>
```

No description, message, amount or estimate is put into the URL.

Message behavior:

1. Generate `client_message_id` before the first request.
2. Send current canonical `expected_revision`.
3. Keep the same UUID when retrying a failed canonical message.
4. On revision/state conflict, GET the canonical session once.
5. Reads are abortable; provider mutations are not aborted on render.

## Price decisions

- `ACCEPT_SUGGESTION`: immediate, only when allowed by the backend.
- `RECALCULATE`: accessible modal, stable UUID and concrete clarification
  validation.
- `USE_OWN_BUDGET`: positive integer-string VND range, no float amount math.
- `CONTINUE_WITHOUT_ESTIMATE`: leaves budget empty.

The UI consumes `allowed_actions`, status and stage from the backend. It does
not reproduce the backend session state machine or estimate calculation.

## Language and diagnosis confirmation

- `conversation_language` from the session DTO is the sole UI language source.
- Before the first meaningful response, the page uses the backend-compatible
  VI default. It does not independently inspect or translate Customer text.
- The same copy set drives page headings, composer, retry/error text, diagnosis
  review, price guidance and decision modal.
- Standard Service codes/names and technical terminology are not translated by
  the frontend.
- `REVIEW_DIAGNOSIS` renders only backend-whitelisted known fields and the
  backend-provided `allowed_actions`.
- `CONFIRM_DIAGNOSIS` performs no optimistic transition; canonical data is
  rendered from the response.
- `CORRECT_DIAGNOSIS` focuses the composer. The composer remains enabled while
  `SEND_MESSAGE` is allowed and shows correction guidance when the backend
  marks `diagnosis_confirmation=CORRECTING`.
- The draft/price area is not treated as final before confirmation. Estimate
  content is displayed only when present in the canonical DTO.

## Create Job integration

`CustomerCreateJobPage` was extended with optional integration props. Edit mode
and normal direct usage retain their existing behavior.

Prefill whitelist:

- `service_id`;
- `issue_description`;
- `estimated_budget_min`;
- `estimated_budget_max`.

Never prefilled:

- address/province/ward;
- GPS/map confirmation;
- schedule;
- images;
- participant/contact fields.

`ai_assistant_session_id` is appended only for a new Job with a ready linked
session and matching Service. The estimate, confidence and sample count are
never sent by the browser.

Changing Service displays a blocking inline warning with two explicit choices:
restore the AI Service or detach/abandon the AI session and keep the form as
manual. Description and budget remain editable.

Handled integration codes:

- `AI_SESSION_SERVICE_MISMATCH`: preserve form, restore or detach.
- `AI_SESSION_ALREADY_APPLIED`: open the existing safe Job ID.
- expired/not-ready/not-found: preserve form and offer manual detach.

## Safe participant guidance

The shared presentation component accepts only `ai_price_guidance`.

- Customer own POSTED/BIDDING detail: compact read-only card.
- Handyman available list: one-line range/insufficient hint.
- Handyman available detail: guidance card before the existing Bid panel.
- Manual Jobs render no AI placeholder.

The UI separates Customer expected budget, AI historical guidance and Handyman
Bid. It never prefills or validates a Bid from AI guidance.

Money uses integer decimal strings and `BigInt` with `Intl.NumberFormat`.

## Privacy and security

- No Gemini dependency, endpoint, key or model exists in frontend code.
- Messages are rendered as plain text; no `dangerouslySetInnerHTML`.
- No prompt, raw provider response, token usage or historical Job is exposed.
- No AI message/session data is persisted in browser storage.
- Session ID is only an opaque resumable resource ID; backend ownership still
  authorizes every request.

## Files

Created:

- `src/modules/ai/services/aiJobAssistantService.js`
- `src/modules/ai/hooks/useAiJobAssistant.js`
- `src/modules/ai/utils/aiJobAssistantPresentation.js`
- `src/modules/ai/pages/AiJobAssistantPage.jsx`
- `src/modules/ai/components/AiConversationPanel.jsx`
- `src/modules/ai/components/AiDiagnosisReviewCard.jsx`
- `src/modules/ai/components/AiJobDraftPanel.jsx`
- `src/modules/ai/components/AiPriceDecisionModal.jsx`
- `src/modules/ai/components/AiPriceGuidanceCard.jsx`
- `src/modules/ai/components/AiPriceGuidanceHint.jsx`
- `src/modules/ai/styles/AiJobAssistant.scss`
- this document and `manual-ai-job-assistant-frontend-test.md`

Modified:

- `src/App.jsx`
- `src/modules/customer/features/jobs/pages/CustomerCreateJobPage.jsx`
- `src/modules/customer/features/jobs/pages/CustomerJobDetailsPage.jsx`
- `src/modules/customer/features/jobs/styles/CreateJob.scss`
- `src/modules/handyman/features/jobs/pages/HandymanFindJobPage.jsx`
- `src/modules/handyman/features/jobs/pages/HandymanJobDetailsPage.jsx`
- backend `.env` model only
- workspace `PROJECT_CONTEXT_AND_GUIDELINES.md`

## Commands and actual results

- Backend normal schema verifier: passed.
- `npm run ai:gemini:smoke`: passed using `gemini-3.5-flash-lite`.
- Live AI API smoke: passed; real data returned `INSUFFICIENT_DATA` with one
  comparable selected Bid.
- Manual Create Job/canonical cancellation smoke: passed; snapshot count `0`.
- AI-assisted Create Job/canonical cancellation smoke: passed; snapshot count
  `1`, session `APPLIED_TO_JOB`.
- Frontend `npm run lint`: passed.
- Frontend `npm run build`: passed; existing large-chunk warning remains.
- Live language/diagnosis API smoke: VI/EN lock and explicit switch passed;
  review had no estimate, Confirm produced `ESTIMATE_PRESENTED`, Correct
  re-enabled message input, and temporary sessions were abandoned.
- Automated visual/browser inspection: not run because no controllable browser
  was available in the execution environment.

## Known limitations

- Image diagnosis remains out of scope.
- Session/messages remain in backend storage after expiry per backend policy.
- Browser refresh after URL session removal cannot resume that abandoned
  session.
- Historical sample size in the current database is small, so an honest
  insufficient-data state is expected.
- Visual screenshots at all six breakpoints require the manual guide.
- Ambiguous first text intentionally uses Vietnamese until the backend sees an
  explicit language request.
