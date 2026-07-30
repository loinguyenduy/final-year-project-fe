import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchKycDocumentAccess } from '../../../services/adminKycService';
import ImagePreviewModal from './ImagePreviewModal';
import KycDocumentCard from './KycDocumentCard';

const ACCESS_EXPIRY_BUFFER_MS = 15_000;

const KycDocumentViewer = ({ submissionId, documents = [] }) => {
  const [selected, setSelected] = useState(null);
  const [access, setAccess] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');
  const accessCacheRef = useRef(new Map());
  const requestRef = useRef(0);

  useEffect(() => {
    requestRef.current += 1;
    accessCacheRef.current.clear();
    setSelected(null);
    setAccess(null);
    setAccessLoading(false);
    setImageLoading(false);
    setError('');
  }, [submissionId]);

  const loadDocument = useCallback(async (document, { force = false } = {}) => {
    const requestId = ++requestRef.current;
    const cached = accessCacheRef.current.get(document.id);
    const cachedExpiry = cached?.expires_at ? new Date(cached.expires_at).getTime() : 0;
    setSelected(document);
    setError('');

    if (!force && cached?.url && cachedExpiry > Date.now() + ACCESS_EXPIRY_BUFFER_MS) {
      setAccess(cached);
      setAccessLoading(false);
      setImageLoading(true);
      return;
    }

    setAccess(null);
    setAccessLoading(true);
    setImageLoading(false);
    try {
      const response = await fetchKycDocumentAccess(submissionId, document.id);
      if (requestId !== requestRef.current) return;
      accessCacheRef.current.set(document.id, response.DT);
      setAccess(response.DT);
      setImageLoading(true);
    } catch (requestError) {
      if (requestId !== requestRef.current) return;
      setError(requestError?.EM || 'Unable to open this protected KYC document.');
    } finally {
      if (requestId === requestRef.current) setAccessLoading(false);
    }
  }, [submissionId]);

  const closePreview = () => {
    requestRef.current += 1;
    setSelected(null);
    setAccess(null);
    setAccessLoading(false);
    setImageLoading(false);
    setError('');
  };

  return (
    <div className="document-section">
      <div className="document-list">
        {documents.map((document) => (
          <KycDocumentCard
            key={document.id}
            document={document}
            loading={accessLoading && selected?.id === document.id}
            onView={loadDocument}
          />
        ))}
      </div>
      <ImagePreviewModal
        document={selected}
        access={access}
        accessLoading={accessLoading}
        imageLoading={imageLoading}
        error={error}
        onClose={closePreview}
        onImageLoad={() => setImageLoading(false)}
        onImageError={() => {
          setImageLoading(false);
          setError('The image could not be loaded. Its protected link may have expired.');
        }}
        onRetry={() => selected && loadDocument(selected, { force: true })}
      />
    </div>
  );
};

export default KycDocumentViewer;
