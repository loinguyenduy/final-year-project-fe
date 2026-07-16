import React, { useId, useState } from 'react';
import { FaCamera, FaCheck, FaExclamationTriangle, FaTimes, FaTrash } from 'react-icons/fa';
import { INSPECTION_QUOTE_LIMITS } from '../constants/inspectionQuote.constants';
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
            <button
              type="button"
              onClick={() => onRetry(upload.id)}
              disabled={retryDisabled}
            >
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

const BeforeEvidenceManager = ({
  canDelete,
  canUpload,
  deletingId,
  evidence,
  loadError,
  loading,
  onDelete,
  onOpenImage,
  onRemoveFailedUpload,
  onRetryUpload,
  onUpload,
  uploads,
}) => {
  const inputId = useId();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const totalCount = evidence.length + uploads.filter(
    (item) => !['failed', 'uploaded'].includes(item.state),
  ).length;
  const limitReached = totalCount >= INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxFiles;
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
    <section className="inspection-section" aria-labelledby="before-evidence-title">
      <div className="inspection-section__header">
        <div>
          <span className="lifecycle-stage__eyebrow">Before evidence</span>
          <h3 id="before-evidence-title">Inspection photos</h3>
          <p>
            Add clear JPEG or PNG photos before submitting the Quote.
            Each photo is uploaded and processed separately.
          </p>
        </div>
        <span className="inspection-section__count">
          {evidence.length}/{INSPECTION_QUOTE_LIMITS.beforeEvidenceMaxFiles}
        </span>
      </div>

      {canUpload && (
        <div className="evidence-upload">
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            disabled={limitReached || uploadBusy}
            onChange={(event) => {
              void onUpload(event.target.files);
              event.target.value = '';
            }}
          />
          <label htmlFor={inputId} aria-disabled={limitReached || uploadBusy}>
            <FaCamera aria-hidden="true" />
            <span>
              <strong>
                {limitReached
                  ? 'Photo limit reached'
                  : uploadBusy
                    ? 'Uploading selected photos'
                    : 'Add inspection photos'}
              </strong>
              <small>JPEG or PNG, up to 5 MB each. Files are uploaded sequentially.</small>
            </span>
          </label>
        </div>
      )}

      {loading && <p className="inspection-section__status">Loading inspection photos…</p>}
      {loadError && <div className="lifecycle-notice lifecycle-notice--danger">{loadError}</div>}

      {(evidence.length > 0 || uploads.length > 0) && (
        <div className="evidence-grid">
          {visibleEvidence.map((item, index) => (
            <article className="evidence-card" key={item.id}>
              <button
                type="button"
                className="evidence-card__image"
                onClick={() => onOpenImage?.(item.media_url)}
              >
                <img src={item.media_url} alt={`Inspection evidence ${index + 1}`} />
              </button>
              <div className="evidence-card__meta">
                <span>{formatDateTime(item.uploaded_at)}</span>
                {canDelete && (
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
                      aria-label={`Delete inspection evidence ${index + 1}`}
                    >
                      <FaTrash aria-hidden="true" />
                    </button>
                  )
                )}
              </div>
            </article>
          ))}
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
          <span>No inspection photos have been added yet.</span>
        </div>
      )}
    </section>
  );
};

export default BeforeEvidenceManager;
