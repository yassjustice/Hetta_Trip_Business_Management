import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ExportValidation = ({ data, selectedColumns, columns, format }) => {
  const validationResults = [];

  // Check data availability
  if (data.length === 0) {
    validationResults.push({
      type: 'error',
      message: 'No data available for export',
      suggestion: 'Make sure you have data loaded in the table'
    });
  }

  // Check column selection
  if (selectedColumns.length === 0) {
    validationResults.push({
      type: 'error',
      message: 'No columns selected for export',
      suggestion: 'Select at least one column to include in the export'
    });
  }

  // Check for large datasets
  if (data.length > 10000) {
    validationResults.push({
      type: 'warning',
      message: `Large dataset detected (${data.length.toLocaleString()} records)`,
      suggestion: 'Export may take longer than usual. Consider filtering data first.'
    });
  }

  // Check for wide datasets
  if (selectedColumns.length > 20) {
    validationResults.push({
      type: 'warning',
      message: `Many columns selected (${selectedColumns.length})`,
      suggestion: 'Consider reducing columns for better file readability'
    });
  }

  // Format-specific validations
  if (format === 'pdf' && selectedColumns.length > 8) {
    validationResults.push({
      type: 'warning',
      message: 'PDF export with many columns may not fit properly',
      suggestion: 'Consider using landscape orientation or reducing columns'
    });
  }

  if (format === 'csv' && data.length > 1000000) {
    validationResults.push({
      type: 'warning',
      message: 'Very large CSV file will be generated',
      suggestion: 'Consider splitting the export or using XLSX format'
    });
  }

  // Check for missing data
  let missingDataCount = 0;
  selectedColumns.forEach(colKey => {
    const column = columns.find(c => c.key === colKey);
    if (column) {
      data.forEach(row => {
        let value;
        switch (column.key) {
          case 'companyName':
            value = row.companyName;
            break;
          case 'businessType':
            value = row.businessType;
            break;
          case 'location':
            value = row.address?.country;
            break;
          case 'city':
            value = row.address?.city;
            break;
          case 'phone':
            value = row.contactPerson?.phone;
            break;
          case 'website':
            value = row.website;
            break;
          case 'contact':
            value = row.contactPerson?.name || row.contactPerson?.email;
            break;
          case 'products':
            value = row.productCategories;
            break;
          case 'status':
            value = row.sourcingStatus;
            break;
          case 'rating':
            value = row.rating?.overall;
            break;
          default:
            value = row[column.key];
        }
        
        if (!value || (Array.isArray(value) && value.length === 0)) {
          missingDataCount++;
        }
      });
    }
  });

  if (missingDataCount > 0) {
    const percentage = ((missingDataCount / (data.length * selectedColumns.length)) * 100).toFixed(1);
    validationResults.push({
      type: 'info',
      message: `${percentage}% of cells contain missing data`,
      suggestion: 'Missing data will be exported as empty cells'
    });
  }

  // Success message if no issues
  if (validationResults.length === 0) {
    validationResults.push({
      type: 'success',
      message: 'Export ready',
      suggestion: `${data.length} records with ${selectedColumns.length} columns will be exported`
    });
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const hasErrors = validationResults.some(result => result.type === 'error');
  const hasWarnings = validationResults.some(result => result.type === 'warning');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Export Validation</h4>
        <span className={`text-xs px-2 py-1 rounded-full ${
          hasErrors ? 'bg-red-100 text-red-800' :
          hasWarnings ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {hasErrors ? 'Issues Found' : hasWarnings ? 'Warnings' : 'Ready'}
        </span>
      </div>
      
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {validationResults.map((result, index) => (
          <div
            key={index}
            className={`flex items-start p-2 border rounded-md ${getBgColor(result.type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(result.type)}
            </div>
            <div className="ml-2 flex-1 min-w-0">
              <p className={`text-sm font-medium ${getTextColor(result.type)}`}>
                {result.message}
              </p>
              {result.suggestion && (
                <p className="text-xs text-gray-600 mt-1">
                  {result.suggestion}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {hasErrors && (
        <div className="text-xs text-red-600 font-medium">
          Please resolve the errors above before proceeding with export.
        </div>
      )}
    </div>
  );
};

export default ExportValidation;
