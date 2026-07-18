import React from 'react';

const LifecycleLoadingState = () => (
  <div className="lifecycle-loading" role="status" aria-label="Loading job workspace">
    <span className="visually-hidden">Loading job workspace</span>
    <div className="lifecycle-loading__header" />
    <div className="lifecycle-loading__progress" />
    <div className="lifecycle-loading__grid">
      <div className="lifecycle-loading__stage" />
      <div className="lifecycle-loading__context" />
    </div>
  </div>
);

export default LifecycleLoadingState;
