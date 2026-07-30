import React from 'react';

const PageHeader = ({ title, description, aside = null }) => (
  <div className="page-header">
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    {aside}
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`status-badge ${String(status || '').toLowerCase()}`}>{status}</span>
);

const LoadingState = ({ message = 'Loading...' }) => (
  <div className="panel-state" role="status">{message}</div>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="panel-state error" role="alert">
    <p>{message}</p>
    {onRetry && <button type="button" onClick={onRetry}>Retry</button>}
  </div>
);

const EmptyState = ({ icon = null, message }) => (
  <div className="panel-state">
    {icon}
    <p>{message}</p>
  </div>
);

export { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge };
