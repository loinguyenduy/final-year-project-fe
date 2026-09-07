const INSPECTION_QUOTE_LIMITS = Object.freeze({
  beforeEvidenceMaxFiles: 5,
  beforeEvidenceMaxSizeBytes: 5 * 1024 * 1024,
  quoteMaxItems: 20,
  quoteMaxAmount: 100000000,
  durationMaxMinutes: 43200,
  reportTextMaxLength: 2000,
  itemNameMaxLength: 150,
  itemDescriptionMaxLength: 500,
  itemUnitMaxLength: 30,
  varianceReasonTextMaxLength: 500,
});

const QUOTE_ITEM_TYPE_OPTIONS = Object.freeze([
  { value: 'LABOUR', label: 'Labour' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'OTHER', label: 'Other' },
]);

const QUOTE_VARIANCE_REASON_OPTIONS = Object.freeze([
  { value: 'ADDITIONAL_DAMAGE_FOUND', label: 'Additional damage was found' },
  { value: 'CUSTOMER_ADDED_SCOPE', label: 'The Customer added work to the scope' },
  { value: 'PARTS_OR_MATERIAL_CHANGED', label: 'Parts or materials changed' },
  { value: 'INITIAL_DESCRIPTION_INCOMPLETE', label: 'The initial description was incomplete' },
  { value: 'ACCESS_CONDITION_DIFFERENT', label: 'Site access conditions were different' },
  { value: 'OTHER', label: 'Another reason' },
]);

const QUOTE_UNIT_SUGGESTIONS = Object.freeze([
  'job',
  'hour',
  'day',
  'item',
  'piece',
  'meter',
  'square meter',
  'set',
]);

const READINESS_LABELS = Object.freeze({
  BEFORE_EVIDENCE_REQUIRED: 'Upload at least one inspection photo.',
  PROBLEM_SUMMARY_REQUIRED: 'Add the inspection problem summary.',
  RECOMMENDED_SOLUTION_REQUIRED: 'Add the recommended solution.',
  ESTIMATED_DURATION_REQUIRED: 'Add the estimated duration.',
  QUOTE_ITEMS_REQUIRED: 'Add at least one quote item.',
  INVALID_QUOTE_AMOUNT: 'The final quote total must be greater than zero.',
  QUOTE_TOTAL_BELOW_HELD_DEPOSIT: 'The final Quote cannot be lower than the deposit already held.',
  ACCEPTED_DATA_INCONSISTENT: 'The accepted Job financial context must be reviewed.',
  VARIANCE_REASON_REQUIRED: 'Explain why the quote differs substantially from the selected Bid.',
  VARIANCE_REASON_TEXT_REQUIRED: 'Add a short explanation for the selected variance reason.',
  INVALID_DRAFT_DATA: 'Save a valid Draft before submitting.',
});

export {
  INSPECTION_QUOTE_LIMITS,
  QUOTE_ITEM_TYPE_OPTIONS,
  QUOTE_UNIT_SUGGESTIONS,
  QUOTE_VARIANCE_REASON_OPTIONS,
  READINESS_LABELS,
};
