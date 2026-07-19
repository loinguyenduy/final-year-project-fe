import React from 'react';
import { FaArrowLeft, FaCheck, FaInbox, FaTimes, FaUser, FaWrench } from 'react-icons/fa';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';
import KycDocumentViewer from './KycDocumentViewer';
import KycHistoryList from './KycHistoryList';

const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Not reviewed';

const KycRequestDetail = ({ selectedId, state, onBack, onRetry, onSelectHistory, onDecision }) => {
  const detail = state.data;
  return (
    <section className="kyc-detail-panel" aria-label="KYC request detail">
      <button className="mobile-back" type="button" onClick={onBack}><FaArrowLeft /> Back to requests</button>
      {!selectedId && <EmptyState icon={<FaInbox />} message="Select a request to review its documents." />}
      {selectedId && state.loading && <LoadingState message="Loading request details..." />}
      {selectedId && !state.loading && state.error && <ErrorState message={state.error} onRetry={onRetry} />}
      {detail && !state.loading && (
        <div className="detail-content">
          <div className="detail-header">
            <div className="identity-icon">{detail.user.role === 'HANDYMAN' ? <FaWrench /> : <FaUser />}</div>
            <div>
              <div className="detail-title"><h2>{detail.user.full_name}</h2><StatusBadge status={detail.status} /></div>
              <p>{detail.user.email} · {detail.user.phone_number || 'No phone provided'}</p>
              <small>Submission #{detail.submission_sequence} · {formatDate(detail.submitted_at)}</small>
            </div>
          </div>

          {detail.rejection_reason_code && (
            <div className="rejection-summary">
              <strong>{detail.rejection_reason_code.replaceAll('_', ' ')}</strong>
              {detail.rejection_reason_text && <p>{detail.rejection_reason_text}</p>}
            </div>
          )}

          <h3>Submitted documents ({detail.document_count}/{detail.required_document_count})</h3>
          <KycDocumentViewer submissionId={detail.id} documents={detail.documents} />
          <KycHistoryList history={detail.history} currentId={detail.id} onSelect={onSelectHistory} />

          {detail.allowed_actions.some((action) => action === 'APPROVE_KYC' || action === 'REJECT_KYC') && (
            <div className="decision-actions">
              <button className="reject-action" type="button" onClick={() => onDecision('REJECT')}><FaTimes /> Reject</button>
              <button className="approve-action" type="button" onClick={() => onDecision('APPROVE')}><FaCheck /> Approve</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default KycRequestDetail;
