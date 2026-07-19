import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaEye, FaSyncAlt } from 'react-icons/fa';
import { fetchKycDocumentAccess } from '../../../services/adminKycService';

const formatType = (value) => String(value || '').replaceAll('_', ' ');

const KycDocumentViewer = ({ submissionId, documents }) => {
  const [selected, setSelected] = useState(null);
  const [access, setAccess] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState('');
  const requestRef = useRef(0);

  useEffect(() => {
    requestRef.current += 1;
    setSelected(null);
    setAccess(null);
    setError('');
  }, [submissionId]);

  const loadDocument = useCallback(async (document) => {
    const requestId = ++requestRef.current;
    setSelected(document);
    setAccess(null);
    setLoadingId(document.id);
    setError('');
    try {
      const response = await fetchKycDocumentAccess(submissionId, document.id);
      if (requestId !== requestRef.current) return;
      setAccess(response.DT);
    } catch (requestError) {
      if (requestId !== requestRef.current) return;
      setAccess(null);
      setError(requestError?.EM || 'Unable to open this KYC document.');
    } finally {
      if (requestId === requestRef.current) setLoadingId(null);
    }
  }, [submissionId]);

  useEffect(() => {
    if (!selected || !access?.expires_at) return undefined;
    const expiresAt = new Date(access.expires_at).getTime();
    if (!Number.isFinite(expiresAt)) return undefined;
    const timer = window.setTimeout(
      () => void loadDocument(selected),
      Math.max(1000, expiresAt - Date.now() - 5000)
    );
    return () => window.clearTimeout(timer);
  }, [access?.expires_at, loadDocument, selected]);

  return (
    <div className="document-section">
      <div className="document-list">
        {documents.map((document) => (
          <div className="document-row" key={document.id}>
            <div><strong>{formatType(document.document_type)}</strong><small>{document.mime_type || 'Private image'}</small></div>
            <button type="button" onClick={() => loadDocument(document)} disabled={!document.can_view || loadingId === document.id}>
              <FaEye /> {loadingId === document.id ? 'Loading...' : 'View'}
            </button>
          </div>
        ))}
      </div>
      {selected && (
        <div className="document-preview">
          <div className="preview-heading">
            <strong>{formatType(selected.document_type)}</strong>
            <button type="button" onClick={() => loadDocument(selected)} disabled={loadingId === selected.id}>
              <FaSyncAlt /> Refresh access
            </button>
          </div>
          {loadingId === selected.id && <p role="status">Refreshing protected document access...</p>}
          {error && <p className="inline-error" role="alert">{error}</p>}
          {access?.url && (
            <img
              src={access.url}
              alt={`${formatType(selected.document_type)} KYC document`}
              referrerPolicy="no-referrer"
            />
          )}
          {access?.expires_at && <small>Access expires at {new Date(access.expires_at).toLocaleTimeString()}.</small>}
        </div>
      )}
    </div>
  );
};

export default KycDocumentViewer;
