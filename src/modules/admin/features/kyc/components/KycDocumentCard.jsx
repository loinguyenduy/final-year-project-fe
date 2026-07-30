import React from 'react';
import { FaEye, FaFileImage } from 'react-icons/fa';
import { getDocumentLabel } from '../utils/kycDocument.utils';

const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Upload time unavailable';

const KycDocumentCard = ({ document, loading, onView }) => (
  <article className="kyc-document-card">
    <div className="document-icon" aria-hidden="true"><FaFileImage /></div>
    <div className="document-description">
      <strong>{getDocumentLabel(document.document_type)}</strong>
      <small>{document.mime_type || 'Protected image'} · {formatDate(document.uploaded_at)}</small>
    </div>
    <button
      type="button"
      onClick={() => onView(document)}
      disabled={!document.can_view || loading}
      aria-label={`View ${getDocumentLabel(document.document_type)}`}
    >
      <FaEye aria-hidden="true" />
      {loading ? 'Opening...' : document.can_view ? 'View image' : 'Unavailable'}
    </button>
  </article>
);

export default KycDocumentCard;
