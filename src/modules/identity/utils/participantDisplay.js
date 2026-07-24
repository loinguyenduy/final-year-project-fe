const getParticipantInitials = (name, fallback = 'U') => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return `${parts[0][0]}${parts.length > 1 ? parts.at(-1)[0] : ''}`.toUpperCase();
};

const PARTICIPANT_STATUS_LABELS = Object.freeze({
  CLOSED: 'Completed',
  CANCELLED: 'Cancelled',
  EN_ROUTE: 'En Route',
  IN_PROGRESS: 'In Progress',
  PAYMENT_PENDING: 'Payment Pending',
  QUOTE_PENDING: 'Quote Pending',
  CANCELLATION_REVIEW: 'Cancellation Review',
  PENDING_DEPOSIT: 'Deposit Pending',
});

const getParticipantStatusLabel = (status) => PARTICIPANT_STATUS_LABELS[status]
  || String(status || 'Unknown').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const formatRating = (ratingSummary) => {
  if (!ratingSummary?.review_count || ratingSummary.average_rating == null) return 'No reviews yet';
  return String(ratingSummary.average_rating);
};

export { formatRating, getParticipantInitials, getParticipantStatusLabel };
