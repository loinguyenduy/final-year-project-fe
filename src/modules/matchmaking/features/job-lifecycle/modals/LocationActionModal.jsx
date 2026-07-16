import React, { useEffect, useRef, useState } from 'react';
import { FaLocationArrow, FaRedo } from 'react-icons/fa';
import {
  getCurrentBrowserLocation,
  getGeolocationErrorMessage,
} from '../../../../../core/utils/browserGeolocation';
import LifecycleModal from '../components/LifecycleModal';

const LocationActionModal = ({
  actionLabel,
  description,
  hasJobCoordinates,
  locatingLabel,
  onClose,
  onSubmit,
  open,
  submitting,
  title,
  titleId,
}) => {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const controllerRef = useRef(null);

  useEffect(() => {
    if (open) setLocationError('');
    return () => controllerRef.current?.abort();
  }, [open]);

  const close = () => {
    controllerRef.current?.abort();
    setLocating(false);
    setLocationError('');
    onClose();
  };

  const submitWithLocation = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setLocating(true);
    setLocationError('');
    try {
      const location = await getCurrentBrowserLocation({ signal: controller.signal });
      const response = await onSubmit(location);
      if (response) close();
    } catch (error) {
      if (error?.name !== 'AbortError') setLocationError(getGeolocationErrorMessage(error));
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      setLocating(false);
    }
  };

  const submitWithoutLocation = async () => {
    const response = await onSubmit({});
    if (response) close();
  };

  const busy = locating || submitting;
  return (
    <LifecycleModal
      open={open}
      onClose={close}
      submitting={busy}
      title={title}
      titleId={titleId}
      footer={(
        <>
          <button type="button" className="lifecycle-btn lifecycle-btn--secondary" onClick={close} disabled={busy}>Back</button>
          <button type="button" className="lifecycle-btn lifecycle-btn--primary" onClick={submitWithLocation} disabled={busy}>
            {busy ? <span className="spinner-border spinner-border-sm" aria-hidden="true" /> : <FaLocationArrow aria-hidden="true" />}
            {locating ? locatingLabel : actionLabel}
          </button>
        </>
      )}
    >
      <p>{description}</p>
      <div className="lifecycle-inline-notice lifecycle-inline-notice--neutral">
        <FaLocationArrow aria-hidden="true" />
        <span>Your browser will request fresh location permission. Raw coordinates are not displayed in the workspace.</span>
      </div>
      {locationError && (
        <div className="lifecycle-form-error" role="alert">
          <strong>Location unavailable</strong>
          <span>{locationError}</span>
          <button type="button" onClick={submitWithLocation} disabled={busy}><FaRedo /> Try again</button>
        </div>
      )}
      {locationError && !hasJobCoordinates && (
        <div className="lifecycle-location-fallback">
          <p>This job does not have confirmed coordinates, so you may continue without sending GPS.</p>
          <button type="button" className="lifecycle-btn lifecycle-btn--secondary" onClick={submitWithoutLocation} disabled={busy}>
            Continue without location
          </button>
        </div>
      )}
      {locationError && hasJobCoordinates && (
        <p className="lifecycle-helper-text">This job has confirmed coordinates, so a current location is required.</p>
      )}
    </LifecycleModal>
  );
};

export default LocationActionModal;
