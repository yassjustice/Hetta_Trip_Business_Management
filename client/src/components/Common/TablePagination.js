import React, { useState } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

const TablePagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
  showQuickJump = true,
  showItemsPerPage = true,
  searchQuery = '',
  searchFilters = {}
}) => {
  const [jumpPage, setJumpPage] = useState('');

  // Calculate display info
  const startItem = Math.max(1, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(totalItems, currentPage * itemsPerPage);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate range
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // Add first page
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    // Add main range
    rangeWithDots.push(...range);

    // Add last page
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handleJumpToPage = () => {
    const pageNumber = parseInt(jumpPage);
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
      setJumpPage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  // Don't render if there are no items
  if (totalItems === 0) {
    return null;
  }

  // Show simplified version for single page but with items per page selector
  if (totalPages <= 1) {
    return (
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg shadow-sm">
        {/* Mobile View */}
        <div className="flex items-center justify-center sm:hidden">
          <p className="text-sm text-gray-700">
            Showing {totalItems} {totalItems === 1 ? 'result' : 'results'}
            {searchQuery && (
              <span className="text-gray-500 ml-1">
                for "{searchQuery}"
              </span>
            )}
            {Object.keys(searchFilters).length > 0 && (
              <span className="text-gray-500 ml-1">(filtered)</span>
            )}
          </p>
        </div>

        {/* Desktop View */}
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <p className="text-sm text-gray-700">
            Showing {totalItems} {totalItems === 1 ? 'result' : 'results'}
            {searchQuery && (
              <span className="text-gray-500 ml-1">
                for "{searchQuery}"
              </span>
            )}
            {Object.keys(searchFilters).length > 0 && (
              <span className="text-gray-500 ml-1">(filtered)</span>
            )}
          </p>

          {/* Items Per Page Selector - Always show */}
          {showItemsPerPage && (
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-b-lg shadow-sm">
      {/* Mobile View */}
      <div className="flex items-center justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
            currentPage <= 1
              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        
        <div className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
            currentPage >= totalPages
              ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
          }`}
        >
          Next
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        {/* Results Info */}
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{totalItems}</span> results
            {searchQuery && (
              <span className="text-gray-500 ml-1">
                for "{searchQuery}"
              </span>
            )}
            {Object.keys(searchFilters).length > 0 && (
              <span className="text-gray-500 ml-1">(filtered)</span>
            )}
          </p>

          {/* Items Per Page Selector */}
          {showItemsPerPage && (
            <div className="flex items-center space-x-2">
              <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                Show:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center space-x-4">
          {/* Quick Jump */}
          {showQuickJump && totalPages > 10 && (
            <div className="flex items-center space-x-2">
              <label htmlFor="jumpPage" className="text-sm text-gray-700">
                Go to:
              </label>
              <input
                id="jumpPage"
                type="number"
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Page"
                min="1"
                max={totalPages}
                className="w-16 border border-gray-300 rounded-md text-sm px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleJumpToPage}
                disabled={!jumpPage || parseInt(jumpPage) < 1 || parseInt(jumpPage) > totalPages}
                className="px-2 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Go
              </button>
            </div>
          )}

          {/* Page Navigation */}
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            {/* First Page */}
            <button
              onClick={() => onPageChange(1)}
              disabled={currentPage <= 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                currentPage <= 1
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              title="First page"
            >
              <ChevronDoubleLeftIcon className="h-5 w-5" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium ${
                currentPage <= 1
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              title="Previous page"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>

            {/* Page Numbers */}
            {getPageNumbers().map((pageNumber, index) => {
              if (pageNumber === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange(pageNumber)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    pageNumber === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next Page */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={`relative inline-flex items-center px-2 py-2 border text-sm font-medium ${
                currentPage >= totalPages
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              title="Next page"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage >= totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                currentPage >= totalPages
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              title="Last page"
            >
              <ChevronDoubleRightIcon className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default TablePagination;
