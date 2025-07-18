// /Users/piseytep/Desktop/ReactJs/moodleQB/moodle/src/shared/components/PaginationControls.jsx

import React from 'react';

  import Pagination from '@mui/material/Pagination';
//  FIXED: Simple SVG icons instead of @heroicons/react
const ChevronLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const PaginationControls = ({
  currentPage=1,
  totalPages=1,
  totalItems=0,
  itemsPerPage=5,
  onPageChange,
  onItemsPerPageChange,
  isLoading = false,
  className = ''
}) => {
  //  FIXED: Handle edge cases based on your API structure
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.max(1, Math.min(currentPage || 1, safeTotalPages));
  const safeTotalItems = Math.max(0, totalItems || 0);
  const safeItemsPerPage = Math.max(1, itemsPerPage || 5);

  //  FIXED: Calculate display info based on your API response structure
  // Your API returns: { current_page: 1, per_page: 5, total: 39, last_page: 8 }
  const startItem = safeTotalItems === 0 ? 0 : (safeCurrentPage - 1) * safeItemsPerPage + 1;
  const endItem = Math.min(safeCurrentPage * safeItemsPerPage, safeTotalItems);

  // FIXED: Generate page numbers with smart truncation
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show max 7 page numbers
    
    if (safeTotalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      // Smart pagination with ellipsis
      if (safeCurrentPage <= 4) {
        // Near beginning: 1 2 3 4 5 ... last
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        if (safeTotalPages > 6) {
          pages.push('...');
          pages.push(safeTotalPages);
        }
      } else if (safeCurrentPage >= safeTotalPages - 3) {
        // Near end: 1 ... last-4 last-3 last-2 last-1 last
        pages.push(1);
        if (safeTotalPages > 6) {
          pages.push('...');
        }
        for (let i = safeTotalPages - 4; i <= safeTotalPages; i++) {
          if (i > 1) pages.push(i);
        }
      } else {
        // Middle: 1 ... current-1 current current+1 ... last
        pages.push(1);
        pages.push('...');
        for (let i = safeCurrentPage - 1; i <= safeCurrentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(safeTotalPages);
      }
    }
    
    return pages;
  };

  //  FIXED: Handle page change with validation
  const handlePageChange = (page) => {
    if (isLoading) return;
    
    const newPage = Math.max(1, Math.min(page, safeTotalPages));
    if (newPage !== safeCurrentPage && onPageChange) {
      console.log(` Pagination: Changing from page ${safeCurrentPage} to ${newPage}`);
      onPageChange(newPage);
    }
  };

  //  FIXED: Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage) => {
    if (isLoading || !onItemsPerPageChange) return;
    
    const validItemsPerPage = Math.max(1, parseInt(newItemsPerPage) || 5);
    console.log(` Pagination: Changing items per page to ${validItemsPerPage}`);
    onItemsPerPageChange(validItemsPerPage);
  };

  //  FIXED: Don't render if no data
  if (safeTotalItems === 0) {
    return (
      <div className={`flex items-center justify-center py-4 text-gray-500 ${className}`}>
        <span className="text-sm">No items to display</span>
      </div>
    );
  }

  // ReactPaginate expects 0-based page index
  const handleReactPaginate = (selected) => {
    if (isLoading) return;
    const newPage = selected.selected + 1;
    if (newPage !== safeCurrentPage && onPageChange) {
      onPageChange(newPage);
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 bg-white border-t border-gray-200 ${className}`}>
      {/* Items Info - Left Side */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          <span className="font-medium">
            Showing {startItem.toLocaleString()}-{endItem.toLocaleString()}
          </span>
          <span className="mx-1">of</span>
          <span className="font-medium">{safeTotalItems.toLocaleString()}</span>
          <span className="ml-1">results</span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
            Show:
          </label>
          <select
            id="itemsPerPage"
            value={safeItemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
            disabled={isLoading}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
      {/* Pagination Controls - Right Side */}
        
      
    
      
      <div className="flex items-center gap-2">
        <Pagination
          count={safeTotalPages}
          page={safeCurrentPage}
          onChange={(e, page) => handlePageChange(page)}
          variant="outlined"
          shape="rounded"
          color="primary"
          sx={{
            '& .MuiPaginationItem-root': {
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '1rem',
              minWidth: 36,
              height: 36,
              color: '#334155',
              borderColor: '#e5e7eb',
              backgroundColor: '#fff',
              '&.Mui-selected': {
                backgroundColor: '#2563eb',
                color: '#fff',
                borderColor: '#2563eb',
              },
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            },
          }}
          disabled={isLoading}
        />
      </div>
      <style>{`
        .pagination .active .page-link {
          background-color: #2563eb !important; /* sky-600 */
          color: #fff !important;
          border-color: #2563eb !important;
        }
      `}</style>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-600"></div>
            Loading...
          </div>
        </div>
      )}
    </div>
  );
};

//  FIXED: Prop validation with exact API structure
// PaginationControls.defaultProps = {
//   currentPage: 1,
//   totalPages: 1,
//   totalItems: 0,
//   itemsPerPage: 5,
//   isLoading: false,
//   className: ''
// };

export default PaginationControls;