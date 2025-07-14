import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  AdjustmentsVerticalIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const ExportPreview = ({ 
  data = [], 
  columns = [], 
  config = {}, 
  onGenerate,
  className = ''
}) => {
  const [previewData, setPreviewData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // table, raw, summary
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Generate preview data
  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get selected columns
      const selectedColumns = columns.filter(col => 
        config.selectedColumns?.includes(col.key)
      );

      // Process data similar to export logic
      const processedData = data.slice(0, 50).map(row => {
        const previewRow = {};
        selectedColumns.forEach(column => {
          let value;
          
          switch (column.key) {
            case 'companyName':
              value = row.companyName;
              break;
            case 'businessType':
              value = row.businessType;
              break;
            case 'location':
              value = row.address?.country || '';
              break;
            case 'city':
              value = row.address?.city || '';
              break;
            case 'phone':
              value = row.contactPerson?.phone || '';
              break;
            case 'website':
              value = row.website || '';
              break;
            case 'contact':
              value = `${row.contactPerson?.name || ''} (${row.contactPerson?.email || ''})`;
              break;
            case 'products':
              value = row.productCategories?.join(', ') || '';
              break;
            case 'status':
              value = row.sourcingStatus || '';
              break;
            case 'rating':
              value = row.rating?.overall || '';
              break;
            default:
              value = getNestedValue(row, column.key);
          }
          
          previewRow[column.label] = formatCellValue(value, column);
        });
        return previewRow;
      });

      setPreviewData(processedData);
      if (onGenerate) onGenerate(processedData);
    } catch (error) {
      console.error('Preview generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper functions
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const formatCellValue = (value, column) => {
    if (value === null || value === undefined) return '';
    
    switch (column.type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(value);
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'boolean':
        return value ? 'Yes' : 'No';
      case 'array':
        return Array.isArray(value) ? value.join(', ') : value;
      case 'object':
        return typeof value === 'object' ? JSON.stringify(value) : value;
      default:
        return String(value);
    }
  };

  // Filter and sort preview data
  const getFilteredData = () => {
    let filtered = [...previewData];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (sortDirection === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    return filtered;
  };

  // Auto-generate preview when config changes
  useEffect(() => {
    if (data.length > 0 && config.selectedColumns?.length > 0) {
      generatePreview();
    }
  }, [data, config.selectedColumns, config.format]);

  const filteredData = getFilteredData();
  const selectedColumns = columns.filter(col => 
    config.selectedColumns?.includes(col.key)
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Export Preview</h3>
          <p className="text-sm text-gray-500">
            Preview of {filteredData.length} records (showing first 50 max)
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs font-medium rounded-l-md border ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <TableCellsIcon className="h-3 w-3 mr-1 inline" />
              Table
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-xs font-medium border-t border-b ${
                viewMode === 'raw'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <DocumentTextIcon className="h-3 w-3 mr-1 inline" />
              Raw
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1 text-xs font-medium rounded-r-md border ${
                viewMode === 'summary'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <EyeIcon className="h-3 w-3 mr-1 inline" />
              Summary
            </button>
          </div>
          
          <button
            onClick={generatePreview}
            disabled={isGenerating}
            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-3 w-3 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search preview..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <AdjustmentsVerticalIcon className="h-3 w-3 mr-1" />
            Filters
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          Format: {config.format?.toUpperCase()} • {selectedColumns.length} columns
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Preview Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sort Field */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortField || ''}
                onChange={(e) => setSortField(e.target.value || null)}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No sorting</option>
                {selectedColumns.map(col => (
                  <option key={col.key} value={col.label}>{col.label}</option>
                ))}
              </select>
            </div>
            
            {/* Sort Direction */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Direction
              </label>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value)}
                disabled={!sortField}
                className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
            
            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSortField(null);
                  setSortDirection('asc');
                }}
                className="w-full text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="border border-gray-200 rounded-lg">
        {isGenerating ? (
          <div className="flex items-center justify-center py-12">
            <ArrowPathIcon className="h-6 w-6 text-gray-400 animate-spin mr-3" />
            <span className="text-sm text-gray-600">Generating preview...</span>
          </div>
        ) : previewData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <EyeIcon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600">No preview data available</p>
              <p className="text-xs text-gray-500 mt-1">
                Select columns and data to generate preview
              </p>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedColumns.map(col => (
                        <th
                          key={col.key}
                          onClick={() => {
                            if (sortField === col.label) {
                              setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                            } else {
                              setSortField(col.label);
                              setSortDirection('asc');
                            }
                          }}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            {col.label}
                            {sortField === col.label && (
                              sortDirection === 'asc' 
                                ? <ChevronUpIcon className="h-3 w-3 ml-1" />
                                : <ChevronDownIcon className="h-3 w-3 ml-1" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {selectedColumns.map(col => (
                          <td key={col.key} className="px-4 py-2 text-xs text-gray-900 max-w-xs truncate">
                            {row[col.label]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'raw' && (
              <div className="p-4">
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto max-h-96">
                  {JSON.stringify(filteredData.slice(0, 10), null, 2)}
                </pre>
                {filteredData.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing first 10 records. Full export will include all {filteredData.length} records.
                  </p>
                )}
              </div>
            )}

            {viewMode === 'summary' && (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-blue-900">{filteredData.length}</div>
                    <div className="text-xs text-blue-700">Records</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-green-900">{selectedColumns.length}</div>
                    <div className="text-xs text-green-700">Columns</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-purple-900">
                      {Math.ceil(filteredData.length * selectedColumns.length * 0.05)}KB
                    </div>
                    <div className="text-xs text-purple-700">Est. Size</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-orange-900">{config.format?.toUpperCase()}</div>
                    <div className="text-xs text-orange-700">Format</div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Column Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedColumns.map(col => {
                      const values = filteredData.map(row => row[col.label]).filter(v => v !== null && v !== '');
                      const uniqueValues = [...new Set(values)];
                      
                      return (
                        <div key={col.key} className="bg-gray-50 p-3 rounded-md">
                          <div className="text-sm font-medium text-gray-900">{col.label}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {values.length} filled • {uniqueValues.length} unique
                          </div>
                          <div className="text-xs text-gray-500">
                            Fill rate: {((values.length / filteredData.length) * 100).toFixed(1)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
          <span>
            Showing {filteredData.length} of {previewData.length} preview records
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </span>
          <span>
            Export will include all {data.length} records from source data
          </span>
        </div>
      )}
    </div>
  );
};

export default ExportPreview;
