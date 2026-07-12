import React from 'react';

export const Card = ({ children, title, subtitle, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-title">{title}</div>}
      {subtitle && <div className="card-subtitle">{subtitle}</div>}
      {children}
    </div>
  );
};
