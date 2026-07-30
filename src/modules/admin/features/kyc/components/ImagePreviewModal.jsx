import React from 'react';
import { FaExternalLinkAlt, FaRedo, FaTimes } from 'react-icons/fa';
import AdminModal from '../../../components/AdminModal';
import { getDocumentLabel } from '../utils/kycDocument.utils';

const ImagePreviewModal = ({
  document,
  access,
  accessLoading,
  imageLoading,
  error,
  onClose,
  onImageError,
  onImageLoad,
  onRetry
}) => {
  if (!document) return null;
  const title = getDocumentLabel(document.document_type);

  return (
    <AdminModal
      open
      titleId="kyc-image-preview-title"
      onClose={onClose}
      closeOnBackdrop
      className="kyc-image-modal"
    >
      <header className="image-modal-header">
        <div>
          <span>Protected KYC document</span>
          <h2 id="kyc-image-preview-title">{title}</h2>
        </div>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close image preview"><FaTimes /></button>
      </header>

      <div className="image-modal-stage">
        {(accessLoading || imageLoading) && !error && (
          <div className="image-loading" role="status">
            <span className="spinner-border" aria-hidden="true" />
            <p>{accessLoading ? 'Requesting protected access...' : 'Loading image...'}</p>
          </div>
        )}
        {error && (
          <div className="image-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={onRetry}><FaRedo /> Retry</button>
          </div>
        )}
        {access?.url && !error && (
          <img
            className={imageLoading ? 'is-loading' : ''}
            src={access.url}
            alt={`${title} KYC document`}
            referrerPolicy="no-referrer"
            onLoad={onImageLoad}
            onError={onImageError}
          />
        )}
      </div>

      <footer className="image-modal-footer">
        <small>{document.uploaded_at ? `Uploaded ${new Date(document.uploaded_at).toLocaleString()}` : 'Protected participant document'}</small>
        {access?.url && !error && (
          <a href={access.url} target="_blank" rel="noreferrer"><FaExternalLinkAlt /> Open original</a>
        )}
      </footer>
    </AdminModal>
  );
};

export default ImagePreviewModal;
