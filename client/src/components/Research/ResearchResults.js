import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowPathIcon,
  LinkIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { researchAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../Common/LoadingSpinner';
import ResearchResultTable from './ResearchResultTable';
import ResearchValidationModal from './ResearchValidationModal';
import ResearchImportModal from './ResearchImportModal';

const ResearchResults = ({ session, onBack, onRefresh }) => {
  // Column manager state (same pattern as vendors table)
  const DEFAULT_COLUMNS = [
    'name', 'website', 'email', 'phone', 'serviceTypes', 'printingMethods', 'pricing', 'location', 'moq', 'certifications', 'reputation', 'status', 'aiEntityType', 'aiEntityConfidence', 'aiEntityRationale', 'aiExtractionGuide', 'aiIntent', 'compliance', 'actions'
  ];
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('researchTableColumns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem('researchTableColumnOrder');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const handleColumnVisibilityChange = (newVisibleColumns) => {
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('researchTableColumns', JSON.stringify(newVisibleColumns));
  };

  const handleColumnOrderChange = (newOrder) => {
    setColumnOrder(newOrder);
    localStorage.setItem('researchTableColumnOrder', JSON.stringify(newOrder));
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_COLUMNS);
    setColumnOrder(DEFAULT_COLUMNS);
    localStorage.removeItem('researchTableColumns');
    localStorage.removeItem('researchTableColumnOrder');
  };
  const [selectedResults, setSelectedResults] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);
  const [filters, setFilters] = useState({
    dataQuality: 'all',
    fetchStatus: 'all',
    importStatus: 'all',
    needsValidation: 'all'
  });
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');

  useEffect(() => {
    applyFilters();
  }, [session, filters, entityTypeFilter]);

  const applyFilters = () => {
    let results = [];
    // Flatten all results from all search terms
    session.searchTerms?.forEach(term => {
      term.results?.forEach(result => {
        results.push({
          ...result,
          searchTerm: term.term,
          resultId: result._id
        });
      });
    });
    // Apply filters
    if (filters.dataQuality !== 'all') {
      results = results.filter(r => r.dataQuality === filters.dataQuality);
    }
    if (filters.fetchStatus !== 'all') {
      results = results.filter(r => r.fetchStatus === filters.fetchStatus);
    }
    if (filters.importStatus !== 'all') {
      results = results.filter(r => r.importStatus === filters.importStatus);
    }
    if (filters.needsValidation !== 'all') {
      const needsValidation = filters.needsValidation === 'true';
      results = results.filter(r => r.needsValidation === needsValidation);
    }
    // Entity type filter (AI-powered)
    if (entityTypeFilter !== 'all') {
      results = results.filter(r => r.aiEntityType === entityTypeFilter);
    }
    setFilteredResults(results);
  };

  const handleValidateResult = (result) => {
    setValidationResult(result);
    setShowValidationModal(true);
  };

  const handleSaveValidation = async (resultId, validated, overrides) => {
    try {
      await researchAPI.validateResult(session.sessionId, resultId, {
        validated,
        overrides
      });
      
      toast.success('Validation updated successfully');
      setShowValidationModal(false);
      setValidationResult(null);
      onRefresh(); // Refresh the session data
    } catch (error) {
      console.error('Error saving validation:', error);
      toast.error('Failed to save validation');
    }
  };

  const handleImportSelected = () => {
    if (selectedResults.length === 0) {
      toast.error('Please select results to import');
      return;
    }
    setShowImportModal(true);
  };

  const handleImportResults = async (resultIds, overrides) => {
    try {
      setIsImporting(true);
      const response = await researchAPI.importResults(session.sessionId, {
        resultIds,
        overrides
      });
      
      toast.success(response.data.message);
      setShowImportModal(false);
      setSelectedResults([]);
      onRefresh(); // Refresh the session data
      
    } catch (error) {
      console.error('Error importing results:', error);
      toast.error('Failed to import results');
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataQualityColor = (quality) => {
    switch (quality) {
      case 'High':
        return 'text-green-600';
      case 'Medium':
        return 'text-yellow-600';
      case 'Low':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getFetchStatusIcon = (status) => {
    switch (status) {
      case 'Fetched':
        return <CheckIcon className="h-4 w-4 text-green-500" />;
      case 'Failed':
        return <XMarkIcon className="h-4 w-4 text-red-500" />;
      case 'Blocked':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-yellow-400" />);
      } else {
        stars.push(<StarIcon key={i} className="h-4 w-4 text-gray-300" />);
      }
    }

    return <div className="flex items-center space-x-1">{stars}</div>;
  };

  // Add entity type filter UI
  const entityTypes = [
    'all',
    'vendor',
    'service_owner',
    'small_business',
    'reseller',
    'printing_shop',
    'factory',
    'online_business',
    'social_media_seller',
    'unknown'
  ];

  // Loading and error states
  const isLoading = ['Pending', 'Processing'].includes(session.status);
  const isEmpty = !isLoading && (!filteredResults || filteredResults.length === 0);
  const isFailed = session.status === 'Failed';


  return (
    <div className="space-y-6">
      {/* Top action bar: Export & Back to Dashboard */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <button
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={() => {
              if (filteredResults.length === 0) {
                toast.error('No results to export');
                return;
              }
              // Only export what's visible in the table
              const tableColumns = visibleColumns;
              const tableRows = filteredResults.map(row => {
                const data = row.extractedData || row;
                const result = {};
                tableColumns.forEach(col => {
                  // Use the same render logic as the table for each column
                  result[col] = data[col] !== undefined ? data[col] : row[col];
                });
                return result;
              });
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tableRows));
              const dlAnchor = document.createElement('a');
              dlAnchor.setAttribute("href", dataStr);
              dlAnchor.setAttribute("download", `research_results_${session.sessionId}.json`);
              dlAnchor.click();
            }}
          >
            Export JSON
          </button>
          <button
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            onClick={() => {
              if (filteredResults.length === 0) {
                toast.error('No results to export');
                return;
              }
              // Only export what's visible in the table
              const tableColumns = visibleColumns;
              const tableRows = filteredResults.map(row => {
                const data = row.extractedData || row;
                const result = {};
                tableColumns.forEach(col => {
                  let value = data[col] !== undefined ? data[col] : row[col];
                  if (Array.isArray(value)) {
                    value = value.join('; '); // Join arrays with semicolon for CSV readability
                  } else if (typeof value === 'object' && value !== null) {
                    value = JSON.stringify(value); // Stringify objects
                  } else if (value === undefined || value === null) {
                    value = '';
                  }
                  result[col] = value;
                });
                return result;
              });
              const csv = [
                tableColumns.join(','),
                ...tableRows.map(obj => tableColumns.map(field => `"${String(obj[field]).replace(/"/g, '""')}"`).join(','))
              ].join('\r\n');
              const csvStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
              const dlAnchor = document.createElement('a');
              dlAnchor.setAttribute("href", csvStr);
              dlAnchor.setAttribute("download", `research_results_${session.sessionId}.csv`);
              dlAnchor.click();
            }}
          >
            Export CSV
          </button>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          onClick={onBack}
        >
          Back to Research Dashboard
        </button>
      </div>
      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
          <span className="ml-4 text-gray-500">Processing research... Please wait.</span>
        </div>
      )}
      {/* AI Suggestions Section */}
      {session.aiSuggestions && session.aiSuggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-bold text-blue-800 mb-2">AI-Generated Vendor/Service Suggestions</h2>
          <ul className="space-y-2">
            {session.aiSuggestions.map((s, idx) => (
              <li key={idx} className="bg-white rounded shadow p-3">
                <div className="font-semibold text-blue-700">{s.companyName || s.name || '-'}</div>
                <div className="text-sm text-gray-700">{s.description || '-'}</div>
                <div className="text-xs text-gray-500">{s.businessType || '-'}</div>
                <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">{s.website}</a>
                <div className="text-xs text-gray-500">{s.location || '-'}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Empty/Error State */}
      {isEmpty && !isLoading && (
        <div className="flex flex-col items-center py-12">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500 mb-2" />
          <span className="text-lg text-gray-700 font-semibold">
            {isFailed ? 'Research failed. Please try again or check your search terms.' : 'No results found for this research session.'}
          </span>
        </div>
      )}
      {/* ...existing code... */}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Results
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {session.summary?.totalResults || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Successful Fetches
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {session.summary?.successfulFetches || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentArrowDownIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Imported
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {session.summary?.importedVendors || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StarIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg. Quality
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {session.summary?.averageDataQuality ? 
                      (session.summary.averageDataQuality * 33.33).toFixed(0) + '%' : 
                      'N/A'
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Terms Progress */}
      {session.searchTerms && session.searchTerms.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Search Terms Progress</h3>
          <div className="space-y-4">
            {session.searchTerms.map((term, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{term.term}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(term.status)}`}>
                      {term.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {term.results?.length || 0} results found
                    {term.results && (
                      <span className="ml-2">
                        • {term.results.filter(r => r.fetchStatus === 'Fetched').length} successful
                        • {term.results.filter(r => r.fetchStatus === 'Failed').length} failed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="font-medium">Entity Type:</label>
        <select
          value={entityTypeFilter}
          onChange={e => setEntityTypeFilter(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {entityTypes.map(type => (
            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Results Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
      <ResearchResultTable
        results={filteredResults}
        selectedResults={selectedResults}
        onSelectionChange={setSelectedResults}
        onValidateResult={handleValidateResult}
        onViewResult={(result) => { setValidationResult(result); setShowValidationModal(true); }}
        filters={filters}
        onFiltersChange={setFilters}
        getFetchStatusIcon={getFetchStatusIcon}
        getDataQualityColor={getDataQualityColor}
        renderStars={renderStars}
        visibleColumns={visibleColumns}
        columnOrder={columnOrder}
        onColumnsChange={handleColumnVisibilityChange}
        onOrderChange={handleColumnOrderChange}
        onResetColumns={handleResetColumns}
      />
        </div>
      </div>

      {/* Validation Modal */}
      {validationResult && (
        <ResearchValidationModal
          open={showValidationModal}
          result={validationResult}
          onClose={() => {
            setShowValidationModal(false);
            setValidationResult(null);
          }}
          onSave={handleSaveValidation}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ResearchImportModal
          results={filteredResults.filter(r => selectedResults.includes(r.resultId))}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportResults}
          isImporting={isImporting}
        />
      )}
    </div>
  );
};

export default ResearchResults;
