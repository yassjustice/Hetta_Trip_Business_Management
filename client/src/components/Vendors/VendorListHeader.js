import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import TableColumnManager from '../Common/TableColumnManager';
import ExportManager from '../Common/ExportManager';

const VendorListHeader = ({ 
  vendors,
  searchResults,
  viewType,
  onViewChange,
  // Table column props
  defaultColumns,
  visibleColumns,
  columnOrder,
  onColumnVisibilityChange,
  onColumnOrderChange,
  onResetColumns,
  // Status editing props
  statusEditingEnabled,
  onStatusEditingToggle,
  // Search and filter props for export
  searchQuery = '',
  activeFilters = {}
}) => {
  return (
    <div className="md:flex md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          Vendors
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your textile and fashion production vendors
          {searchResults ? (
            <span className="font-medium text-gray-700">
              {searchResults.count === 0 ? (
                <span className="text-orange-600">
                  - No results found{searchResults.query ? ` for "${searchResults.query}"` : ''}
                  {Object.keys(searchResults.filters).length > 0 && ' with current filters'}
                </span>
              ) : searchResults.query && Object.keys(searchResults.filters).length > 0 ? (
                <span className="text-green-600">
                  - Found {searchResults.count} vendors matching "{searchResults.query}" with filters applied
                </span>
              ) : searchResults.query ? (
                <span className="text-green-600">
                  - Found {searchResults.count} vendors matching "{searchResults.query}"
                </span>
              ) : Object.keys(searchResults.filters).length > 0 ? (
                <span className="text-blue-600">
                  - {searchResults.count} vendors match current filters
                </span>
              ) : (
                <span>- Showing {searchResults.count} vendors</span>
              )}
              {searchResults.total !== searchResults.count && searchResults.count > 0 && (
                <span className="text-gray-500"> of {searchResults.total} total</span>
              )}
            </span>
          ) : (
            <span className="text-gray-600">- {vendors.length} total vendors</span>
          )}
        </p>
      </div>
      <div className="mt-4 md:mt-0 md:ml-4 flex items-center space-x-3">
        {/* View Toggle */}
        <div className="inline-flex rounded-md shadow-sm">
          <button
            onClick={() => onViewChange('cards')}
            className={`relative inline-flex items-center px-3 py-2 rounded-l-md text-sm font-medium border ${
              viewType === 'cards'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Squares2X2Icon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Cards</span>
          </button>
          <button
            onClick={() => onViewChange('list')}
            className={`relative inline-flex items-center px-3 py-2 text-sm font-medium border-t border-b ${
              viewType === 'list'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } ${viewType === 'cards' ? 'border-l-0' : 'border-l'}`}
          >
            <ListBulletIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={`relative inline-flex items-center px-3 py-2 rounded-r-md text-sm font-medium border-t border-r border-b ${
              viewType === 'table'
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            } ${viewType === 'list' ? 'border-l-0' : 'border-l'}`}
          >
            <TableCellsIcon className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Table</span>
          </button>
        </div>

        {/* Table Column Manager - Only show for table view */}
        {viewType === 'table' && (
          <TableColumnManager
            columns={defaultColumns}
            visibleColumns={visibleColumns}
            columnOrder={columnOrder}
            onVisibilityChange={onColumnVisibilityChange}
            onOrderChange={onColumnOrderChange}
            onResetToDefault={onResetColumns}
            storageKey="vendorTable"
            statusEditingEnabled={statusEditingEnabled}
            onStatusEditingToggle={onStatusEditingToggle}
          />
        )}

        {/* Export Manager */}
        <ExportManager
          data={vendors}
          columns={defaultColumns}
          visibleColumns={visibleColumns}
          fileName="vendors"
          title="Vendor Export"
          subtitle={`Export of ${vendors.length} vendors from Trip-Tex`}
          searchQuery={searchQuery}
          activeFilters={activeFilters}
          totalRecords={vendors.length}
        />
        
        <Link
          to="/vendors/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Vendor
        </Link>
      </div>
    </div>
  );
};

export default VendorListHeader;
