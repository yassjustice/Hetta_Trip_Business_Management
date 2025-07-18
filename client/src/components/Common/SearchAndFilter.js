import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const SearchAndFilter = ({ 
  onSearch, 
  onFilter, 
  searchPlaceholder = "Search...", 
  filters = [],
  clearFilters,
  isLoading = false,
  searchSuggestions = [],
  showResultsCount = true,
  resultText = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Handle search suggestions (fixed to prevent infinite update loop)
  useEffect(() => {
    if (searchTerm && searchSuggestions.length > 0) {
      const filtered = searchSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchTerm.toLowerCase()) &&
        suggestion.toLowerCase() !== searchTerm.toLowerCase()
      ).slice(0, 5); // Limit to 5 suggestions

      // Only update state if values actually change to prevent infinite loop
      let shouldUpdateSuggestions = false;
      if (filteredSuggestions.length !== filtered.length) {
        shouldUpdateSuggestions = true;
      } else {
        for (let i = 0; i < filtered.length; i++) {
          if (filteredSuggestions[i] !== filtered[i]) {
            shouldUpdateSuggestions = true;
            break;
          }
        }
      }
      if (shouldUpdateSuggestions) {
        setFilteredSuggestions(filtered);
      }

      const nextShowSuggestions = filtered.length > 0 && searchTerm.length > 1;
      if (showSuggestions !== nextShowSuggestions) {
        setShowSuggestions(nextShowSuggestions);
      }

      if (selectedSuggestionIndex !== -1) {
        setSelectedSuggestionIndex(-1);
      }
    } else {
      if (showSuggestions !== false) setShowSuggestions(false);
      if (filteredSuggestions.length !== 0) setFilteredSuggestions([]);
      if (selectedSuggestionIndex !== -1) setSelectedSuggestionIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, searchSuggestions]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    
    searchTimeoutRef.current = setTimeout(() => {
      if (typeof onSearch === 'function') {
        onSearch(searchTerm);
      }
      setIsSearching(false);
    }, 300);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      setIsSearching(false);
    };
  }, [searchTerm]); // Only searchTerm as dependency, and guard onSearch

  const handleFilterChange = useCallback((filterKey, value) => {
    setActiveFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      if (value === '' || value === null || value === undefined) {
        delete newFilters[filterKey];
      } else {
        newFilters[filterKey] = value;
      }
      if (onFilter) {
        onFilter(newFilters);
      }
      return newFilters;
    });
  }, [onFilter]);


  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
    setShowSuggestions(false);
    if (typeof onFilter === 'function') onFilter({});
    if (typeof clearFilters === 'function') clearFilters();
    // Focus search input after clearing
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const clearSearchOnly = () => {
    setSearchTerm('');
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  const handleSearchKeyDown = (e) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex]);
          } else {
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          searchInputRef.current?.blur();
          break;
        case 'Tab':
          setShowSuggestions(false);
          break;
        default:
          break;
      }
    } else {
      switch (e.key) {
        case 'Escape':
          setSearchTerm('');
          searchInputRef.current?.blur();
          break;
        default:
          break;
      }
    }
  };

  const handleSearchFocus = () => {
    if (searchTerm && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const activeFilterCount = Object.keys(activeFilters).length;
  const hasActiveSearch = searchTerm.length > 0;
  const showLoadingIndicator = isLoading || isSearching;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative" ref={suggestionsRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className={`h-5 w-5 transition-colors ${showLoadingIndicator ? 'text-blue-500' : 'text-gray-400'}`} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={handleSearchFocus}
            className={`block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all duration-200 ${
              hasActiveSearch ? 'ring-1 ring-blue-200' : ''
            } ${showSuggestions ? 'rounded-b-none' : ''}`}
          />
          
          {/* Loading indicator */}
          {showLoadingIndicator && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
          
          {/* Clear search button */}
          {hasActiveSearch && !showLoadingIndicator && (
            <button
              onClick={clearSearchOnly}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              title="Clear search (Esc)"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}

          {/* Search Suggestions */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 border-t-0 rounded-b-md shadow-lg max-h-60 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors ${
                    index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="truncate">{suggestion}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              activeFilterCount > 0 
                ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-medium">
                {activeFilterCount}
              </span>
            )}
            <ChevronDownIcon className={`ml-1 h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {(hasActiveSearch || activeFilterCount > 0) && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              title="Clear all filters and search"
            >
              <XMarkIcon className="h-4 w-4 mr-2" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Search Results Info */}
      {showResultsCount && (hasActiveSearch || activeFilterCount > 0) && (
        <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center flex-wrap gap-2">
            {hasActiveSearch && (
              <div className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                <MagnifyingGlassIcon className="h-3 w-3 mr-1" />
                <span className="font-medium">"{searchTerm}"</span>
                <button
                  onClick={clearSearchOnly}
                  className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                  title="Clear search"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </div>
            )}
            {activeFilterCount > 0 && (
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
            {resultText && (
              <span className="text-gray-600">{resultText}</span>
            )}
          </div>
          {showLoadingIndicator && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-blue-600 font-medium">Searching...</span>
            </div>
          )}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.label}
                  {filter.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {filter.type === 'select' && (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {filter.type === 'range' && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={activeFilters[`${filter.key}_min`] || ''}
                      onChange={(e) => handleFilterChange(`${filter.key}_min`, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={activeFilters[`${filter.key}_max`] || ''}
                      onChange={(e) => handleFilterChange(`${filter.key}_max`, e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                    />
                  </div>
                )}
                {filter.type === 'multiselect' && (
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                    {filter.options.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={activeFilters[filter.key]?.includes(option.value) || false}
                          onChange={(e) => {
                            const currentValues = activeFilters[filter.key] || [];
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(v => v !== option.value);
                            handleFilterChange(filter.key, newValues.length > 0 ? newValues : null);
                          }}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Quick Clear Filters */}
          {activeFilterCount > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setActiveFilters({});
                  onFilter({});
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline focus:outline-none"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilter;
