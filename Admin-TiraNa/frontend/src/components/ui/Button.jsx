import React from 'react';

export const Button = ({ 
  children, 
  variant = 'brand', 
  size = 'md', 
  loading = false, 
  disabled = false, 
  className = '', 
  ...props 
}) => {
  const variantClass = 
    variant === 'danger' ? 'btn-danger' :
    variant === 'ghost' ? 'btn-ghost' :
    variant === 'dark' ? 'btn-dark' :
    'btn-brand';
  
  const sizeClass = size === 'sm' ? 'btn-sm' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && <div className="spinner" />}
      {children}
    </button>
  );
};
