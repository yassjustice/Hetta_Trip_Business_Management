import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const VendorErrorState = ({ searchError, onRetry, onClearError }) => {
  if (!searchError) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <XMarkIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{searchError}</p>
          <div className="mt-2 flex space-x-3">
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
            <button
              onClick={onClearError}
              className="text-sm text-red-600 hover:text-red-500 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorErrorState;
