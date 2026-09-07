const FULL_JOB_PROGRESS_STAGES = Object.freeze([
  { status: 'POSTED', label: 'Posted' },
  { status: 'BIDDING', label: 'Bidding' },
  { status: 'ACCEPTED', label: 'Accepted' },
  { status: 'EN_ROUTE', label: 'En route' },
  { status: 'ARRIVED', label: 'Arrived' },
  { status: 'QUOTE_PENDING', label: 'Quote pending' },
  { status: 'PAYMENT_PENDING', label: 'Payment pending' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'WARRANTY', label: 'Warranty' },
  { status: 'CLOSED', label: 'Completed' },
]);

const PROGRESS_STATUS_SET = new Set(
  FULL_JOB_PROGRESS_STAGES.map((stage) => stage.status),
);

const normalizeStatus = (status) => String(status || '').toUpperCase();

const resolveEffectiveJobProgressStatus = ({
  cancellation,
  currentStatus,
}) => {
  const normalizedStatus = normalizeStatus(currentStatus);

  if (normalizedStatus === 'PENDING_DEPOSIT') return 'BIDDING';

  if (normalizedStatus === 'CANCELLATION_REVIEW' || normalizedStatus === 'CANCELLED') {
    const canonicalPhase = normalizeStatus(cancellation?.cancelled_from_status);
    return PROGRESS_STATUS_SET.has(canonicalPhase) ? canonicalPhase : null;
  }

  return PROGRESS_STATUS_SET.has(normalizedStatus) ? normalizedStatus : null;
};

export {
  FULL_JOB_PROGRESS_STAGES,
  resolveEffectiveJobProgressStatus,
};
