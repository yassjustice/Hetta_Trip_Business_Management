import React, { useState } from 'react';
import {
  SwatchIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const AdvancedExportSettings = ({ 
  exportConfig, 
  setExportConfig, 
  format,
  isExporting 
}) => {
  const [activeTab, setActiveTab] = useState('styling');

  const tabs = [
    { key: 'styling', label: 'Styling', icon: SwatchIcon },
    { key: 'layout', label: 'Layout', icon: TableCellsIcon },
    { key: 'advanced', label: 'Advanced', icon: Cog6ToothIcon }
  ];

  const colorPresets = [
    { name: 'Corporate Blue', header: '#3b82f6', headerText: '#ffffff', alternate: '#f9fafb' },
    { name: 'Professional Green', header: '#10b981', headerText: '#ffffff', alternate: '#f0fdf4' },
    { name: 'Classic Red', header: '#ef4444', headerText: '#ffffff', alternate: '#fef2f2' },
    { name: 'Elegant Purple', header: '#8b5cf6', headerText: '#ffffff', alternate: '#faf5ff' },
    { name: 'Modern Orange', header: '#f59e0b', headerText: '#ffffff', alternate: '#fffbeb' },
    { name: 'Minimal Gray', header: '#6b7280', headerText: '#ffffff', alternate: '#f9fafb' }
  ];

  const fontOptions = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia', 
    'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black'
  ];

  const applyColorPreset = (preset) => {
    setExportConfig(prev => ({
      ...prev,
      customStyles: {
        ...prev.customStyles,
        headerColor: preset.header,
        headerTextColor: preset.headerText,
        alternateRowColor: preset.alternate
      }
    }));
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled={isExporting}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'styling' && (
          <div className="space-y-4">
            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Color Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyColorPreset(preset)}
                    className="flex items-center p-2 border border-gray-300 rounded-md hover:border-gray-400 text-left text-xs"
                    disabled={isExporting}
                  >
                    <div className="flex space-x-1 mr-2">
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: preset.header }}
                      />
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: preset.alternate }}
                      />
                    </div>
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Header Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={exportConfig.customStyles.headerColor}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      customStyles: { ...prev.customStyles, headerColor: e.target.value }
                    }))}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    disabled={isExporting}
                  />
                  <input
                    type="text"
                    value={exportConfig.customStyles.headerColor}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      customStyles: { ...prev.customStyles, headerColor: e.target.value }
                    }))}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    disabled={isExporting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Header Text Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={exportConfig.customStyles.headerTextColor}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      customStyles: { ...prev.customStyles, headerTextColor: e.target.value }
                    }))}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    disabled={isExporting}
                  />
                  <input
                    type="text"
                    value={exportConfig.customStyles.headerTextColor}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      customStyles: { ...prev.customStyles, headerTextColor: e.target.value }
                    }))}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    disabled={isExporting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Alternate Row Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={exportConfig.customStyles.alternateRowColor}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      customStyles: { ...prev.customStyles, alternateRowColor: e.target.value }
                    }))}
                    className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    disabled={isExporting}
                  />
                  <input
                    type="text"
                    value={exportConfig.customStyles.alternateRowColor}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      customStyles: { ...prev.customStyles, alternateRowColor: e.target.value }
                    }))}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                    disabled={isExporting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Font Family
                </label>
                <select
                  value={exportConfig.customStyles.fontFamily}
                  onChange={(e) => setExportConfig(prev => ({
                    ...prev,
                    customStyles: { ...prev.customStyles, fontFamily: e.target.value }
                  }))}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  disabled={isExporting}
                >
                  {fontOptions.map(font => (
                    <option key={font} value={font}>{font}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Font Size: {exportConfig.customStyles.fontSize}px
              </label>
              <input
                type="range"
                min="8"
                max="16"
                value={exportConfig.customStyles.fontSize}
                onChange={(e) => setExportConfig(prev => ({
                  ...prev,
                  customStyles: { ...prev.customStyles, fontSize: parseInt(e.target.value) }
                }))}
                className="w-full"
                disabled={isExporting}
              />
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-4">
            {format === 'pdf' && (
              <>
                {/* Page Orientation */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Page Orientation
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="portrait"
                        checked={exportConfig.pageSettings.orientation === 'portrait'}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          pageSettings: { ...prev.pageSettings, orientation: e.target.value }
                        }))}
                        className="mr-2"
                        disabled={isExporting}
                      />
                      Portrait
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="landscape"
                        checked={exportConfig.pageSettings.orientation === 'landscape'}
                        onChange={(e) => setExportConfig(prev => ({
                          ...prev,
                          pageSettings: { ...prev.pageSettings, orientation: e.target.value }
                        }))}
                        className="mr-2"
                        disabled={isExporting}
                      />
                      Landscape
                    </label>
                  </div>
                </div>

                {/* Paper Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Paper Size
                  </label>
                  <select
                    value={exportConfig.pageSettings.paperSize}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      pageSettings: { ...prev.pageSettings, paperSize: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    disabled={isExporting}
                  >
                    <option value="a4">A4</option>
                    <option value="a3">A3</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                    <option value="tabloid">Tabloid</option>
                  </select>
                </div>

                {/* Margins */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Margins (mm)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['top', 'right', 'bottom', 'left'].map(side => (
                      <div key={side}>
                        <label className="block text-xs text-gray-600 mb-1 capitalize">
                          {side}
                        </label>
                        <input
                          type="number"
                          value={exportConfig.pageSettings.margins[side]}
                          onChange={(e) => setExportConfig(prev => ({
                            ...prev,
                            pageSettings: {
                              ...prev.pageSettings,
                              margins: { ...prev.pageSettings.margins, [side]: parseInt(e.target.value) }
                            }
                          }))}
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          min="5"
                          max="50"
                          disabled={isExporting}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Header and Footer Text */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Header Text
                    </label>
                    <input
                      type="text"
                      value={exportConfig.pdfSettings.headerText}
                      onChange={(e) => setExportConfig(prev => ({
                        ...prev,
                        pdfSettings: { ...prev.pdfSettings, headerText: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      disabled={isExporting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Footer Text
                    </label>
                    <input
                      type="text"
                      value={exportConfig.pdfSettings.footerText}
                      onChange={(e) => setExportConfig(prev => ({
                        ...prev,
                        pdfSettings: { ...prev.pdfSettings, footerText: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      disabled={isExporting}
                    />
                  </div>
                </div>
              </>
            )}

            {format === 'xlsx' && (
              <>
                {/* Sheet Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Sheet Name
                  </label>
                  <input
                    type="text"
                    value={exportConfig.xlsxSettings.sheetName}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      xlsxSettings: { ...prev.xlsxSettings, sheetName: e.target.value }
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    disabled={isExporting}
                  />
                </div>
              </>
            )}

            {format === 'csv' && (
              <>
                {/* CSV Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Delimiter
                    </label>
                    <select
                      value={exportConfig.csvSettings.delimiter}
                      onChange={(e) => setExportConfig(prev => ({
                        ...prev,
                        csvSettings: { ...prev.csvSettings, delimiter: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      disabled={isExporting}
                    >
                      <option value=",">Comma (,)</option>
                      <option value=";">Semicolon (;)</option>
                      <option value="\t">Tab</option>
                      <option value="|">Pipe (|)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Encoding
                    </label>
                    <select
                      value={exportConfig.csvSettings.encoding}
                      onChange={(e) => setExportConfig(prev => ({
                        ...prev,
                        csvSettings: { ...prev.csvSettings, encoding: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      disabled={isExporting}
                    >
                      <option value="utf-8">UTF-8</option>
                      <option value="utf-16">UTF-16</option>
                      <option value="iso-8859-1">ISO-8859-1</option>
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Data Processing */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Data Processing
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeMetadata}
                    onChange={(e) => setExportConfig(prev => ({ 
                      ...prev, 
                      includeMetadata: e.target.checked 
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isExporting}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include export metadata and statistics
                  </span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.includeFilters}
                    onChange={(e) => setExportConfig(prev => ({ 
                      ...prev, 
                      includeFilters: e.target.checked 
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isExporting}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Include active filter information
                  </span>
                </label>
              </div>
            </div>

            {/* Sorting Options */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Custom Sorting
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={exportConfig.sortBy || ''}
                  onChange={(e) => setExportConfig(prev => ({ 
                    ...prev, 
                    sortBy: e.target.value || null 
                  }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={isExporting}
                >
                  <option value="">No sorting</option>
                  <option value="companyName">Company Name</option>
                  <option value="businessType">Business Type</option>
                  <option value="sourcingStatus">Status</option>
                  <option value="address.country">Country</option>
                  <option value="rating.overall">Rating</option>
                  <option value="yearEstablished">Year Established</option>
                </select>
                <select
                  value={exportConfig.sortOrder}
                  onChange={(e) => setExportConfig(prev => ({ 
                    ...prev, 
                    sortOrder: e.target.value 
                  }))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  disabled={isExporting || !exportConfig.sortBy}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            {/* Performance Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Performance & Quality
              </label>
              <div className="space-y-3">
                {format === 'xlsx' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportConfig.xlsxSettings.includeFormulas}
                      onChange={(e) => setExportConfig(prev => ({
                        ...prev,
                        xlsxSettings: { ...prev.xlsxSettings, includeFormulas: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isExporting}
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include Excel formulas (may increase file size)
                    </span>
                  </label>
                )}
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportConfig.csvSettings.quotePaths}
                    onChange={(e) => setExportConfig(prev => ({
                      ...prev,
                      csvSettings: { ...prev.csvSettings, quotePaths: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isExporting}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Quote all fields (recommended for special characters)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedExportSettings;
