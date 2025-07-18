import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { vendorAPI } from '../../services/api';

// Default table columns configuration
export const DEFAULT_COLUMNS = [
  { key: 'companyName', label: 'Company', description: 'Company name and establishment year', minWidth: '200px', required: true },
  { key: 'businessType', label: 'Type', description: 'Business type', minWidth: '120px' },
  { key: 'location', label: 'Location', description: 'Country and region', minWidth: '140px' },
  { key: 'city', label: 'City', description: 'City location', minWidth: '120px' },
  { key: 'phone', label: 'Phone', description: 'Contact phone number', minWidth: '140px' },
  { key: 'website', label: 'Website', description: 'Company website', minWidth: '150px' },
  { key: 'contact', label: 'Contact', description: 'Contact person and email', minWidth: '160px' },
  { key: 'products', label: 'Products', description: 'Product categories', minWidth: '180px' },
  { key: 'serviceTypes', label: 'Services', description: 'Service types offered', minWidth: '160px' },
  { key: 'printingMethods', label: 'Printing', description: 'Printing methods', minWidth: '150px' },
  { key: 'moq', label: 'MOQ', description: 'Minimum order quantity', minWidth: '100px' },
  { key: 'priceRange', label: 'Price Range', description: 'Pricing information', minWidth: '120px' },
  { key: 'certifications', label: 'Certifications', description: 'Quality certifications', minWidth: '140px' },
  { key: 'status', label: 'Status', description: 'Sourcing status', minWidth: '120px', required: true, editable: true },
  { key: 'rating', label: 'Rating', description: 'Overall rating', minWidth: '100px' },
  { key: 'actions', label: 'Actions', description: 'Available actions', minWidth: '120px', required: true }
];

// Filter options configuration
export const FILTER_OPTIONS = [
  {
    key: 'businessType',
    label: 'Business Type',
    type: 'select',
    options: [
      { value: 'Manufacturer', label: 'Manufacturer' },
      { value: 'Supplier', label: 'Supplier' },
      { value: 'Wholesaler', label: 'Wholesaler' },
      { value: 'Agent', label: 'Agent' },
      { value: 'Trading Company', label: 'Trading Company' }
    ]
  },
  {
    key: 'country',
    label: 'Country',
    type: 'select',
    options: [
      { value: 'China', label: 'China' },
      { value: 'India', label: 'India' },
      { value: 'Bangladesh', label: 'Bangladesh' },
      { value: 'Vietnam', label: 'Vietnam' },
      { value: 'Turkey', label: 'Turkey' },
      { value: 'Pakistan', label: 'Pakistan' },
      { value: 'Italy', label: 'Italy' },
      { value: 'Portugal', label: 'Portugal' },
      { value: 'Thailand', label: 'Thailand' },
      { value: 'Indonesia', label: 'Indonesia' }
    ]
  },
  {
    key: 'sourcingStatus',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'New Lead', label: 'New Lead' },
      { value: 'Contacted', label: 'Contacted' },
      { value: 'Sample Requested', label: 'Sample Requested' },
      { value: 'Under Evaluation', label: 'Under Evaluation' },
      { value: 'Approved', label: 'Approved' },
      { value: 'Rejected', label: 'Rejected' }
    ]
  },
  {
    key: 'priceRange',
    label: 'Price Range',
    type: 'select',
    options: [
      { value: 'Budget', label: 'Budget' },
      { value: 'Mid-range', label: 'Mid-range' },
      { value: 'Premium', label: 'Premium' },
      { value: 'Luxury', label: 'Luxury' }
    ]
  },
  {
    key: 'productCategory',
    label: 'Product Category',
    type: 'select',
    options: [
      { value: 'Cotton Fabrics', label: 'Cotton Fabrics' },
      { value: 'Silk Fabrics', label: 'Silk Fabrics' },
      { value: 'Wool Fabrics', label: 'Wool Fabrics' },
      { value: 'Synthetic Fabrics', label: 'Synthetic Fabrics' },
      { value: 'Denim', label: 'Denim' },
      { value: 'Knitted Fabrics', label: 'Knitted Fabrics' },
      { value: 'Technical Textiles', label: 'Technical Textiles' },
      { value: 'Home Textiles', label: 'Home Textiles' },
      { value: 'Garment Manufacturing', label: 'Garment Manufacturing' },
      { value: 'Yarn', label: 'Yarn' },
      { value: 'Accessories', label: 'Accessories' },
      { value: 'Trims', label: 'Trims' }
    ]
  },
  {
    key: 'minRating',
    label: 'Minimum Rating',
    type: 'select',
    options: [
      { value: '1', label: '1+ Stars' },
      { value: '2', label: '2+ Stars' },
      { value: '3', label: '3+ Stars' },
      { value: '4', label: '4+ Stars' },
      { value: '5', label: '5 Stars' }
    ]
  }
];

export const useVendorState = () => {
  // Main data state
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  
  // View and display state
  const [viewType, setViewType] = useState(() => {
    return localStorage.getItem('vendorViewType') || 'cards';
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    return parseInt(localStorage.getItem('vendorItemsPerPage')) || 10;
  });
  
  // Table column management state
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('vendorTableColumns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS.map(col => col.key);
  });
  
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem('vendorColumnOrder');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS.map(col => col.key);
  });

  // Status editing state
  const [statusEditingEnabled, setStatusEditingEnabled] = useState(() => {
    const saved = localStorage.getItem('vendorStatusEditingEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [editingStatus, setEditingStatus] = useState(null); // {vendorId, status}

  // Load search suggestions from existing vendors
  useEffect(() => {
    const suggestions = [];
    
    vendors.forEach(vendor => {
      // Add company names
      if (vendor.companyName) {
        suggestions.push(vendor.companyName);
      }
      
      // Add contact person names
      if (vendor.contactPerson?.name) {
        suggestions.push(vendor.contactPerson.name);
      }
      
      // Add countries
      if (vendor.address?.country) {
        suggestions.push(vendor.address.country);
      }
      
      // Add cities
      if (vendor.address?.city) {
        suggestions.push(vendor.address.city);
      }
      
      // Add business types
      if (vendor.businessType) {
        suggestions.push(vendor.businessType);
      }
      
      // Add product categories
      if (vendor.productCategories) {
        suggestions.push(...vendor.productCategories);
      }
      
      // Add tags
      if (vendor.tags) {
        suggestions.push(...vendor.tags);
      }
    });
    
    // Remove duplicates and sort
    const uniqueSuggestions = [...new Set(suggestions)].sort();
    setSearchSuggestions(uniqueSuggestions);
  }, [vendors]);

  // Load vendors from API
  const loadVendors = useCallback(async () => {
    try {
      setIsSearching(true);
      setSearchError(null);
      
      // Build search parameters properly
      const params = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      // Add search query
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      // Add sorting parameters
      if (sortConfig.key) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction;
      }
      
      // Add individual filters
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          params[key] = value;
        }
      });
      
      const response = await vendorAPI.getAll(params);
      const vendorData = response.data.vendors || [];
      setVendors(vendorData);
      setPagination(response.data.pagination || {});
      
      // Track search results for better UX
      if (searchQuery?.trim() || Object.keys(activeFilters).length > 0) {
        setSearchResults({
          query: searchQuery?.trim() || '',
          filters: activeFilters,
          count: vendorData.length,
          total: response.data.pagination?.total || vendorData.length
        });
      } else {
        setSearchResults(null);
      }
    } catch (error) {
      console.error('Error loading vendors:', error);
      const errorMessage = error.response?.data?.message || 'Failed to search vendors. Please try again.';
      setSearchError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [searchQuery, activeFilters, currentPage, itemsPerPage, sortConfig]);

  // Effect to load vendors when dependencies change
  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Action handlers
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
    setSearchError(null); // Clear any previous search errors
  }, []);

  const handleFilter = useCallback((filters) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page on filter change
    setSearchError(null); // Clear any previous search errors
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilters({});
    setCurrentPage(1); // Reset to first page
    setSearchResults(null);
    setSearchError(null);
  }, []);

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      await vendorAPI.delete(vendorId);
      toast.success('Vendor deleted successfully');
      loadVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  // View and display handlers
  const handleViewChange = (newViewType) => {
    setViewType(newViewType);
    localStorage.setItem('vendorViewType', newViewType);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    localStorage.setItem('vendorItemsPerPage', newItemsPerPage.toString());
  };

  // Column management handlers
  const handleColumnVisibilityChange = (newVisibleColumns) => {
    setVisibleColumns(newVisibleColumns);
    localStorage.setItem('vendorTableColumns', JSON.stringify(newVisibleColumns));
  };

  const handleColumnOrderChange = (newOrder) => {
    setColumnOrder(newOrder);
    localStorage.setItem('vendorColumnOrder', JSON.stringify(newOrder));
  };

  const handleResetColumns = () => {
    const defaultVisible = DEFAULT_COLUMNS.map(col => col.key);
    const defaultOrder = DEFAULT_COLUMNS.map(col => col.key);
    setVisibleColumns(defaultVisible);
    setColumnOrder(defaultOrder);
    localStorage.removeItem('vendorTableColumns');
    localStorage.removeItem('vendorColumnOrder');
  };

  // Status editing handlers
  const handleStatusEditingToggle = (enabled) => {
    setStatusEditingEnabled(enabled);
    localStorage.setItem('vendorStatusEditingEnabled', JSON.stringify(enabled));
    if (!enabled) {
      setEditingStatus(null); // Clear any active editing
    }
  };

  const handleStatusEdit = (vendorId, newStatus) => {
    setEditingStatus({ vendorId, status: newStatus });
  };

  const handleStatusSave = async (vendorId, newStatus) => {
    try {
      await vendorAPI.update(vendorId, { sourcingStatus: newStatus });
      
      // Update local state
      setVendors(prevVendors => 
        prevVendors.map(vendor => 
          vendor._id === vendorId 
            ? { ...vendor, sourcingStatus: newStatus }
            : vendor
        )
      );
      
      setEditingStatus(null);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating vendor status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleStatusCancel = () => {
    setEditingStatus(null);
  };

  return {
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
    handleStatusCancel,
    handleStatusEditingToggle,
    handleStatusEdit,
    handleStatusSave,
    handleStatusCancel
  };
};

export default useVendorState;
