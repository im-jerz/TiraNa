import React from 'react';

export const Alert = ({ type = 'error', children, className = '' }) => {
  return (
    <div style={{
      background: type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#eff6ff',
      border: `1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : '#bfdbfe'}`,
      color: type === 'error' ? '#991b1b' : type === 'success' ? '#166534' : '#1d4ed8',
      borderRadius: 12,
      padding: '14px 16px',
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 16,
    }}>
      {children}
    </div>
  );
};
