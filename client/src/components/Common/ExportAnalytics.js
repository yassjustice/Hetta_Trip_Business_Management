import React, { useState, useMemo } from 'react';
import {
  ChartBarIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  PresentationChartBarIcon,
  CalculatorIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  FunnelIcon,
  TagIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ExportAnalytics = ({ 
  data = [], 
  columns = [], 
  config = {}, 
  onConfigChange,
  className = ''
}) => {
  const [selectedAnalytics, setSelectedAnalytics] = useState({
    summary: true,
    distribution: true,
    trends: false,
    correlations: false,
    outliers: false,
    completeness: true
  });

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    if (!data.length || !config.selectedColumns?.length) return null;

    const selectedColumns = columns.filter(col => 
      config.selectedColumns.includes(col.key)
    );

    const analytics = {
      summary: {
        totalRecords: data.length,
        selectedColumns: selectedColumns.length,
        totalColumns: columns.length,
        avgRecordSize: 0,
        estimatedFileSize: Math.ceil(data.length * selectedColumns.length * 0.05)
      },
      distribution: {},
      completeness: {},
      trends: {},
      outliers: {},
      correlations: {}
    };

    // Process each selected column
    selectedColumns.forEach(column => {
      const values = data.map(row => {
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
            value = row.contactPerson?.name;
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
            value = getNestedValue(row, column.key);
        }
        
        return value;
      }).filter(v => v !== null && v !== undefined && v !== '');

      // Completeness analysis
      analytics.completeness[column.key] = {
        filled: values.length,
        empty: data.length - values.length,
        fillRate: (values.length / data.length) * 100,
        uniqueValues: [...new Set(values)].length
      };

      // Distribution analysis
      if (values.length > 0) {
        const distribution = {};
        values.forEach(value => {
          const key = Array.isArray(value) ? value.join(', ') : String(value);
          distribution[key] = (distribution[key] || 0) + 1;
        });

        analytics.distribution[column.key] = Object.entries(distribution)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([value, count]) => ({
            value,
            count,
            percentage: (count / values.length) * 100
          }));

        // Numeric analysis for rating-like fields
        if (column.key === 'rating' || column.type === 'number') {
          const numericValues = values.filter(v => !isNaN(parseFloat(v))).map(v => parseFloat(v));
          if (numericValues.length > 0) {
            analytics.trends[column.key] = {
              min: Math.min(...numericValues),
              max: Math.max(...numericValues),
              avg: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
              median: numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)]
            };
          }
        }
      }
    });

    return analytics;
  }, [data, columns, config.selectedColumns]);

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const handleAnalyticsToggle = (type) => {
    setSelectedAnalytics(prev => ({
      ...prev,
      [type]: !prev[type]
    }));

    // Update config
    if (onConfigChange) {
      onConfigChange(prevConfig => ({
        ...prevConfig,
        includeAnalytics: Object.values({
          ...selectedAnalytics,
          [type]: !selectedAnalytics[type]
        }).some(Boolean),
        analyticsConfig: {
          ...prevConfig.analyticsConfig,
          [type]: !selectedAnalytics[type]
        }
      }));
    }
  };

  if (!analyticsData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Export Analytics</h3>
          <p className="text-sm text-gray-500">
            Select data and columns to view analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Export Analytics</h3>
        <p className="text-sm text-gray-500">
          Detailed analysis of your export data and insights
        </p>
      </div>

      {/* Analytics Options */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Include in Export</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'summary', label: 'Summary Stats', icon: CalculatorIcon },
            { key: 'distribution', label: 'Data Distribution', icon: ChartBarIcon },
            { key: 'completeness', label: 'Data Completeness', icon: CheckCircleIcon },
            { key: 'trends', label: 'Trends Analysis', icon: ArrowTrendingUpIcon },
            { key: 'correlations', label: 'Correlations', icon: DocumentChartBarIcon },
            { key: 'outliers', label: 'Outlier Detection', icon: FunnelIcon }
          ].map(analytics => {
            const Icon = analytics.icon;
            return (
              <label key={analytics.key} className="flex items-center p-2 rounded-md hover:bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAnalytics[analytics.key]}
                  onChange={() => handleAnalyticsToggle(analytics.key)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <Icon className="h-4 w-4 ml-2 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">{analytics.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Summary Statistics */}
      {selectedAnalytics.summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <CalculatorIcon className="h-5 w-5 mr-2 text-blue-600" />
            Summary Statistics
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-900">
                {analyticsData.summary.totalRecords.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">Total Records</div>
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-900">
                {analyticsData.summary.selectedColumns}
              </div>
              <div className="text-sm text-green-700">Export Columns</div>
            </div>
            
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-900">
                {analyticsData.summary.estimatedFileSize}KB
              </div>
              <div className="text-sm text-purple-700">Est. File Size</div>
            </div>
            
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-900">
                {Math.round((analyticsData.summary.selectedColumns / analyticsData.summary.totalColumns) * 100)}%
              </div>
              <div className="text-sm text-orange-700">Column Coverage</div>
            </div>
          </div>
        </div>
      )}

      {/* Data Completeness */}
      {selectedAnalytics.completeness && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
            Data Completeness
          </h4>
          
          <div className="space-y-3">
            {columns.filter(col => config.selectedColumns?.includes(col.key)).map(column => {
              const completeness = analyticsData.completeness[column.key];
              if (!completeness) return null;
              
              return (
                <div key={column.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{column.label}</div>
                    <div className="text-xs text-gray-600">
                      {completeness.filled} filled • {completeness.uniqueValues} unique values
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="text-sm font-medium text-gray-900">
                      {completeness.fillRate.toFixed(1)}%
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          completeness.fillRate >= 90 ? 'bg-green-500' :
                          completeness.fillRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${completeness.fillRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Distribution */}
      {selectedAnalytics.distribution && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2 text-purple-600" />
            Data Distribution (Top Values)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {columns.filter(col => config.selectedColumns?.includes(col.key)).map(column => {
              const distribution = analyticsData.distribution[column.key];
              if (!distribution || distribution.length === 0) return null;
              
              return (
                <div key={column.key} className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-900">{column.label}</h5>
                  <div className="space-y-1">
                    {distribution.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate max-w-32" title={item.value}>
                          {item.value}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 font-medium">{item.count}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-purple-500 h-1.5 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {distribution.length > 5 && (
                      <div className="text-xs text-gray-500 text-center pt-1">
                        +{distribution.length - 5} more values
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Trends Analysis */}
      {selectedAnalytics.trends && Object.keys(analyticsData.trends).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 mr-2 text-indigo-600" />
            Trends Analysis (Numeric Fields)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(analyticsData.trends).map(([columnKey, stats]) => {
              const column = columns.find(col => col.key === columnKey);
              if (!column) return null;
              
              return (
                <div key={columnKey} className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">{column.label}</h5>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Min:</span>
                      <span className="ml-2 font-medium">{stats.min.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Max:</span>
                      <span className="ml-2 font-medium">{stats.max.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg:</span>
                      <span className="ml-2 font-medium">{stats.avg.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Median:</span>
                      <span className="ml-2 font-medium">{stats.median.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Export Format Impact */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-amber-900 mb-2 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Export Format Impact
        </h4>
        <div className="text-sm text-amber-800">
          <p className="mb-2">
            <strong>Format:</strong> {config.format?.toUpperCase() || 'Not selected'}
          </p>
          {config.format === 'xlsx' && (
            <p>Excel format supports rich formatting, multiple sheets, and preserves data types. Best for analysis.</p>
          )}
          {config.format === 'csv' && (
            <p>CSV format is lightweight and universally compatible but loses formatting. Best for data interchange.</p>
          )}
          {config.format === 'pdf' && (
            <p>PDF format creates a visual report perfect for sharing but data cannot be easily modified.</p>
          )}
          {config.format === 'json' && (
            <p>JSON format preserves data structure and types. Best for developers and API integration.</p>
          )}
        </div>
      </div>

      {/* Analytics Summary for Export */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-md font-medium text-blue-900 mb-2">
          Analytics Inclusion Summary
        </h4>
        <div className="text-sm text-blue-800">
          <p className="mb-2">
            The following analytics will be included in your export:
          </p>
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(selectedAnalytics)
              .filter(([, enabled]) => enabled)
              .map(([type]) => (
                <li key={type} className="capitalize">
                  {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </li>
              ))}
          </ul>
          {!Object.values(selectedAnalytics).some(Boolean) && (
            <p className="text-blue-700 italic">No analytics selected for export</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportAnalytics;
