import React, { useState, useMemo } from 'react';
import { 
  EyeIcon, 
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import TablePagination from '../Common/TablePagination';
import TableColumnManager from '../Common/TableColumnManager';
import SearchAndFilter from '../Common/SearchAndFilter';

const ResearchResultTable = ({ 
  results = [], 
  selectedResults = [], 
  onSelectionChange,
  onValidateResult,
  onEditResult,
  onViewResult,
  visibleColumns,
  columnOrder,
  onColumnsChange,
  onOrderChange,
  onResetColumns,
  isLoading = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() => {
    const saved = localStorage.getItem('researchTableRowsPerPage');
    return saved ? parseInt(saved) : 10;
  });

  const availableColumns = [
    { id: 'name', key: 'name', label: 'Company Name', sortable: true },
    { id: 'website', key: 'website', label: 'Website', sortable: true },
    { id: 'email', key: 'email', label: 'Email', sortable: true },
    { id: 'phone', key: 'phone', label: 'Phone', sortable: true },
    { id: 'serviceTypes', key: 'serviceTypes', label: 'Services', sortable: false },
    { id: 'printingMethods', key: 'printingMethods', label: 'Printing Methods', sortable: false },
    { id: 'pricing', key: 'pricing', label: 'Pricing Info', sortable: false },
    { id: 'location', key: 'location', label: 'Location', sortable: true },
    { id: 'moq', key: 'moq', label: 'MOQ', sortable: true },
    { id: 'certifications', key: 'certifications', label: 'Certifications', sortable: false },
    { id: 'reputation', key: 'reputation', label: 'Reputation', sortable: true },
    { id: 'status', key: 'status', label: 'Status', sortable: true },
    { id: 'aiEntityType', key: 'aiEntityType', label: 'Entity Type (AI)', sortable: true },
    { id: 'aiEntityConfidence', key: 'aiEntityConfidence', label: 'AI Confidence', sortable: true },
    { id: 'aiEntityRationale', key: 'aiEntityRationale', label: 'AI Rationale', sortable: false },
    { id: 'aiExtractionGuide', key: 'aiExtractionGuide', label: 'AI Extraction Guide', sortable: false },
    { id: 'aiIntent', key: 'aiIntent', label: 'AI Intent', sortable: false },
    { id: 'compliance', key: 'compliance', label: 'Compliance', sortable: false },
    { id: 'actions', key: 'actions', label: 'Actions', sortable: false, required: true }
  ];

  // Use props for visibleColumns, columnOrder, and handlers. No local state or duplicate logic.
const orderedColumns = columnOrder.map(key => availableColumns.find(col => col.key === key)).filter(Boolean);
const visibleOrderedColumns = orderedColumns.filter(col => visibleColumns.includes(col.key));

  // Filter and search results
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(result => 
        Object.values(result.extractedData || {}).some(value => 
          value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(result => {
          const fieldValue = result.extractedData?.[key];
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(value);
          }
          return fieldValue === value;
        });
      }
    });

    return filtered;
  }, [results, searchTerm, filters]);

  // Paginated results
  const paginatedResults = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredResults.slice(start, start + rowsPerPage);
  }, [filteredResults, page, rowsPerPage]);

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectionChange(filteredResults.map(result => result._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectResult = (resultId, checked) => {
    if (checked) {
      onSelectionChange([...selectedResults, resultId]);
    } else {
      onSelectionChange(selectedResults.filter(id => id !== resultId));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-gray-100 text-gray-800', 
        icon: null 
      },
      validated: { 
        color: 'bg-green-100 text-green-800', 
        icon: <CheckCircleIcon className="w-4 h-4" /> 
      },
      invalid: { 
        color: 'bg-red-100 text-red-800', 
        icon: <XCircleIcon className="w-4 h-4" /> 
      },
      needs_review: { 
        color: 'bg-yellow-100 text-yellow-800', 
        icon: <ExclamationTriangleIcon className="w-4 h-4" /> 
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.icon}
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const renderCellValue = (columnId, result) => {
    // Unified error/status handling for all columns
    const data = result.extractedData || result;
    if (columnId === 'status') {
      // Show error if present, else status badge or extraction status
      const error = result.error || data.error;
      if (error && error.message) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4" />
            {error.message}
          </span>
        );
      }
      if (data.status) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {data.status}
          </span>
        );
      }
      return getStatusBadge(result.validationStatus || 'pending');
    }
    // All other columns: prefer extractedData, fallback to result
    switch (columnId) {
      case 'name':
        return data.companyName || data.name || 'Unknown';
      case 'website':
        return data.website ? (
          <a
            href={data.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline truncate max-w-xs"
          >
            {data.website}
          </a>
        ) : '-';
      case 'email':
        return data.email ? (
          <a
            href={`mailto:${data.email}`}
            className="text-blue-600 hover:underline truncate max-w-xs"
          >
            {data.email}
          </a>
        ) : '-';
      case 'phone':
        return data.phone || '-';
      case 'serviceTypes':
        return Array.isArray(data.serviceTypes) && data.serviceTypes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {data.serviceTypes.slice(0, 2).map((service, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {service}
              </span>
            ))}
            {data.serviceTypes.length > 2 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                +{data.serviceTypes.length - 2}
              </span>
            )}
          </div>
        ) : '-';
      case 'printingMethods':
        return Array.isArray(data.printingMethods) && data.printingMethods.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {data.printingMethods.slice(0, 2).map((method, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
              >
                {method}
              </span>
            ))}
            {data.printingMethods.length > 2 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                +{data.printingMethods.length - 2}
              </span>
            )}
          </div>
        ) : '-';
      case 'pricing':
        if (Array.isArray(data.priceRanges) && data.priceRanges.length > 0) {
          return (
            <ul className="text-xs space-y-1">
              {data.priceRanges.map((pr, idx) => (
                <li key={idx}>
                  {pr.minPrice === pr.maxPrice
                    ? `${pr.minPrice} ${pr.currency}${pr.unit ? ' / ' + pr.unit : ''}`
                    : `${pr.minPrice} - ${pr.maxPrice} ${pr.currency}${pr.unit ? ' / ' + pr.unit : ''}`}
                </li>
              ))}
            </ul>
          );
        }
        return '-';
      case 'location': {
        if (data.address && (data.address.city || data.address.country)) {
          return [data.address.city, data.address.country].filter(Boolean).join(', ');
        }
        if (data.city || data.country) {
          return [data.city, data.country].filter(Boolean).join(', ');
        }
        return '-';
      }
      case 'moq':
        return data.moq || '-';
      case 'certifications':
        return Array.isArray(data.certifications) && data.certifications.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {data.certifications.slice(0, 2).map((cert, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded"
              >
                {cert}
              </span>
            ))}
            {data.certifications.length > 2 && (
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                +{data.certifications.length - 2}
              </span>
            )}
          </div>
        ) : '-';
      case 'reputation':
        return data.reputation ? (
          <div>
            {data.reputation.rating && (
              <div className="text-sm">
                ⭐ {data.reputation.rating}
                {data.reputation.totalReviews && ` (${data.reputation.totalReviews})`}
              </div>
            )}
            {data.reputation.description && (
              <div className="text-xs text-gray-600 truncate max-w-xs">
                {data.reputation.description}
              </div>
            )}
          </div>
        ) : '-';
      case 'aiEntityType':
        return data.aiEntityType || '-';
      case 'aiEntityConfidence':
        return data.aiEntityConfidence != null ? `${data.aiEntityConfidence}%` : '-';
      case 'aiEntityRationale':
        return data.aiEntityRationale || '-';
      default:
        return data[columnId] || '-';
    }
  };

  const isAllSelected = filteredResults.length > 0 && 
    filteredResults.every(result => selectedResults.includes(result._id));
  const isIndeterminate = selectedResults.length > 0 && !isAllSelected;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg"></div>
          <div className="space-y-3 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filter Controls */}
      <div className="border-b border-gray-200 p-4 space-y-4">
        <SearchAndFilter
          onSearch={setSearchTerm}
          onFilter={setFilters}
          searchPlaceholder="Search research results..."
        />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''} found
            {selectedResults.length > 0 && ` • ${selectedResults.length} selected`}
          </div>
          
      <TableColumnManager
        columns={availableColumns}
        visibleColumns={visibleColumns}
        columnOrder={columnOrder}
        onVisibilityChange={onColumnsChange}
        onOrderChange={onOrderChange}
        onResetToDefault={onResetColumns}
      />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </th>
          {visibleOrderedColumns.map(column => (
            column.key === 'actions' ? null : (
              <th 
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.label}
              </th>
            )
          ))}
          {visibleOrderedColumns.some(col => col.key === 'actions') && (
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          )}
        </tr>
      </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedResults.length === 0 ? (
              <tr>
                <td 
                  colSpan={visibleOrderedColumns.length + 2}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  No research results found
                </td>
              </tr>
            ) : (
              paginatedResults.map((result) => (
                <tr key={result._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedResults.includes(result._id)}
                      onChange={(e) => handleSelectResult(result._id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  {visibleOrderedColumns.map(column => (
                    column.key === 'actions' ? null : (
                      <td 
                        key={column.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                      >
                        {renderCellValue(column.key, result)}
                      </td>
                    )
                  ))}
                  {visibleOrderedColumns.some(col => col.key === 'actions') && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onViewResult(result)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditResult(result)}
                          className="text-blue-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onValidateResult(result)}
                          className="text-green-400 hover:text-green-600 transition-colors"
                          title="Validate"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredResults.length > 0 && (
        <div className="border-t border-gray-200">
          <TablePagination
            totalItems={filteredResults.length}
            currentPage={page + 1}
            totalPages={Math.ceil(filteredResults.length / rowsPerPage)}
            itemsPerPage={rowsPerPage}
            onPageChange={p => setPage(p - 1)}
            onItemsPerPageChange={newRowsPerPage => {
              setRowsPerPage(newRowsPerPage);
              localStorage.setItem('researchTableRowsPerPage', newRowsPerPage.toString());
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ResearchResultTable;
