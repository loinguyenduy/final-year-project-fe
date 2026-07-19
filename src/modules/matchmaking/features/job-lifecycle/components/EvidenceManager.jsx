import React, { useId, useMemo, useState } from 'react';
import {
  FaCamera,
  FaCheck,
  FaExclamationTriangle,
  FaLock,
  FaTimes,
  FaTrash,
} from 'react-icons/fa';
import { formatDateTime } from '../utils/jobLifecycleUi';

const UploadState = ({ retryDisabled, upload, onRemove, onRetry }) => {
  const labels = {
    selected: 'Selected',
    uploading: `Uploading ${upload.progress}%`,
    processing: 'Processing on server',
    uploaded: 'Uploaded',
    failed: 'Upload failed',
  };
  return (
    <article className={`evidence-card evidence-card--upload evidence-card--${upload.state}`}>
      <img src={upload.previewUrl} alt="" />
      <div className="evidence-card__overlay">
        {upload.state === 'uploaded' && <FaCheck aria-hidden="true" />}
        {upload.state === 'failed' && <FaExclamationTriangle aria-hidden="true" />}
        <strong>{labels[upload.state]}</strong>
        {upload.state === 'uploading' && (
          <span className="evidence-card__progress" aria-hidden="true">
            <span style={{ width: `${upload.progress}%` }} />
          </span>
        )}
        {upload.error && <small>{upload.error}</small>}
        {upload.state === 'failed' && (
          <span className="evidence-card__failed-actions">
            <button type="button" onClick={() => onRetry(upload.id)} disabled={retryDisabled}>
              Retry
            </button>
            <button type="button" onClick={() => onRemove(upload.id)}>
              <FaTimes aria-hidden="true" /> Remove
            </button>
          </span>
        )}
      </div>
    </article>
  );
};

const EvidenceManager = ({
  canDelete,
  canUpload,
  countMode = 'all',
  deletingId,
  description,
  emptyCopy = 'No evidence photos have been added yet.',
  evidence,
  eyebrow = 'Evidence',
  loadError,
  loading,
  maxFiles = 5,
  onDelete,
  onOpenImage,
  onRemoveFailedUpload,
  onRetryUpload,
  onUpload,
  title,
  uploads,
}) => {
  const inputId = useId();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const unlockedCount = useMemo(
    () => evidence.filter((item) => !item.is_locked).length,
    [evidence],
  );
  const serverCount = countMode === 'unlocked' ? unlockedCount : evidence.length;
  const activeUploadCount = uploads.filter(
    (item) => !['failed', 'uploaded'].includes(item.state),
  ).length;
  const limitReached = serverCount + activeUploadCount >= maxFiles;
  const uploadedEvidenceIds = new Set(
    uploads
      .filter((item) => item.state === 'uploaded' && item.evidenceId)
      .map((item) => item.evidenceId),
  );
  const visibleEvidence = evidence.filter((item) => !uploadedEvidenceIds.has(item.id));
  const uploadBusy = uploads.some((item) => (
    ['selected', 'uploading', 'processing'].includes(item.state)
  ));

  return (
    <section className="inspection-section evidence-manager" aria-labelledby={inputId}>
      <div className="inspection-section__header">
        <div>
          <span className="lifecycle-stage__eyebrow">{eyebrow}</span>
          <h3 id={inputId}>{title}</h3>
          <p>{description}</p>
        </div>
        <span className="inspection-section__count">
          {serverCount}/{maxFiles}{countMode === 'unlocked' ? ' new' : ''}
        </span>
      </div>

      {canUpload && (
        <div className="evidence-upload">
          <input
            id={`${inputId}-input`}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            disabled={limitReached || uploadBusy}
            onChange={(event) => {
              void onUpload(event.target.files);
              event.target.value = '';
            }}
          />
          <label htmlFor={`${inputId}-input`} aria-disabled={limitReached || uploadBusy}>
            <FaCamera aria-hidden="true" />
            <span>
              <strong>
                {limitReached
                  ? 'Photo limit reached for this attempt'
                  : uploadBusy
                    ? 'Uploading selected photos'
                    : 'Add evidence photos'}
              </strong>
              <small>JPEG or PNG, up to 5 MB each. Files upload sequentially.</small>
            </span>
          </label>
        </div>
      )}

      {loading && <p className="inspection-section__status">Loading evidence photos…</p>}
      {loadError && <div className="lifecycle-notice lifecycle-notice--danger">{loadError}</div>}

      {(evidence.length > 0 || uploads.length > 0) && (
        <div className="evidence-grid">
          {visibleEvidence.map((item, index) => {
            const itemDeletable = canDelete && item.deletable !== false && !item.is_locked;
            return (
              <article className="evidence-card" key={item.id}>
                <button
                  type="button"
                  className="evidence-card__image"
                  onClick={() => onOpenImage?.(item.media_url)}
                >
                  <img src={item.media_url} alt={`${title} ${index + 1}`} />
                </button>
                <div className="evidence-card__meta">
                  <span>{formatDateTime(item.uploaded_at)}</span>
                  {item.is_locked && (
                    <span className="evidence-card__locked"><FaLock aria-hidden="true" /> Locked</span>
                  )}
                  {itemDeletable && (
                    confirmDeleteId === item.id ? (
                      <span className="evidence-card__confirm">
                        <button
                          type="button"
                          onClick={() => {
                            void onDelete(item.id).then((response) => {
                              if (response) setConfirmDeleteId(null);
                            });
                          }}
                          disabled={deletingId === item.id}
                        >
                          Delete
                        </button>
                        <button type="button" onClick={() => setConfirmDeleteId(null)}>Keep</button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="evidence-card__delete"
                        onClick={() => setConfirmDeleteId(item.id)}
                        aria-label={`Delete ${title.toLowerCase()} ${index + 1}`}
                      >
                        <FaTrash aria-hidden="true" />
                      </button>
                    )
                  )}
                </div>
              </article>
            );
          })}
          {uploads.map((upload) => (
            <UploadState
              key={upload.id}
              upload={upload}
              onRemove={onRemoveFailedUpload}
              onRetry={onRetryUpload}
              retryDisabled={uploadBusy}
            />
          ))}
        </div>
      )}

      {!loading && evidence.length === 0 && uploads.length === 0 && (
        <div className="inspection-empty">
          <FaCamera aria-hidden="true" />
          <span>{emptyCopy}</span>
        </div>
      )}
    </section>
  );
};

export default EvidenceManager;
