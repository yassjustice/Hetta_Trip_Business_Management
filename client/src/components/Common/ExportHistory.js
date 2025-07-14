import React, { useState } from 'react';
import {
  ClockIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const ExportHistory = ({ 
  history = [], 
  onReuse, 
  onClear,
  className = '' 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterFormat, setFilterFormat] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);

  // Mock history data if none provided (for demonstration)
  const mockHistory = history.length === 0 ? [
    {
      id: 1,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
      format: 'xlsx',
      filename: 'vendors_20250713_143000.xlsx',
      records: 245,
      columns: 8,
      fileSize: '1.2 MB',
      status: 'completed',
      downloadUrl: '#',
      settings: {
        selectedColumns: ['companyName', 'businessType', 'location', 'contact', 'status', 'rating'],
        includeMetadata: true,
        includeAnalytics: true
      }
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      format: 'csv',
      filename: 'vendor_contacts_20250713_123000.csv',
      records: 245,
      columns: 5,
      fileSize: '45 KB',
      status: 'completed',
      downloadUrl: '#',
      settings: {
        selectedColumns: ['companyName', 'contact', 'phone', 'website', 'location'],
        includeMetadata: false,
        includeAnalytics: false
      }
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      format: 'pdf',
      filename: 'vendor_status_report_20250712_150000.pdf',
      records: 245,
      columns: 4,
      fileSize: '890 KB',
      status: 'completed',
      downloadUrl: '#',
      settings: {
        selectedColumns: ['companyName', 'businessType', 'status', 'rating'],
        includeMetadata: true,
        includeAnalytics: true
      }
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
      format: 'json',
      filename: 'vendors_api_data_20250710_100000.json',
      records: 245,
      columns: 7,
      fileSize: '156 KB',
      status: 'failed',
      error: 'Network timeout during export',
      settings: {
        selectedColumns: ['companyName', 'businessType', 'location', 'phone', 'website', 'status', 'rating'],
        includeMetadata: true,
        includeAnalytics: false
      }
    }
  ] : history;

  // Filter and sort data
  const filteredHistory = mockHistory.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.format.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = filterFormat === 'all' || item.format === filterFormat;
    return matchesSearch && matchesFormat;
  });

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'timestamp') {
      aVal = new Date(aVal);
      bVal = new Date(bVal);
    }
    
    if (sortDirection === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });

  // Format helpers
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusBadge = (status, error = null) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {status}
        {error && (
          <span className="ml-1" title={error}>ⓘ</span>
        )}
      </span>
    );
  };

  const getFormatIcon = (format) => {
    const icons = {
      xlsx: '📊',
      csv: '📄',
      pdf: '📋',
      json: '🔧',
      xml: '📝'
    };
    return icons[format] || '📄';
  };

  // Event handlers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === sortedHistory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedHistory.map(item => item.id));
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} export(s) from history?`)) {
      // In a real app, this would call an API to delete the selected items
      setSelectedItems([]);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Export History</h3>
          <p className="text-sm text-gray-500">
            View and manage your recent export activity
          </p>
        </div>
        
        {mockHistory.length > 0 && (
          <div className="flex items-center space-x-2">
            {selectedItems.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                Delete ({selectedItems.length})
              </button>
            )}
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-3 w-3 mr-1" />
              Filters
            </button>
            
            {onClear && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all export history?')) {
                    onClear();
                  }
                }}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <TrashIcon className="h-3 w-3 mr-1" />
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search filename or format..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Format Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                value={filterFormat}
                onChange={(e) => setFilterFormat(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Formats</option>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">PDF (.pdf)</option>
                <option value="json">JSON (.json)</option>
                <option value="xml">XML (.xml)</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterFormat('all');
                  setSortField('timestamp');
                  setSortDirection('desc');
                }}
                className="w-full text-xs text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      {sortedHistory.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === sortedHistory.length && sortedHistory.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </th>
                  <th
                    onClick={() => handleSort('filename')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      File
                      {sortField === 'filename' && (
                        sortDirection === 'asc' 
                          ? <ChevronUpIcon className="h-3 w-3 ml-1" />
                          : <ChevronDownIcon className="h-3 w-3 ml-1" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('timestamp')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      Date
                      {sortField === 'timestamp' && (
                        sortDirection === 'asc' 
                          ? <ChevronUpIcon className="h-3 w-3 ml-1" />
                          : <ChevronDownIcon className="h-3 w-3 ml-1" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getFormatIcon(item.format)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {item.filename}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.format.toUpperCase()} • {item.fileSize}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {formatTimestamp(item.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {item.records.toLocaleString()} records
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.columns} columns
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(item.status, item.error)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {item.status === 'completed' && (
                          <>
                            <button
                              onClick={() => onReuse && onReuse(item)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                              title="Reuse settings"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                            <a
                              href={item.downloadUrl}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                              title="Download again"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </a>
                          </>
                        )}
                        <button
                          onClick={() => {
                            // Show export details in modal
                            alert(`Export Details:\n\nColumns: ${item.settings.selectedColumns.join(', ')}\nMetadata: ${item.settings.includeMetadata ? 'Yes' : 'No'}\nAnalytics: ${item.settings.includeAnalytics ? 'Yes' : 'No'}`);
                          }}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50"
                          title="View details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Export History
          </h3>
          <p className="text-sm text-gray-500">
            {searchTerm || filterFormat !== 'all' 
              ? 'No exports match your current filters'
              : 'Your export history will appear here after you complete exports'
            }
          </p>
          {(searchTerm || filterFormat !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterFormat('all');
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Statistics */}
      {sortedHistory.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Export Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Total Exports:</span>
              <span className="ml-2 text-blue-700">{mockHistory.length}</span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Successful:</span>
              <span className="ml-2 text-blue-700">
                {mockHistory.filter(item => item.status === 'completed').length}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Most Used Format:</span>
              <span className="ml-2 text-blue-700 uppercase">
                {mockHistory.reduce((acc, item) => {
                  acc[item.format] = (acc[item.format] || 0) + 1;
                  return acc;
                }, {})}
                {Object.entries(mockHistory.reduce((acc, item) => {
                  acc[item.format] = (acc[item.format] || 0) + 1;
                  return acc;
                }, {})).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-blue-800">Total Records:</span>
              <span className="ml-2 text-blue-700">
                {mockHistory.reduce((total, item) => total + item.records, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportHistory;
