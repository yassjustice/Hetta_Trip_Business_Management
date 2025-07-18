import React from 'react';
import { 
  EyeIcon,
  XMarkIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ResearchSessionCard = ({ 
  session, 
  onView, 
  onCancel, 
  getStatusIcon, 
  getStatusColor 
}) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCompletionPercentage = () => {
    if (!session.searchTerms || session.searchTerms.length === 0) return 0;
    
    const completedTerms = session.searchTerms.filter(term => 
      term.status === 'Completed' || term.status === 'Failed'
    ).length;
    
    return Math.round((completedTerms / session.searchTerms.length) * 100);
  };

  const getTotalResults = () => {
    return session.searchTerms?.reduce((total, term) => 
      total + (term.results?.length || 0), 0
    ) || 0;
  };

  const getSuccessfulResults = () => {
    return session.searchTerms?.reduce((total, term) => 
      total + (term.results?.filter(r => r.fetchStatus === 'Fetched')?.length || 0), 0
    ) || 0;
  };

  const canBeCancelled = ['Pending', 'Processing'].includes(session.status);
  const canBeDeleted = ['Completed', 'Failed', 'Cancelled'].includes(session.status);

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(session.status)}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
              {session.status}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onView}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="View Details"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            {canBeCancelled && (
              <button
                onClick={onCancel}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Cancel Session"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
            {canBeDeleted && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this research session? This action cannot be undone.')) {
                    if (typeof session.onDelete === 'function') session.onDelete();
                  }
                }}
                className="p-1 text-gray-400 hover:text-red-700 transition-colors"
                title="Delete Session"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Terms */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Search Terms</h3>
          <div className="flex flex-wrap gap-2">
            {session.searchTerms?.slice(0, 3).map((term, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
              >
                {term.term}
              </span>
            ))}
            {session.searchTerms?.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                +{session.searchTerms.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {['Pending', 'Processing'].includes(session.status) && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>Progress</span>
              <span>{getCompletionPercentage()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getCompletionPercentage()}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500">Total Results</div>
            <div className="text-lg font-semibold text-gray-900">
              {getTotalResults()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Successful</div>
            <div className="text-lg font-semibold text-green-600">
              {getSuccessfulResults()}
            </div>
          </div>
        </div>

        {/* Summary Stats (for completed sessions) */}
        {session.status === 'Completed' && session.summary && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Imported:</span>
                <span className="font-medium text-green-600">
                  {session.summary.importedVendors || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Duplicates:</span>
                <span className="font-medium text-yellow-600">
                  {session.summary.duplicatesFound || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message (for failed sessions) */}
        {session.status === 'Failed' && (
          <div className="border-t pt-4">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-900">Research Failed</div>
                <div className="text-sm text-red-700">
                  {session.error?.message || 'An error occurred during research processing'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>Created: {formatDate(session.createdAt)}</span>
            </div>
            {session.status === 'Completed' && session.summary?.processingTimeMs && (
              <span>
                Processed in {Math.round(session.summary.processingTimeMs / 1000)}s
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4">
          <button
            onClick={onView}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            View Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResearchSessionCard;
