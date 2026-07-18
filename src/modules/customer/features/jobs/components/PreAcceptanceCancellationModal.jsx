import React, { useEffect, useRef, useState } from 'react';

const REASONS = [
    ['NO_LONGER_NEEDED', 'The Job is no longer needed'],
    ['POSTED_BY_MISTAKE', 'The Job was posted by mistake'],
    ['JOB_DETAILS_CHANGED', 'The Job requirements changed'],
    ['FOUND_OTHER_HELP', 'I found help elsewhere'],
    ['OTHER', 'Other reason'],
];

const PreAcceptanceCancellationModal = ({ open, onClose, onConfirm, submitting }) => {
    const [reason, setReason] = useState('NO_LONGER_NEEDED');
    const [reasonText, setReasonText] = useState('');
    const [error, setError] = useState('');
    const selectRef = useRef(null);
    const modalStateRef = useRef({ onClose, submitting });
    modalStateRef.current = { onClose, submitting };

    useEffect(() => {
        if (!open) return;
        const previousFocus = document.activeElement;
        setReason('NO_LONGER_NEEDED');
        setReasonText('');
        setError('');
        window.setTimeout(() => selectRef.current?.focus(), 0);
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !modalStateRef.current.submitting) {
                modalStateRef.current.onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previousFocus?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    const submit = async () => {
        const note = reasonText.trim();
        if (reason === 'OTHER' && !note) {
            setError('Add a short explanation for Other.');
            return;
        }
        if (note.length > 500) {
            setError('The explanation must not exceed 500 characters.');
            return;
        }
        setError('');
        await onConfirm({ reason, reason_text: note || null });
    };

    return (
        <div className="early-cancellation-modal" role="presentation" onMouseDown={onClose}>
            <section
                className="early-cancellation-modal__dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="early-cancellation-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <h3 id="early-cancellation-title">Cancel this Job?</h3>
                <p>
                    This is final. The Job will move to Cancelled and all pending Bids will expire.
                    No deposit or wallet transaction is involved before acceptance.
                </p>
                <label>
                    <span>Reason</span>
                    <select ref={selectRef} value={reason} onChange={(event) => setReason(event.target.value)}>
                        {REASONS.map(([value, label]) => (
                            <option value={value} key={value}>{label}</option>
                        ))}
                    </select>
                </label>
                <label>
                    <span>{reason === 'OTHER' ? 'Explanation' : 'Additional note (optional)'}</span>
                    <textarea
                        rows="3"
                        maxLength={500}
                        value={reasonText}
                        onChange={(event) => setReasonText(event.target.value)}
                    />
                    <small>{reasonText.length}/500</small>
                </label>
                {error && <div className="early-cancellation-modal__error" role="alert">{error}</div>}
                <div className="early-cancellation-modal__actions">
                    <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={submitting}>
                        Keep Job
                    </button>
                    <button type="button" className="btn btn-danger" onClick={submit} disabled={submitting}>
                        {submitting ? 'Cancelling...' : 'Cancel Job'}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default PreAcceptanceCancellationModal;
