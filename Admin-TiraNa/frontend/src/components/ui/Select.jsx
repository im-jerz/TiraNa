import React from 'react';

export const Select = ({ value, onChange, options, placeholder, className = '' }) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`filter-select ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
};
