import React, { useEffect, useId, useMemo, useState } from 'react';
import AdminModal from '../../../components/AdminModal';

const label = (value) => String(value || '').toLowerCase().split('_')
  .map((word) => word ? word[0].toUpperCase() + word.slice(1) : '')
  .join(' ');

const AdminJobDecisionModal = ({
  open,
  action,
  requirements,
  impact,
  submitting,
  error,
  onClose,
  onSubmit
}) => {
  const titleId = useId();
  const errorId = useId();
  const [reasonCode, setReasonCode] = useState('');
  const [reasonText, setReasonText] = useState('');

  useEffect(() => {
    if (open) {
      setReasonCode('');
      setReasonText('');
    }
  }, [action, open]);

  const textRequired = useMemo(() => Boolean(requirements?.reason_text_required)
    || (requirements?.reason_text_required_for_codes || []).includes(reasonCode), [reasonCode, requirements]);
  if (!action) return null;
  const maximum = Number(requirements?.reason_text_max_length || 500);
  const invalid = !reasonCode || (textRequired && !reasonText.trim()) || reasonText.length > maximum;

  return (
    <AdminModal open={open} titleId={titleId} onClose={onClose} submitting={submitting} className="job-decision-modal">
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!invalid) onSubmit({ reason_code: reasonCode, reason_text: reasonText.trim() || null });
      }}>
        <p className="admin-eyebrow">Canonical Admin decision</p>
        <h2 id={titleId}>{label(action)}</h2>
        <p className="decision-impact">{impact}</p>
        <label>Reason code
          <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} required aria-describedby={error ? errorId : undefined}>
            <option value="">Select a reason</option>
            {(requirements?.reason_codes || []).map((reason) => <option key={reason} value={reason}>{label(reason)}</option>)}
          </select>
        </label>
        <label>Reason note {textRequired ? '(required)' : '(optional)'}
          <textarea value={reasonText} maxLength={maximum} onChange={(event) => setReasonText(event.target.value)} required={textRequired} rows={5} />
          <span className="character-count">{reasonText.length}/{maximum}</span>
        </label>
        {error && <p id={errorId} className="decision-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" disabled={submitting || invalid}>{submitting ? 'Submitting...' : 'Confirm decision'}</button>
        </div>
      </form>
    </AdminModal>
  );
};

export default AdminJobDecisionModal;
