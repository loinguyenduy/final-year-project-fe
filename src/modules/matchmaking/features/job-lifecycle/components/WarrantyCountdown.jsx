import React, { useEffect, useState } from 'react';

const getRemaining = (endsAt) => Math.max(0, new Date(endsAt).getTime() - Date.now());

const formatRemaining = (remaining) => {
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  return `${hours}h ${minutes}m ${seconds}s`;
};

const WarrantyCountdown = ({ endsAt }) => {
  const [remaining, setRemaining] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    const update = () => setRemaining(getRemaining(endsAt));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="warranty-countdown" role="timer" aria-live="off">
      <span>Warranty time remaining</span>
      <strong>{remaining > 0 ? formatRemaining(remaining) : 'Window ended — refresh for status'}</strong>
    </div>
  );
};

export default WarrantyCountdown;
