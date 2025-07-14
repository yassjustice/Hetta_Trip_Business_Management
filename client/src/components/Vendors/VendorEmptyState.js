import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const VendorEmptyState = ({ searchResults, onClearFilters }) => {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">
        {searchResults ? 'No vendors found' : 'No vendors yet'}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {searchResults ? (
          searchResults.query ? (
            <>No vendors match your search for "{searchResults.query}"
              {Object.keys(searchResults.filters).length > 0 && ' with current filters'}
              . Try adjusting your search terms or removing some filters.</>
          ) : (
            <>No vendors match your current filters. Try adjusting or removing some filters to see more results.</>
          )
        ) : (
          <>Get started by adding your first vendor to track and manage your supplier relationships.</>
        )}
      </p>
      <div className="mt-6 flex justify-center space-x-3">
        {searchResults && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <XMarkIcon className="-ml-1 mr-2 h-5 w-5" />
            Clear All Filters
          </button>
        )}
        <Link
          to="/vendors/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Vendor
        </Link>
      </div>
    </div>
  );
};

export default VendorEmptyState;
