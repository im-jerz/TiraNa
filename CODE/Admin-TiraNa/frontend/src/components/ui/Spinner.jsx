import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <div className={`loader ${className}`}>
      <div className="spin" />
    </div>
  );
};
