import React from 'react';
import { StatusBadge } from '../../../components/AdminStates';

const formatDate = (value) => value ? new Date(value).toLocaleString() : 'Not reviewed';

const KycHistoryList = ({ history = [], currentId, onSelect }) => (
  <div className="history-section">
    <h3>Submission history</h3>
    <div className="history-list">
      {history.map((entry) => (
        <button
          key={entry.id}
          type="button"
          className={entry.id === currentId ? 'current' : ''}
          onClick={() => onSelect(entry.id)}
        >
          <span>Submission #{entry.submission_sequence}</span>
          <StatusBadge status={entry.status} />
          <small>{formatDate(entry.submitted_at)}</small>
        </button>
      ))}
    </div>
  </div>
);

export default KycHistoryList;
