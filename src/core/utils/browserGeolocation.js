const DEFAULT_GEOLOCATION_OPTIONS = Object.freeze({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
});

const createLocationError = (code, message, originalError = null) => {
  const error = new Error(message);
  error.code = code;
  error.originalError = originalError;
  return error;
};

const mapNativeGeolocationError = (error) => {
  if (error?.code === 1) {
    return createLocationError(
      'GEOLOCATION_PERMISSION_DENIED',
      'Location permission was denied. Allow location access in your browser and try again.',
      error,
    );
  }
  if (error?.code === 2) {
    return createLocationError(
      'GEOLOCATION_POSITION_UNAVAILABLE',
      'Your device could not determine its current location. Check GPS and connectivity, then try again.',
      error,
    );
  }
  if (error?.code === 3) {
    return createLocationError(
      'GEOLOCATION_TIMEOUT',
      'Location could not be retrieved before the timeout. Check GPS and try again.',
      error,
    );
  }
  return createLocationError(
    'GEOLOCATION_FAILED',
    'Your current location could not be retrieved. Please try again.',
    error,
  );
};

const createAbortError = () => {
  const error = new DOMException('Geolocation request was aborted.', 'AbortError');
  error.code = 'GEOLOCATION_ABORTED';
  return error;
};

const getCurrentBrowserLocation = ({ signal, options = {} } = {}) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(createAbortError());
    return;
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    reject(createLocationError(
      'GEOLOCATION_UNSUPPORTED',
      'This browser does not support location services.',
    ));
    return;
  }

  let settled = false;
  const finish = (callback, value) => {
    if (settled) return;
    settled = true;
    signal?.removeEventListener('abort', handleAbort);
    callback(value);
  };
  const handleAbort = () => finish(reject, createAbortError());
  signal?.addEventListener('abort', handleAbort, { once: true });

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const latitude = Number(position?.coords?.latitude);
      const longitude = Number(position?.coords?.longitude);
      const rawAccuracy = position?.coords?.accuracy;
      const accuracy = rawAccuracy == null ? null : Number(rawAccuracy);

      if (!Number.isFinite(latitude)
        || !Number.isFinite(longitude)
        || latitude < -90
        || latitude > 90
        || longitude < -180
        || longitude > 180
        || (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0))) {
        finish(reject, createLocationError(
          'GEOLOCATION_INVALID_RESULT',
          'The device returned an invalid location. Please try again.',
        ));
        return;
      }

      finish(resolve, {
        gps_lat: latitude,
        gps_long: longitude,
        gps_accuracy_meters: accuracy,
      });
    },
    (error) => finish(reject, mapNativeGeolocationError(error)),
    { ...DEFAULT_GEOLOCATION_OPTIONS, ...options },
  );
});

const getGeolocationErrorMessage = (error) => (
  error?.message || 'Your current location could not be retrieved. Please try again.'
);

export {
  DEFAULT_GEOLOCATION_OPTIONS,
  getCurrentBrowserLocation,
  getGeolocationErrorMessage,
  mapNativeGeolocationError,
};
