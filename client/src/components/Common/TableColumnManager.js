import React, { useState, useEffect } from 'react';
import {
  CogIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const TableColumnManager = ({ 
  columns = [], 
  visibleColumns = [], 
  columnOrder = [], 
  onVisibilityChange = () => {}, 
  onOrderChange = () => {}, 
  onResetToDefault = () => {},
  storageKey = 'table-columns',
  statusEditingEnabled = false,
  onStatusEditingToggle = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localColumns, setLocalColumns] = useState([]);

  // Initialize local columns based on current settings
  useEffect(() => {
    if (!columns || columns.length === 0) {
      setLocalColumns([]);
      return;
    }

    // If no columnOrder provided, use the order from columns array
    const effectiveOrder = columnOrder.length > 0 ? columnOrder : columns.map(col => col.key || col.id);
    
    const orderedColumns = effectiveOrder.map(key => {
      const column = columns.find(col => (col.key || col.id) === key);
      return column ? {
        ...column,
        visible: visibleColumns.includes(key)
      } : null;
    }).filter(Boolean);

    // Add any columns that weren't in the order
    const missingColumns = columns.filter(col => 
      !effectiveOrder.includes(col.key || col.id)
    ).map(col => ({
      ...col,
      visible: visibleColumns.includes(col.key || col.id)
    }));

    setLocalColumns([...orderedColumns, ...missingColumns]);
  }, [columns, visibleColumns, columnOrder]);

  const handleToggleVisibility = (columnKey) => {
    const newVisibleColumns = visibleColumns.includes(columnKey)
      ? visibleColumns.filter(key => key !== columnKey)
      : [...visibleColumns, columnKey];
    
    onVisibilityChange(newVisibleColumns);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const newColumns = [...localColumns];
    [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
    setLocalColumns(newColumns);
    
    const newOrder = newColumns.map(col => col.key);
    onOrderChange(newOrder);
  };

  const handleMoveDown = (index) => {
    if (index === localColumns.length - 1) return;
    
    const newColumns = [...localColumns];
    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    setLocalColumns(newColumns);
    
    const newOrder = newColumns.map(col => col.key);
    onOrderChange(newOrder);
  };

  const handleReset = () => {
    onResetToDefault();
    setIsOpen(false);
  };

  const visibleCount = localColumns.filter(col => col.visible).length;

  return (
    <div className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title="Manage Table Columns"
      >
        <CogIcon className="h-4 w-4 mr-2" />
        Columns ({visibleCount})
      </button>

      {/* Settings Modal/Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[32rem] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-gray-900">
                Manage Table Columns
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0">
              <div className="p-4 space-y-2">
                {localColumns.map((column, index) => (
                  <div
                    key={column.key || index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {/* Visibility Toggle */}
                      <button
                        onClick={() => handleToggleVisibility(column.key)}
                        className={`flex-shrink-0 p-1 rounded ${
                          column.visible
                            ? 'text-blue-600 hover:text-blue-800'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={column.visible ? 'Hide column' : 'Show column'}
                      >
                        {column.visible ? (
                          <EyeIcon className="h-4 w-4" />
                        ) : (
                          <EyeSlashIcon className="h-4 w-4" />
                        )}
                      </button>

                      {/* Column Info */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${
                          column.visible ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {column.label}
                        </div>
                        {column.description && (
                          <div className="text-xs text-gray-500 truncate">
                            {column.description}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Controls */}
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className={`p-1 rounded ${
                          index === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                        }`}
                        title="Move up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localColumns.length - 1}
                        className={`p-1 rounded ${
                          index === localColumns.length - 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                        }`}
                        title="Move down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Editing Settings */}
            {onStatusEditingToggle && (
              <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Status Editing
                    </div>
                    <div className="text-xs text-gray-500">
                      Allow inline editing of vendor status
                    </div>
                  </div>
                  <button
                    onClick={() => onStatusEditingToggle(!statusEditingEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      statusEditingEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        statusEditingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
              <div className="text-xs text-gray-500">
                {visibleCount} of {localColumns.length} columns visible
              </div>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TableColumnManager;
