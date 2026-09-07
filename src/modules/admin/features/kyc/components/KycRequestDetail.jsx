import React from 'react';
import { FaArrowLeft, FaCheck, FaInbox, FaTimes, FaUser, FaWrench } from 'react-icons/fa';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';
import KycDocumentViewer from './KycDocumentViewer';
import KycHistoryList from './KycHistoryList';

const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Not reviewed';

const KycRequestDetail = ({ selectedId, state, onBack, onRetry, onSelectHistory, onDecision }) => {
  const detail = state.data;
  return (
    <section className="kyc-detail-panel" aria-label="KYC request detail" aria-busy={state.initialLoading || state.refreshing}>
      <button className="mobile-back" type="button" onClick={onBack}><FaArrowLeft /> Back to requests</button>
      {!selectedId && <EmptyState icon={<FaInbox />} message="Select a request to review its documents." />}
      {selectedId && state.initialLoading && <LoadingState message="Loading request details..." />}
      {selectedId && !state.initialLoading && state.error && !detail && <ErrorState message={state.error} onRetry={onRetry} />}
      {detail && !state.initialLoading && (
        <div className="detail-content">
          {state.refreshing && <div className="panel-refreshing" role="status">Refreshing submission...</div>}
          {state.error && <div className="inline-refresh-error" role="alert">{state.error} <button type="button" onClick={onRetry}>Retry</button></div>}
          <div className="detail-header">
            {detail.user.avatar_url ? (
              <img className="applicant-avatar" src={detail.user.avatar_url} alt={`${detail.user.full_name} avatar`} referrerPolicy="no-referrer" />
            ) : (
              <div className="identity-icon">{detail.user.role === 'HANDYMAN' ? <FaWrench /> : <FaUser />}</div>
            )}
            <div>
              <div className="detail-title"><h2>{detail.user.full_name}</h2><StatusBadge status={detail.status} /></div>
              <p>{detail.user.email} · {detail.user.phone_number || 'No phone provided'}</p>
              <small>Submission #{detail.submission_sequence} · {formatDate(detail.submitted_at)}</small>
            </div>
          </div>

          <section className="applicant-information" aria-labelledby="applicant-information-title">
            <h3 id="applicant-information-title">Applicant information</h3>
            <dl>
              <div><dt>Role</dt><dd>{detail.user.role === 'HANDYMAN' ? 'Handyman' : 'Customer'}</dd></div>
              <div><dt>Current KYC status</dt><dd><StatusBadge status={detail.status} /></dd></div>
              <div><dt>Submission</dt><dd>Attempt #{detail.submission_sequence}</dd></div>
              <div><dt>Documents</dt><dd>{detail.document_count} of {detail.required_document_count} required</dd></div>
            </dl>
          </section>

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
