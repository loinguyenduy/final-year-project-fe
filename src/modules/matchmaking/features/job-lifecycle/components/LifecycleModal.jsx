import React, { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const LifecycleModal = ({
  children,
  footer,
  onClose,
  open,
  submitting = false,
  title,
  titleId,
}) => {
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const frame = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector(FOCUSABLE)?.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onClose();
      if (event.key !== 'Tab') return;
      const elements = [...(dialogRef.current?.querySelectorAll(FOCUSABLE) || [])];
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [onClose, open, submitting]);

  if (!open) return null;
  return (
    <div
      className="lifecycle-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !submitting) onClose();
      }}
    >
      <div ref={dialogRef} className="lifecycle-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="lifecycle-modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Close dialog">
            <FaTimes aria-hidden="true" />
          </button>
        </header>
        <div className="lifecycle-modal__body">{children}</div>
        {footer && <footer className="lifecycle-modal__footer">{footer}</footer>}
      </div>
    </div>
  );
};

export default LifecycleModal;
