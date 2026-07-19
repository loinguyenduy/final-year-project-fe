const ARRIVAL_REJECTION_OPTIONS = Object.freeze([
  { value: 'HANDYMAN_NOT_PRESENT', label: 'The handyman is not at the location' },
  { value: 'WRONG_LOCATION', label: 'The handyman is at the wrong location' },
  { value: 'ARRIVAL_REQUEST_SENT_TOO_EARLY', label: 'The arrival request was sent too early' },
  { value: 'OTHER', label: 'Another reason' },
]);

const ARRIVAL_REJECTION_LABELS = Object.freeze({
  HANDYMAN_NOT_PRESENT: 'The customer could not find you at the service location.',
  WRONG_LOCATION: 'The customer reported that you were at the wrong location.',
  ARRIVAL_REQUEST_SENT_TOO_EARLY: 'The customer reported that the request was sent too early.',
  OTHER: 'The customer provided another reason.',
});

const CANCELLATION_REASON_DEFINITIONS = Object.freeze({
  CUSTOMER: Object.freeze({
    NO_LONGER_NEEDED: { label: 'The service is no longer needed', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'CUSTOMER_FAULT' },
    WRONG_JOB_INFORMATION: { label: 'The job information is incorrect', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'CUSTOMER_FAULT' },
    SCOPE_CHANGED: { label: 'The scope of work has changed', phases: ['ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'CUSTOMER_FAULT' },
    FINAL_QUOTE_TOO_HIGH: { label: 'The final Quote is too high', phases: ['QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'NEUTRAL_QUOTE_REJECTION' },
    FINAL_QUOTE_NOT_ACCEPTABLE: { label: 'The final Quote is not acceptable', phases: ['QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'NEUTRAL_QUOTE_REJECTION' },
    HANDYMAN_NOT_PROGRESSING: { label: 'The handyman is not progressing', phases: ['EN_ROUTE', 'ARRIVED'], mode: 'REVIEW', classification: 'DISPUTED' },
    HANDYMAN_NOT_PRESENT: { label: 'The handyman is not present', phases: ['EN_ROUTE'], mode: 'REVIEW', classification: 'DISPUTED' },
    HANDYMAN_UNPROFESSIONAL: { label: 'The handyman acted unprofessionally', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'REVIEW', classification: 'DISPUTED' },
    EXTERNAL_CIRCUMSTANCE: { label: 'External circumstances', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'NEUTRAL' },
    MUTUAL_AGREEMENT: { label: 'Both parties agree to cancel', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'MUTUAL', classification: 'NEUTRAL' },
    OTHER: { label: 'Another reason', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'REVIEW', classification: 'DISPUTED' },
  }),
  HANDYMAN: Object.freeze({
    JOB_OUTSIDE_SKILL: { label: 'The job is outside my skills', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'HANDYMAN_FAULT' },
    EQUIPMENT_OR_PART_UNAVAILABLE: { label: 'Required equipment or parts are unavailable', phases: ['ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'NEUTRAL' },
    CUSTOMER_UNAVAILABLE: { label: 'The customer is unavailable', phases: ['EN_ROUTE', 'ARRIVED'], mode: 'REVIEW', classification: 'DISPUTED' },
    WRONG_ADDRESS: { label: 'The service address is incorrect', phases: ['EN_ROUTE', 'ARRIVED'], mode: 'REVIEW', classification: 'DISPUTED' },
    CUSTOMER_REFUSED_ACCESS: { label: 'The customer refused access', phases: ['EN_ROUTE', 'ARRIVED'], mode: 'REVIEW', classification: 'DISPUTED' },
    UNSAFE_WORKING_CONDITION: { label: 'The working conditions are unsafe', phases: ['ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'REVIEW', classification: 'DISPUTED' },
    JOB_SCOPE_MISMATCH: { label: 'The actual work does not match the job description', phases: ['ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'REVIEW', classification: 'DISPUTED' },
    CUSTOMER_CHANGED_SCOPE: { label: 'The customer changed the scope of work', phases: ['ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'REVIEW', classification: 'DISPUTED' },
    EXTERNAL_CIRCUMSTANCE: { label: 'External circumstances', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'AUTO', classification: 'NEUTRAL' },
    MUTUAL_AGREEMENT: { label: 'Both parties agree to cancel', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'MUTUAL', classification: 'NEUTRAL' },
    OTHER: { label: 'Another reason', phases: ['EN_ROUTE', 'ARRIVED', 'QUOTE_PENDING', 'PAYMENT_PENDING'], mode: 'REVIEW', classification: 'DISPUTED' },
  }),
});

const CUSTOMER_PERCENT = Object.freeze({
  EN_ROUTE: Object.freeze({ CUSTOMER_FAULT: 50, HANDYMAN_FAULT: 100, NEUTRAL: 100 }),
  ARRIVED: Object.freeze({ CUSTOMER_FAULT: 30, HANDYMAN_FAULT: 100, NEUTRAL: 50 }),
  QUOTE_PENDING: Object.freeze({
    CUSTOMER_FAULT: 30,
    HANDYMAN_FAULT: 100,
    NEUTRAL: 50,
    NEUTRAL_QUOTE_REJECTION: 70,
  }),
  PAYMENT_PENDING: Object.freeze({
    CUSTOMER_FAULT: 30,
    HANDYMAN_FAULT: 100,
    NEUTRAL: 50,
    NEUTRAL_QUOTE_REJECTION: 70,
  }),
});

const LIFECYCLE_ERROR_MESSAGES = Object.freeze({
  HANDYMAN_LOCATION_REQUIRED: 'Your current location is required for this action.',
  INVALID_COORDINATES: 'The device returned an invalid location. Please try again.',
  INVALID_JOB_STATUS: 'The job status changed while this action was open.',
  JOB_NOT_EN_ROUTE: 'This job is no longer in the En route stage.',
  JOB_ALREADY_ARRIVED: 'This job has already moved to the Arrived stage.',
  ARRIVAL_REQUEST_COOLDOWN: 'Please wait before sending another arrival request.',
  ARRIVAL_REVIEW_REQUIRED: 'No more arrival requests can be sent in this acceptance cycle.',
  ARRIVAL_REQUEST_NOT_FOUND: 'This arrival request is no longer available.',
  ARRIVAL_REQUEST_NOT_PENDING: 'This arrival request has already been handled.',
  ACCEPTANCE_CYCLE_INCONSISTENT: 'The active job assignment changed. The latest details will be loaded.',
  ACCEPTED_DATA_INCONSISTENT: 'The accepted job data is incomplete. Please refresh and try again.',
  PARTICIPANT_INACTIVE: 'One of the job participants is no longer active.',
  FORBIDDEN_JOB_ACCESS: 'You do not have access to this job workspace.',
  JOB_NOT_FOUND: 'This job could not be found.',
  CANCELLATION_ALREADY_ACTIVE: 'A cancellation request is already being processed.',
  CANCELLATION_ALREADY_EXISTS: 'This cancellation request already exists.',
  CANCELLATION_ALREADY_RESOLVED: 'This cancellation request has already been resolved.',
  CANCELLATION_NOT_FOUND: 'This cancellation request is no longer available.',
  CANCELLATION_NOT_ALLOWED_IN_CURRENT_STATUS: 'Cancellation is not available at the current job stage.',
  CANCELLATION_RESPONSE_CONFLICT: 'This cancellation request was answered from another session.',
  CANCELLATION_COUNTERPARTY_REQUIRED: 'Only the other participant can answer this cancellation request.',
  INVALID_CANCELLATION_STATUS: 'This cancellation request is no longer waiting for a response.',
  DEPOSIT_NOT_HELD: 'The deposit is not currently being held. No cancellation funds were moved.',
  DEPOSIT_ALREADY_REFUNDED: 'The deposit has already been refunded.',
  DEPOSIT_ALREADY_RELEASED: 'The deposit has already been released.',
  CANCELLATION_POLICY_NOT_CONFIGURED: 'The cancellation policy is temporarily unavailable.',
  CANCELLATION_PAYOUT_INCONSISTENT: 'The cancellation payout could not be verified. No funds were moved.',
  CANCELLATION_WALLET_BLOCKED: 'A wallet required for cancellation is currently unavailable.',
  CUSTOMER_WALLET_NOT_FOUND: 'The customer wallet is unavailable. No funds were moved.',
  HANDYMAN_WALLET_NOT_FOUND: 'The handyman wallet is unavailable. No funds were moved.',
  SYSTEM_ESCROW_WALLET_NOT_FOUND: 'The escrow wallet is unavailable. No funds were moved.',
  ESCROW_INSUFFICIENT_BALANCE: 'The escrow balance could not be verified. No funds were moved.',
  INSUFFICIENT_BALANCE: 'The available balance is insufficient.',
  IMAGE_REQUIRED: 'Choose a JPEG or PNG image to upload.',
  INVALID_UPLOAD_PAYLOAD: 'The selected image could not be processed.',
  INVALID_IMAGE_TYPE: 'Only JPEG and PNG inspection photos are supported.',
  IMAGE_TOO_LARGE: 'Each inspection photo must be 5 MB or smaller.',
  BEFORE_EVIDENCE_LIMIT_REACHED: 'The maximum number of inspection photos has been reached.',
  EVIDENCE_LOCKED: 'Inspection photos are locked after Quote submission.',
  EVIDENCE_NOT_FOUND: 'This inspection photo is no longer available.',
  CLOUDINARY_UPLOAD_FAILED: 'The photo service could not complete this upload.',
  JOB_NOT_ARRIVED: 'The Job is no longer in the Arrived stage.',
  NOT_SELECTED_HANDYMAN: 'Only the selected Handyman can manage this inspection.',
  QUOTE_NOT_FOUND: 'The current Quote is not available.',
  QUOTE_NOT_DRAFT: 'The Quote is no longer editable.',
  QUOTE_LIFECYCLE_INCONSISTENT: 'The Quote no longer matches the current Job lifecycle.',
  QUOTE_RESPONSE_CONFLICT: 'The Quote response was already finalized in another session.',
  QUOTE_LIFECYCLE_CONFLICT: 'The Quote is no longer waiting for this response.',
  QUOTE_NOT_ACCEPTED: 'The Quote must be accepted before payment.',
  FINANCIAL_DATA_INCONSISTENT: 'The Job payment data could not be verified. No funds were moved.',
  QUOTE_TOTAL_BELOW_HELD_DEPOSIT: 'The final Quote cannot be lower than the deposit already held.',
  PAYMENT_WALLET_BLOCKED: 'A wallet required for payment is currently unavailable.',
  PAYMENT_STATE_INCONSISTENT: 'The payment state could not be verified. No duplicate payment was created.',
  PAYMENT_SUMMARY_NOT_FOUND: 'The payment summary is not available.',
  CONTRACT_NOT_FOUND: 'The active Contract is not available yet.',
  JOB_NOT_IN_PROGRESS: 'The Job is no longer in the In progress stage.',
  COMPLETION_EVIDENCE_LOCKED: 'This evidence photo is locked in a submitted snapshot.',
  EVIDENCE_LIMIT_REACHED: 'The maximum number of new photos for this attempt has been reached.',
  COMPLETION_REQUEST_NOT_FOUND: 'This completion request is no longer available.',
  COMPLETION_REQUEST_NOT_PENDING: 'This completion request has already been handled.',
  COMPLETION_REQUEST_ALREADY_PENDING: 'A completion request is already waiting for the Customer.',
  NEW_COMPLETION_EVIDENCE_REQUIRED: 'Add at least one new photo before sending another request.',
  DURING_EVIDENCE_REQUIRED: 'Add at least one During Evidence photo.',
  AFTER_EVIDENCE_REQUIRED: 'Add at least one After Evidence photo.',
  JOB_NOT_IN_WARRANTY: 'The Job is no longer in the Warranty stage.',
  WARRANTY_NOT_ACTIVE: 'The Warranty is no longer active.',
  WARRANTY_CLAIM_WINDOW_EXPIRED: 'The Warranty Claim window has ended.',
  WARRANTY_CLAIM_ALREADY_ACTIVE: 'An active Warranty Claim already exists.',
  WARRANTY_REWORK_NOT_REQUIRED: 'Warranty rework is not currently required.',
  WARRANTY_COMPLETION_REQUEST_NOT_FOUND: 'This Warranty completion request is no longer available.',
  WARRANTY_COMPLETION_REQUEST_NOT_PENDING: 'This Warranty completion request has already been handled.',
  WARRANTY_ALREADY_RELEASED: 'The Warranty Reserve has already been released.',
  BLOCKING_DISPUTE_ACTIVE: 'A blocking cancellation or dispute must be resolved first.',
  ESCROW_AMOUNT_INSUFFICIENT: 'The escrow balance could not cover the canonical settlement.',
  SETTLEMENT_WALLET_BLOCKED: 'A wallet required for settlement is currently unavailable.',
  SETTLEMENT_WALLET_NOT_FOUND: 'A wallet required for settlement could not be found.',
  QUOTE_DRAFT_REVISION_CONFLICT: 'This Draft changed in another session. The latest version will be loaded.',
  INVALID_DRAFT_REVISION: 'The saved Draft revision is invalid. Refresh and try again.',
  INVALID_QUOTE_ITEM: 'Review the Quote items and try again.',
  INVALID_QUOTE_AMOUNT: 'Review the Quote amounts.',
  INVALID_ESTIMATED_DURATION: 'Estimated duration is outside the allowed range.',
  INVALID_WARRANTY_DAYS: 'Warranty must be between 0 and 3,650 days.',
  BEFORE_EVIDENCE_REQUIRED: 'Upload at least one inspection photo before submitting.',
  PROBLEM_SUMMARY_REQUIRED: 'Add and save the problem summary before submitting.',
  RECOMMENDED_SOLUTION_REQUIRED: 'Add and save the recommended solution before submitting.',
  ESTIMATED_DURATION_REQUIRED: 'Add and save the estimated duration before submitting.',
  WARRANTY_DAYS_REQUIRED: 'Set and save the warranty period before submitting.',
  QUOTE_ITEMS_REQUIRED: 'Add and save at least one Quote item before submitting.',
  VARIANCE_REASON_REQUIRED: 'Select and save a variance reason before submitting.',
  VARIANCE_REASON_TEXT_REQUIRED: 'Add and save the variance explanation before submitting.',
  VALIDATION_ERROR: 'Please review the information and try again.',
  INTERNAL_SERVER_ERROR: 'The request could not be completed. Please try again.',
});

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return 'Not available';
  try {
    const normalized = typeof value === 'bigint' ? value : BigInt(String(value).split('.')[0]);
    return `${new Intl.NumberFormat('en-US').format(normalized)} VND`;
  } catch {
    return 'Not available';
  }
};

const formatDateTime = (value, fallback = 'Not available') => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDistance = (meters) => {
  const value = Number(meters);
  if (!Number.isFinite(value) || value < 0) return 'Not available';
  if (value < 1000) return `${Math.round(value)} m`;
  return `${(value / 1000).toLocaleString('en-US', { maximumFractionDigits: 2 })} km`;
};

const formatEta = (minutes) => {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value < 0) return 'Not available';
  const rounded = Math.round(value);
  if (rounded < 60) return `About ${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return remainder ? `About ${hours} hr ${remainder} min` : `About ${hours} hr`;
};

const formatAccuracy = (meters) => {
  const value = Number(meters);
  return Number.isFinite(value) && value >= 0 ? `About ±${Math.round(value)} m` : 'Not available';
};

const getFriendlyLifecycleError = (
  error,
  fallback = 'The action could not be completed. Please try again.',
) => {
  const envelope = error?.response?.data || error || {};
  return LIFECYCLE_ERROR_MESSAGES[envelope.code] || envelope.EM || envelope.message || fallback;
};

const getArrivalRejectionLabel = (reason) => (
  ARRIVAL_REJECTION_LABELS[reason] || 'The customer did not confirm the arrival request.'
);

const getLocationWarning = (warning) => {
  if (warning === 'FAR_FROM_JOB') {
    return {
      tone: 'warning',
      title: 'The recorded location is far from the service address',
      message: 'Check the address or contact the customer before continuing.',
    };
  }
  if (warning === 'LOCATION_UNAVAILABLE') {
    return {
      tone: 'neutral',
      title: 'Distance could not be calculated',
      message: 'The request was still sent and is waiting for customer confirmation.',
    };
  }
  return {
    tone: 'success',
    title: 'Location recorded',
    message: 'The request is waiting for customer confirmation.',
  };
};

const getCancellationReasonOptions = (role, phase) => {
  const definitions = CANCELLATION_REASON_DEFINITIONS[String(role || '').toUpperCase()] || {};
  return Object.entries(definitions)
    .filter(([reason, definition]) => (
      definition.phases.includes(phase)
      && !(String(role || '').toUpperCase() === 'CUSTOMER'
        && phase === 'QUOTE_PENDING'
        && ['FINAL_QUOTE_TOO_HIGH', 'FINAL_QUOTE_NOT_ACCEPTABLE'].includes(reason))
    ))
    .map(([value, definition]) => ({ value, ...definition }));
};

const getCancellationReasonLabel = (role, reason) => (
  CANCELLATION_REASON_DEFINITIONS[String(role || '').toUpperCase()]?.[reason]?.label
  || 'Cancellation request'
);

const getRoleLabel = (role) => {
  const normalized = String(role || '').toUpperCase();
  if (normalized === 'HANDYMAN') return 'Handyman';
  if (normalized === 'CUSTOMER') return 'Customer';
  return 'Participant';
};

const getCancellationPreview = ({ role, phase, reason, depositAmount }) => {
  const definition = CANCELLATION_REASON_DEFINITIONS[String(role || '').toUpperCase()]?.[reason];
  if (!definition) return null;
  if (definition.mode === 'REVIEW') {
    return {
      mode: 'REVIEW',
      message: 'The request will require review. The deposit remains held and chat stays active.',
      customerAmount: null,
      handymanAmount: null,
    };
  }

  const customerPercent = CUSTOMER_PERCENT[phase]?.[definition.classification];
  if (!Number.isInteger(customerPercent)) {
    return {
      mode: definition.mode,
      message: 'The backend will confirm the final financial result.',
    };
  }

  try {
    const deposit = BigInt(String(depositAmount).split('.')[0]);
    const customerAmount = ((deposit * BigInt(customerPercent)) + 50n) / 100n;
    const handymanAmount = deposit - customerAmount;
    return {
      mode: definition.mode,
      message: definition.mode === 'MUTUAL'
        ? 'The job is cancelled under the neutral policy only after the other participant confirms.'
        : 'The job will be cancelled immediately under the current policy.',
      customerPercent,
      handymanPercent: 100 - customerPercent,
      customerAmount: customerAmount.toString(),
      handymanAmount: handymanAmount.toString(),
    };
  } catch {
    return {
      mode: definition.mode,
      message: 'The backend will confirm the final financial result.',
    };
  }
};

export {
  ARRIVAL_REJECTION_OPTIONS,
  CANCELLATION_REASON_DEFINITIONS,
  formatAccuracy,
  formatCurrency,
  formatDateTime,
  formatDistance,
  formatEta,
  getArrivalRejectionLabel,
  getCancellationPreview,
  getCancellationReasonLabel,
  getCancellationReasonOptions,
  getFriendlyLifecycleError,
  getLocationWarning,
  getRoleLabel,
};
