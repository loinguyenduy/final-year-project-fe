import React from 'react';
import { FaChevronLeft, FaChevronRight, FaInbox, FaUser, FaWrench } from 'react-icons/fa';
import { EmptyState, ErrorState, LoadingState, StatusBadge } from '../../../components/AdminStates';

const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Not reviewed';

const KycRequestList = ({ state, selectedId, page, onSelect, onPageChange, onRetry }) => (
  <section className="kyc-list-panel" aria-label="KYC request list">
    {state.loading && <LoadingState message="Loading KYC requests..." />}
    {!state.loading && state.error && <ErrorState message={state.error} onRetry={onRetry} />}
    {!state.loading && !state.error && state.items.length === 0 && (
      <EmptyState icon={<FaInbox />} message="No KYC requests match these filters." />
    )}
    {!state.loading && !state.error && state.items.map((item) => (
      <button
        key={item.id}
        type="button"
        className={`kyc-card ${selectedId === item.id ? 'active' : ''}`}
        onClick={() => onSelect(item.id)}
      >
        <span className="card-heading"><strong>{item.user.full_name}</strong><StatusBadge status={item.status} /></span>
        <span className="card-meta">
          {item.user.role === 'HANDYMAN' ? <FaWrench /> : <FaUser />} {item.user.role} · Submission #{item.submission_sequence}
        </span>
        <span className="card-meta">
          {item.document_count}/{item.required_document_count} documents · {formatDate(item.submitted_at)}
        </span>
      </button>
    ))}
    {state.pagination && state.pagination.total_pages > 1 && (
      <div className="pagination-bar">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page"><FaChevronLeft /></button>
        <span>Page {page} of {state.pagination.total_pages}</span>
        <button type="button" disabled={page >= state.pagination.total_pages} onClick={() => onPageChange(page + 1)} aria-label="Next page"><FaChevronRight /></button>
      </div>
    )}
  </section>
);

export default KycRequestList;
