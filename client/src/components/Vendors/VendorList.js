import React from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import SearchAndFilter from '../Common/SearchAndFilter';
import TablePagination from '../Common/TablePagination';
import VendorListHeader from './VendorListHeader';
import VendorCard from './VendorCard';
import VendorCompactList from './VendorCompactList';
import VendorTable from './VendorTable';
import VendorEmptyState from './VendorEmptyState';
import VendorErrorState from './VendorErrorState';
import useVendorState, { DEFAULT_COLUMNS, FILTER_OPTIONS } from './useVendorState';

import BulkVendorImport from './BulkVendorImport';

const VendorList = () => {
  const {
    // State
    vendors,
    loading,
    pagination,
    searchQuery,
    activeFilters,
    searchResults,
    isSearching,
    searchError,
    searchSuggestions,
    viewType,
    sortConfig,
    currentPage,
    itemsPerPage,
    visibleColumns,
    columnOrder,
    statusEditingEnabled,
    editingStatus,
    
    // Actions
    loadVendors,
    handleSearch,
    handleFilter,
    clearAllFilters,
    handleDeleteVendor,
    handleViewChange,
    handleSort,
    handlePageChange,
    handleItemsPerPageChange,
    handleColumnVisibilityChange,
    handleColumnOrderChange,
    handleResetColumns,
    handleStatusEditingToggle,
    handleStatusEdit,
    handleStatusSave,
    handleStatusCancel
  } = useVendorState();

  // Sort vendors based on current sort config - Use server-side sorting instead
  const sortedVendors = React.useMemo(() => {
    // For now, return vendors as-is since we'll implement server-side sorting
    // The sort config will be sent to the backend via API params
    return vendors;
  }, [vendors]);

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" text="Loading vendors..." />;
  }

  return (
    <div className="space-y-6">
      {/* Bulk Import UI */}
      <BulkVendorImport onImport={loadVendors} />
      {/* Header */}
      <VendorListHeader
        vendors={vendors}
        searchResults={searchResults}
        viewType={viewType}
        onViewChange={handleViewChange}
        defaultColumns={DEFAULT_COLUMNS}
        visibleColumns={visibleColumns}
        columnOrder={columnOrder}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        onColumnOrderChange={handleColumnOrderChange}
        onResetColumns={handleResetColumns}
        statusEditingEnabled={statusEditingEnabled}
        onStatusEditingToggle={handleStatusEditingToggle}
        searchQuery={searchQuery}
        activeFilters={activeFilters}
      />

      {/* Search and Filters */}
      <SearchAndFilter
        onSearch={handleSearch}
        onFilter={handleFilter}
        searchPlaceholder="Search vendors by name, contact, location, products, tags, or description..."
        filters={FILTER_OPTIONS}
        clearFilters={clearAllFilters}
        isLoading={isSearching}
        searchSuggestions={searchSuggestions}
        showResultsCount={false} // We handle this in the header
        resultText={searchResults ? `${searchResults.count} results` : ''}
      />

      {/* Search Error */}
      <VendorErrorState
        searchError={searchError}
        onRetry={() => {
          loadVendors();
        }}
        onClearError={() => {
          // Clear error and retry
          loadVendors();
        }}
      />

      {/* Vendors Display */}
      {isSearching ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Searching vendors..." />
        </div>
      ) : vendors.length === 0 ? (
        <VendorEmptyState
          searchResults={searchResults}
          onClearFilters={clearAllFilters}
        />
      ) : (
        <>
          {/* Vendor Display Based on View Type */}
          {viewType === 'cards' && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedVendors.map((vendor) => (
                <VendorCard 
                  key={vendor._id} 
                  vendor={vendor} 
                  onDelete={handleDeleteVendor}
                />
              ))}
            </div>
          )}

          {viewType === 'list' && (
            <VendorCompactList 
              vendors={sortedVendors}
              onDelete={handleDeleteVendor}
            />
          )}

          {viewType === 'table' && (
            <div className="overflow-hidden">
              <VendorTable 
                vendors={sortedVendors}
                onDelete={handleDeleteVendor}
                sortConfig={sortConfig}
                onSort={handleSort}
                visibleColumns={visibleColumns}
                columnOrder={columnOrder}
                columns={DEFAULT_COLUMNS}
                statusEditingEnabled={statusEditingEnabled}
                editingStatus={editingStatus}
                onStatusEdit={handleStatusEdit}
                onStatusSave={handleStatusSave}
                onStatusCancel={handleStatusCancel}
              />
            </div>
          )}

          {/* Enhanced Pagination */}
          <TablePagination
            currentPage={pagination.currentPage || 1}
            totalPages={pagination.totalPages || 1}
            totalItems={pagination.total || 0}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            searchQuery={searchQuery}
            searchFilters={activeFilters}
            showQuickJump={true}
            showItemsPerPage={true}
          />
        </>
      )}
    </div>
  );
};

export default VendorList;
