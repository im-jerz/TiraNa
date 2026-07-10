import React from 'react';

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <div className="pagination-info">Page {currentPage} of {totalPages}</div>
      <div className="pg-btns">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="pg-btn"
        >‹</button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i + 1}
            onClick={() => onPageChange(i + 1)}
            className={`pg-btn ${i + 1 === currentPage ? 'active' : ''}`}
          >{i + 1}</button>
        ))}
        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="pg-btn"
        >›</button>
      </div>
    </div>
  );
};
