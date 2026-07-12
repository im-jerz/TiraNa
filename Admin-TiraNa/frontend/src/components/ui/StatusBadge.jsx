import React from 'react';

export const StatusBadge = ({ status }) => {
  const s = (status || '').toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  return (
    <span className={`badge badge-${s}`}>
      {status}
    </span>
  );
};
