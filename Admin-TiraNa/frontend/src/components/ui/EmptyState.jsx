import React from 'react';

export const EmptyState = ({ message, icon }) => {
  return (
    <div className="empty-state">
      {icon || (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 8-8-8" /></svg>
      )}
      <p>{message}</p>
    </div>
  );
};
