import React, { useState } from 'react';
import { FaChevronDown, FaClock, FaImage } from 'react-icons/fa';
import { formatDateTime } from '../utils/jobLifecycleUi';
import { getParticipantStatusLabel as formatStatus } from '../../../../identity/utils/participantDisplay';

const SnapshotGallery = ({ evidence, loading, onOpenImage }) => {
  if (loading) return <p className="inspection-section__status">Loading locked evidence…</p>;
  if (!evidence) return null;
  if (!evidence.length) return <p className="lifecycle-history__empty">No snapshot photos.</p>;
  return (
    <div className="lifecycle-history__gallery">
      {evidence.map((item, index) => (
        <button type="button" key={item.id} onClick={() => onOpenImage?.(item.media_url)}>
          <img src={item.media_url} alt={`Locked evidence ${index + 1}`} />
          <span><FaImage aria-hidden="true" /> View</span>
        </button>
      ))}
    </div>
  );
};

const LifecycleHistoryAccordion = ({
  allowEvidence = false,
  emptyCopy,
  evidenceByItem = {},
  evidenceLoadingKey,
  evidenceLoadingPrefix = '',
  items,
  kind = 'request',
  onLoadEvidence,
  onOpenImage,
  title,
}) => {
  const [openId, setOpenId] = useState(null);

  if (!items?.length) {
    return emptyCopy ? <p className="lifecycle-history__empty">{emptyCopy}</p> : null;
  }

  return (
    <section className="lifecycle-history" aria-label={title}>
      <h3>{title}</h3>
      {items.map((item) => {
        const open = openId === item.id;
        const isClaim = kind === 'claim';
        const sequence = item.request_sequence ? `Request #${item.request_sequence}` : 'Warranty claim';
        const occurredAt = item.requested_at || item.submitted_at || item.created_at;
        return (
          <article className="lifecycle-history__item" key={item.id}>
            <button
              type="button"
              className="lifecycle-history__toggle"
              aria-expanded={open}
              onClick={() => {
                const nextOpen = !open;
                setOpenId(nextOpen ? item.id : null);
                if (nextOpen && allowEvidence && !evidenceByItem[item.id]) {
                  void onLoadEvidence?.(item.id);
                }
              }}
            >
              <span>
                <strong>{sequence}</strong>
                <small><FaClock aria-hidden="true" /> {formatDateTime(occurredAt)}</small>
              </span>
              <span className={`lifecycle-history__status lifecycle-history__status--${String(item.status || '').toLowerCase()}`}>
                {formatStatus(item.status)}
              </span>
              <FaChevronDown className={open ? 'is-open' : ''} aria-hidden="true" />
            </button>
            {open && (
              <div className="lifecycle-history__body">
                <dl className="lifecycle-request-facts">
                  {isClaim ? (
                    <>
                      <div><dt>Reason</dt><dd>{formatStatus(item.reason)}</dd></div>
                      <div><dt>Description</dt><dd>{item.description || 'No description provided'}</dd></div>
                      <div><dt>Reviewed</dt><dd>{formatDateTime(item.reviewed_at, 'Not reviewed yet')}</dd></div>
                      <div><dt>Resolved</dt><dd>{formatDateTime(item.resolved_at, 'Not resolved yet')}</dd></div>
                    </>
                  ) : (
                    <>
                      <div><dt>Completion note</dt><dd>{item.completion_note || 'No note provided'}</dd></div>
                      <div><dt>Responded</dt><dd>{formatDateTime(item.responded_at, 'Waiting for response')}</dd></div>
                      {item.rejection_reason && (
                        <div><dt>Rejection reason</dt><dd>{formatStatus(item.rejection_reason)}</dd></div>
                      )}
                      {item.rejection_note && (
                        <div><dt>Rejection note</dt><dd>{item.rejection_note}</dd></div>
                      )}
                    </>
                  )}
                </dl>
                {allowEvidence && (
                  <SnapshotGallery
                    evidence={evidenceByItem[item.id]}
                    loading={evidenceLoadingKey === `${evidenceLoadingPrefix}${item.id}`}
                    onOpenImage={onOpenImage}
                  />
                )}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
};

export default LifecycleHistoryAccordion;
