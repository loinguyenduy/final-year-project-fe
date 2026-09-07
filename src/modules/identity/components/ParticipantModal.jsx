import { useEffect, useId, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import './ParticipantUi.scss';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ParticipantModal = ({
  open = true,
  title,
  description,
  onClose,
  children,
  size = 'medium',
  closeDisabled = false,
  className = '',
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocusRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    requestAnimationFrame(() => dialog?.querySelector(FOCUSABLE)?.focus());
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !closeDisabled) {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = [...dialog.querySelectorAll(FOCUSABLE)];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [closeDisabled, onClose, open]);

  if (!open) return null;
  return (
    <div className="participant-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !closeDisabled) onClose?.();
    }}>
      <section
        ref={dialogRef}
        className={`participant-modal participant-modal--${size} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="participant-modal__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button type="button" className="participant-modal__close" onClick={onClose} disabled={closeDisabled} aria-label="Close dialog">
            <FaTimes aria-hidden="true" />
          </button>
        </header>
        <div className="participant-modal__body">{children}</div>
      </section>
    </div>
  );
};

export default ParticipantModal;
