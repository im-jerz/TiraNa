import React from 'react';
import { Spinner } from './Spinner';

export const DataTable = ({ 
  headers, 
  data, 
  loading, 
  emptyMessage = 'No results found.',
  renderRow 
}) => {
  return (
    <div className="table-container">
      {loading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <div className="empty-state">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 8-8-8" /></svg>
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th key={i} className={header.className || ''}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => renderRow(item, i))}
          </tbody>
        </table>
      )}
    </div>
  );
};
