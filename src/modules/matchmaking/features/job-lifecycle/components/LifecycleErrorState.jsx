import React from 'react';
import { FaExclamationTriangle, FaRedo } from 'react-icons/fa';

const LifecycleErrorState = ({ message, onBack, onRetry }) => (
  <div className="lifecycle-error" role="alert">
    <FaExclamationTriangle aria-hidden="true" />
    <h2>The job workspace could not be opened</h2>
    <p>{message}</p>
    <div className="lifecycle-error__actions">
      <button type="button" className="lifecycle-btn lifecycle-btn--primary" onClick={onRetry}>
        <FaRedo aria-hidden="true" />
        Try again
      </button>
      <button type="button" className="lifecycle-btn lifecycle-btn--secondary" onClick={onBack}>
        Back to jobs
      </button>
    </div>
  </div>
);

export default LifecycleErrorState;
