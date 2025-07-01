// /Users/piseytep/Desktop/ReactJs/moodleQB/moodle/src/shared/components/PaginationControls.jsx

import React from 'react';

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

  const pageNumbers = generatePageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 bg-white border-t border-gray-200 ${className}`}>
      {/*  Items Info - Left Side */}
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          <span className="font-medium">
            Showing {startItem.toLocaleString()}-{endItem.toLocaleString()}
          </span>
          <span className="mx-1">of</span>
          <span className="font-medium">{safeTotalItems.toLocaleString()}</span>
          <span className="ml-1">results</span>
        </div>

        {/*  Items Per Page Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
            Show:
          </label>
          <select
            id="itemsPerPage"
            value={safeItemsPerPage}
            onChange={(e) => handleItemsPerPageChange(e.target.value)}
            disabled={isLoading}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/*  Pagination Controls - Right Side */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1 || isLoading}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-colors"
          title="Previous page"
        >
          <ChevronLeftIcon />
          <span className="ml-1">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-sm text-gray-500"
                >
                  ...
                </span>
              );
            }

            const isCurrentPage = page === safeCurrentPage;

            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={isLoading}
                className={`
                  inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isCurrentPage
                    ? 'bg-blue-600 text-white border border-blue-600 cursor-default'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
                  }
                `}
                aria-current={isCurrentPage ? 'page' : undefined}
                title={`Go to page ${page}`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Mobile Page Indicator */}
        <div className="sm:hidden text-sm text-gray-700 px-3 py-2">
          Page {safeCurrentPage} of {safeTotalPages}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages || isLoading}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-colors"
          title="Next page"
        >
          <span className="mr-1">Next</span>
          <ChevronRightIcon />
        </button>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
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