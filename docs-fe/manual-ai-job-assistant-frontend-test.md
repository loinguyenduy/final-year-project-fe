# Manual Test — AI Job Assistant Frontend

## Preconditions

1. Backend runs with the three AI tables already verified.
2. `DB_SYNC_ALTER=false`.
3. Gemini key/model are configured; do not inspect the key in browser tools.
4. Use an active, KYC-verified Customer for Create Job tests.
5. Prepare one Handyman able to view/bid on the selected Service.
6. Do not edit Wallet/Transaction data.

## A. Backend preflight

| Test | Steps | Expected |
|---|---|---|
| Provider configured | Run `npm run ai:gemini:smoke`. | `status=OK`; no key/prompt/raw response in logs. |
| Provider unavailable | Remove config in a disposable environment only, restart, open AI route. | Inline unavailable state; Manual Form remains usable. |
| Schema | Start backend normally with alter disabled. | AI schema verifier passes. |
| Insufficient data | Complete a Service with fewer than 3 comparable selected Bids. | Honest insufficient state, no `0–0` or fake range. |
| Valid estimate | Use a prepared Service with at least 3 valid comparable Jobs. | LOW/MEDIUM range from backend decimal strings. |

## B. Entry and modes

1. Open `/customer/ai-diagnosis`.
2. Verify default AI mode creates one session and URL receives only `session`.
3. Switch to Manual Form and back.
4. Enter form values, switch to AI and return to Manual.
5. Refresh an AI URL with `session`.
6. Open `?mode=manual` without `session`.

Expected:

- existing session resumes with one GET;
- manual edits survive in-page mode changes;
- direct manual-only use sends no AI API request;
- URL never contains message, description, estimate or budget.

## C. Conversation

Test Vietnamese and English descriptions:

- ambiguous issue requiring follow-up;
- complete issue;
- out-of-scope request;
- electrical/gas/fire/flood safety warning;
- multiple follow-ups;
- max-turn state.

Verify:

- Customer message aligns right; Assistant left;
- plain text and line breaks only;
- Enter sends, Shift+Enter adds a line;
- send is disabled while processing;
- no fake token stream;
- long message wraps and no horizontal overflow;
- auto-scroll does not pull the user down while reading older messages.

### Language lock and switching

Use separate sessions for Vietnamese, English, mixed technical terms and an
ambiguous first message.

Expected:

- all Assistant and AI-page control copy follows `conversation_language`;
- an ordinary mixed-language follow-up does not switch a locked language;
- explicit “continue in English” or “tiếp tục bằng tiếng Việt” switches later
  Assistant and UI copy;
- Service codes/names remain canonical;
- retry and validation messages use the same language;
- no text promises that a technician is assigned or will automatically be
  sent, and no diagnosis is worded as certain.

### Retry/idempotency

1. Force timeout/unavailable provider.
2. Note the failed Customer bubble.
3. Click Retry once.
4. Inspect network request.

Expected:

- same `client_message_id`;
- same Customer row/message, no duplicate bubble;
- canonical session reloads after revision conflict;
- unsent composer text survives a network/revision failure.

## D. Diagnosis review, price guidance and decisions

1. Provide enough information for a complete diagnosis summary.
2. Verify `Review diagnosis/Xác nhận thông tin` appears before any estimate.
3. Use Correct, then type and submit a correction.
4. Reach review again and use Confirm.
5. Repeat with direct typing while the review card is visible.

Expected:

- the review card shows only available known fields;
- composer remains usable during review/correction;
- Correct focuses the composer and does not create a new session;
- no estimate is shown or requested before Confirm;
- Confirm prevents double submit and then renders canonical price guidance;
- direct typing is treated as a correction rather than showing a premature
  draft-locked state;
- stale revision/state responses refetch the canonical session.

Test each backend-allowed action:

1. Use suggested range.
2. Clarify and recalculate.
3. Use own budget.
4. Continue without price guidance.

Validate:

- recalculation rejects trivial/empty clarification;
- recalculation displays remaining count;
- own budget requires positive integer VND strings and `max >= min`;
- buttons prevent double submit;
- insufficient data is not shown as an error;
- `DRAFT_READY` displays Continue to Job Form;
- no numeric/fake confidence percentage.

## E. Draft and Create Job

1. Reach `DRAFT_READY`.
2. Continue to Manual Form.
3. Verify only Service, description and chosen budget are prefilled.
4. Confirm address, GPS/map, schedule and images are empty/unconfirmed.
5. Edit description/budget and submit.
6. Inspect multipart keys.

Expected:

- existing canonical endpoint `/matchmaking/jobs`;
- only matching ready session adds `ai_assistant_session_id`;
- no estimate/confidence/sample metadata is submitted;
- one Job and one AI snapshot;
- normal success navigation/toast.

### Service mismatch

1. Change Service after AI prefill.
2. Attempt submit.
3. Test “Use AI Service”.
4. Change again and choose “Continue manually”.

Expected:

- clear inline warning;
- submit is blocked while mismatch remains linked;
- restore selects detected Service;
- manual choice preserves form values, removes session ID and abandons the
  unused assistant session best-effort.

### Stale integration

Test `AI_SESSION_ALREADY_APPLIED`, expired, not-ready and not-found:

- form values remain;
- already-applied opens the existing Job;
- other stale cases offer manual detach;
- no duplicate Job is created.

## F. Manual Create Job regression

Start directly with `?mode=manual` and test:

- all three address options;
- GPS permission denied/retry;
- manual map pin and confirmation;
- address-text-only fallback;
- province/ward;
- schedule validation;
- 0–5 images and file limits;
- KYC gating;
- successful post and edit of POSTED Job.

Expected: no AI request and no AI snapshot.

## G. Handyman guidance

1. Open Find Jobs with one AI-assisted and one manual Job.
2. Open both Job details.
3. Submit/update/withdraw Bids below, within and above guidance.
4. Test mobile layout.

Expected:

- AI Job list has a compact guidance hint;
- detail shows guidance before Bid;
- manual Job shows no empty AI element;
- Customer budget, guidance and Bid are visually separate;
- no message/session/historical Job data appears;
- Bid validation and matching behavior remain unchanged.

## H. Customer detail

Open the newly posted AI Job while `POSTED/BIDDING`.

Expected:

- read-only safe guidance card;
- only range/typical/confidence/sample/decision-safe data;
- no assistant conversation;
- later lifecycle DTOs/pages do not gain an AI panel when backend omits it.

## I. Accessibility and responsive

Test:

- 1440×900
- 1366×768
- 1024×768
- 768×1024
- 390×844
- 320×800
- 200% zoom where practical

Checklist:

- no page-level horizontal overflow;
- desktop two columns; tablet/mobile one column with conversation first;
- composer and decision actions fit;
- mode tabs keyboard accessible;
- processing status is polite live content;
- icon buttons have labels;
- modal focus is trapped, Escape closes when not submitting, focus restores;
- all validation errors are associated with controls;
- status/confidence is understandable without color.

## J. Privacy/network scan

Search browser bundle/network/storage/logs for:

- `GEMINI_API_KEY`;
- Google/Gemini endpoint;
- prompt/raw response/token usage;
- Customer messages in query strings;
- AI localStorage/sessionStorage/Redux data;
- historical Job IDs/descriptions.

All must be absent. Normal bearer authorization to the backend is expected.

## Final commands

```text
npm run lint
npm run build
git diff --check
```

Record screenshots under `docs/visual-regression/ai-job-assistant/` and do not
mark a breakpoint passed until it has been inspected.
