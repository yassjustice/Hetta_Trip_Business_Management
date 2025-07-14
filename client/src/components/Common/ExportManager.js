import React, { useState, useEffect } from 'react';
import {
  DocumentArrowDownIcon,
  CogIcon,
  XMarkIcon,
  CheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CalendarIcon,
  FunnelIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
  PhotoIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  BookmarkIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import Papa from 'papaparse';

// Import autoTable plugin for jsPDF
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { toast } from 'react-hot-toast';
import AdvancedExportSettings from './AdvancedExportSettings';
import ExportPreview from './ExportPreview';
import ExportAnalytics from './ExportAnalytics';
import ExportScheduler from './ExportScheduler';
import ExportTemplates from './ExportTemplates';
import ExportHistory from './ExportHistory';

const ExportManager = ({
  data = [],
  columns = [],
  visibleColumns = [],
  fileName = 'export',
  title = 'Data Export',
  subtitle = '',
  onClose,
  searchQuery = '',
  activeFilters = {},
  totalRecords = 0
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, preview, analytics, templates, scheduler, history
  const [exportConfig, setExportConfig] = useState({
    format: 'xlsx',
    includeFilters: true,
    includeMetadata: true,
    customFileName: '',
    dateRange: null,
    selectedColumns: [...visibleColumns],
    sortBy: null,
    sortOrder: 'asc',
    groupBy: null,
    includeCharts: false,
    customStyles: {
      headerColor: '#3b82f6',
      headerTextColor: '#ffffff',
      alternateRowColor: '#f9fafb',
      fontSize: 10,
      fontFamily: 'Arial'
    },
    pageSettings: {
      orientation: 'landscape',
      paperSize: 'a4',
      margins: { top: 20, right: 20, bottom: 20, left: 20 }
    },
    csvSettings: {
      delimiter: ',',
      encoding: 'utf-8',
      includeHeaders: true,
      quotePaths: true
    },
    xlsxSettings: {
      sheetName: 'Data',
      includeFormulas: false,
      autoFilter: true,
      freezeHeaders: true,
      includeSummary: true
    },
    pdfSettings: {
      includeHeader: true,
      includeFooter: true,
      includePageNumbers: true,
      logoUrl: null,
      headerText: title,
      footerText: `Generated on ${new Date().toLocaleDateString()}`
    }
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showQuickExport, setShowQuickExport] = useState(false);

  // Available export formats
  const exportFormats = [
    { value: 'xlsx', label: 'Excel (XLSX)', icon: TableCellsIcon, description: 'Spreadsheet with formatting' },
    { value: 'csv', label: 'CSV', icon: DocumentTextIcon, description: 'Comma-separated values' },
    { value: 'pdf', label: 'PDF', icon: DocumentTextIcon, description: 'Portable document format' },
    { value: 'json', label: 'JSON', icon: CogIcon, description: 'JavaScript object notation' },
    { value: 'xml', label: 'XML', icon: CogIcon, description: 'Extensible markup language' }
  ];

  // Available tabs for the export modal
  const exportTabs = [
    { id: 'basic', label: 'Basic Export', icon: DocumentArrowDownIcon, description: 'Format, columns, and basic settings' },
    { id: 'preview', label: 'Preview', icon: EyeIcon, description: 'Preview export data before downloading' },
    { id: 'analytics', label: 'Analytics', icon: ChartBarIcon, description: 'Data analysis and insights' },
    { id: 'templates', label: 'Templates', icon: BookmarkIcon, description: 'Save and manage export configurations' },
    { id: 'scheduler', label: 'Schedule', icon: ClockIcon, description: 'Schedule automated exports' },
    { id: 'history', label: 'History', icon: ArchiveBoxIcon, description: 'View previous exports' }
  ];

  // Get available columns for selection
  const availableColumns = columns.filter(col => !col.excludeFromExport);
  
  // Initialize export config when component mounts or visible columns change
  useEffect(() => {
    setExportConfig(prev => ({
      ...prev,
      selectedColumns: visibleColumns.length > 0 ? [...visibleColumns] : prev.selectedColumns,
      pdfSettings: {
        ...prev.pdfSettings,
        headerText: title
      }
    }));
  }, [visibleColumns, title]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      // ESC to close
      if (event.key === 'Escape' && !isExporting) {
        handleCloseModal();
      }
      
      // Ctrl/Cmd + Enter to export
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !isExporting) {
        const validationErrors = validateExportConfig(exportConfig);
        if (validationErrors.length === 0) {
          handleExport();
        }
      }
      
      // Tab navigation between tabs (Ctrl/Cmd + 1-6)
      if ((event.ctrlKey || event.metaKey) && !isExporting) {
        const tabNumbers = { '1': 'basic', '2': 'preview', '3': 'analytics', '4': 'templates', '5': 'scheduler', '6': 'history' };
        if (tabNumbers[event.key]) {
          event.preventDefault();
          setActiveTab(tabNumbers[event.key]);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isExporting, exportConfig]);

  // Auto-save draft configuration
  useEffect(() => {
    if (isOpen && !isExporting) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem('exportConfigDraft', JSON.stringify(exportConfig));
        } catch (error) {
          console.warn('Failed to save export configuration draft:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [exportConfig, isOpen, isExporting]);

  // Load draft configuration on component mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('exportConfigDraft');
      if (savedDraft) {
        const draftConfig = JSON.parse(savedDraft);
        setExportConfig(prev => ({
          ...prev,
          ...draftConfig,
          selectedColumns: visibleColumns.length > 0 ? [...visibleColumns] : draftConfig.selectedColumns || prev.selectedColumns
        }));
      }
    } catch (error) {
      console.warn('Failed to load export configuration draft:', error);
    }
  }, []);
  
  // Get filtered and sorted data
  const getProcessedData = () => {
    let processedData = [...data];
    
    // Apply custom sorting if specified
    if (exportConfig.sortBy) {
      processedData.sort((a, b) => {
        const aVal = getNestedValue(a, exportConfig.sortBy);
        const bVal = getNestedValue(b, exportConfig.sortBy);
        
        if (exportConfig.sortOrder === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }
    
    return processedData;
  };

  // Helper function to get nested object values
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Format cell value based on column type
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
        if (typeof value === 'object') {
          return JSON.stringify(value);
        }
        return value;
      default:
        return String(value);
    }
  };

  // Extract data for export based on selected columns
  const extractExportData = () => {
    return extractExportDataWithConfig(exportConfig);
  };

  // Extract data with specific config
  const extractExportDataWithConfig = (config = exportConfig) => {
    const processedData = getProcessedData();
    const selectedColumnConfigs = columns.filter(col => 
      config.selectedColumns.includes(col.key)
    );

    return processedData.map(row => {
      const exportRow = {};
      selectedColumnConfigs.forEach(column => {
        let value;
        
        // Handle special column value extraction
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
        
        exportRow[column.label] = formatCellValue(value, column);
      });
      return exportRow;
    });
  };

  // Reset modal state when closing
  const handleCloseModal = () => {
    setIsOpen(false);
    setActiveTab('basic');
    setShowAdvancedSettings(false);
    setShowQuickExport(false);
    if (onClose) onClose();
  };

  // Generate metadata for export
  const generateMetadata = () => {
    const metadata = {
      exportDate: new Date().toISOString(),
      exportedBy: 'Trip-Tex System',
      totalRecords: data.length,
      filteredRecords: data.length,
      searchQuery: searchQuery || 'None',
      activeFilters: Object.keys(activeFilters).length > 0 ? activeFilters : 'None',
      selectedColumns: exportConfig.selectedColumns.length,
      format: exportConfig.format.toUpperCase()
    };

    if (exportConfig.sortBy) {
      metadata.sortedBy = `${exportConfig.sortBy} (${exportConfig.sortOrder})`;
    }

    return metadata;
  };

  // Export to Excel (XLSX)
  const exportToExcel = async () => {
    const exportData = extractExportData();
    const workbook = XLSX.utils.book_new();
    
    // Main data sheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Apply styling and formatting
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Set column widths
    const columnWidths = exportConfig.selectedColumns.map(colKey => {
      const column = columns.find(c => c.key === colKey);
      return { wch: Math.max(column?.label?.length || 10, 15) };
    });
    worksheet['!cols'] = columnWidths;
    
    // Auto-filter
    if (exportConfig.xlsxSettings.autoFilter) {
      worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    }
    
    // Freeze headers
    if (exportConfig.xlsxSettings.freezeHeaders) {
      worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, exportConfig.xlsxSettings.sheetName);
    
    // Add metadata sheet if enabled
    if (exportConfig.includeMetadata) {
      const metadata = generateMetadata();
      const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Export Info');
    }
    
    // Add summary sheet if enabled
    if (exportConfig.xlsxSettings.includeSummary) {
      const summary = generateSummaryData();
      const summarySheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }
    
    const exportFileName = `${exportConfig.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, exportFileName);
  };

  // Export to CSV
  const exportToCSV = () => {
    const exportData = extractExportData();
    const csv = Papa.unparse(exportData, {
      delimiter: exportConfig.csvSettings.delimiter,
      header: exportConfig.csvSettings.includeHeaders,
      quotes: exportConfig.csvSettings.quotePaths
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const exportFileName = `${exportConfig.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, exportFileName);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: exportConfig.pageSettings.orientation,
      unit: 'mm',
      format: exportConfig.pageSettings.paperSize
    });
    
    const exportData = extractExportData();
    const selectedColumns = columns.filter(col => 
      exportConfig.selectedColumns.includes(col.key)
    );
    
    // Add header
    if (exportConfig.pdfSettings.includeHeader) {
      doc.setFontSize(16);
      doc.setFont(exportConfig.customStyles.fontFamily, 'bold');
      doc.text(exportConfig.pdfSettings.headerText, 20, 20);
      
      if (subtitle) {
        doc.setFontSize(12);
        doc.setFont(exportConfig.customStyles.fontFamily, 'normal');
        doc.text(subtitle, 20, 30);
      }
    }
    
    // Add metadata
    if (exportConfig.includeMetadata) {
      const metadata = generateMetadata();
      let yPos = 40;
      doc.setFontSize(10);
      
      Object.entries(metadata).forEach(([key, value]) => {
        doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`, 20, yPos);
        yPos += 5;
      });
      yPos += 10;
    }
    
    // Add table using autoTable
    autoTable(doc, {
      head: [selectedColumns.map(col => col.label)],
      body: exportData.map(row => selectedColumns.map(col => row[col.label] || '')),
      startY: exportConfig.includeMetadata ? 80 : 50,
      styles: {
        fontSize: exportConfig.customStyles.fontSize,
        font: exportConfig.customStyles.fontFamily
      },
      headStyles: {
        fillColor: exportConfig.customStyles.headerColor,
        textColor: exportConfig.customStyles.headerTextColor
      },
      alternateRowStyles: {
        fillColor: exportConfig.customStyles.alternateRowColor
      },
      margin: exportConfig.pageSettings.margins
    });
    
    // Add footer
    if (exportConfig.pdfSettings.includeFooter) {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          exportConfig.pdfSettings.footerText,
          20,
          doc.internal.pageSize.height - 10
        );
        
        if (exportConfig.pdfSettings.includePageNumbers) {
          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width - 40,
            doc.internal.pageSize.height - 10
          );
        }
      }
    }
    
    const exportFileName = `${exportConfig.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(exportFileName);
  };

  // Export to JSON
  const exportToJSON = () => {
    const exportData = extractExportData();
    const jsonData = {
      metadata: exportConfig.includeMetadata ? generateMetadata() : undefined,
      data: exportData
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json' 
    });
    const exportFileName = `${exportConfig.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.json`;
    saveAs(blob, exportFileName);
  };

  // Export to XML
  const exportToXML = () => {
    const exportData = extractExportData();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<export>\n';
    
    if (exportConfig.includeMetadata) {
      const metadata = generateMetadata();
      xml += '  <metadata>\n';
      Object.entries(metadata).forEach(([key, value]) => {
        xml += `    <${key}>${value}</${key}>\n`;
      });
      xml += '  </metadata>\n';
    }
    
    xml += '  <data>\n';
    exportData.forEach(row => {
      xml += '    <record>\n';
      Object.entries(row).forEach(([key, value]) => {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9]/g, '_');
        xml += `      <${sanitizedKey}>${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${sanitizedKey}>\n`;
      });
      xml += '    </record>\n';
    });
    xml += '  </data>\n';
    xml += '</export>';
    
    const blob = new Blob([xml], { type: 'application/xml' });
    const exportFileName = `${exportConfig.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.xml`;
    saveAs(blob, exportFileName);
  };

  // Generate summary data for analytics
  const generateSummaryData = () => {
    const summary = [];
    
    // Add basic statistics
    summary.push({
      Metric: 'Total Records',
      Value: data.length,
      Description: 'Total number of records in the dataset'
    });
    
    summary.push({
      Metric: 'Exported Records',
      Value: data.length,
      Description: 'Number of records included in this export'
    });
    
    summary.push({
      Metric: 'Columns Exported',
      Value: exportConfig.selectedColumns.length,
      Description: 'Number of columns included in this export'
    });
    
    // Add column-specific analytics if data is available
    if (data.length > 0) {
      // Business type distribution
      const businessTypes = {};
      data.forEach(item => {
        const type = item.businessType || 'Unknown';
        businessTypes[type] = (businessTypes[type] || 0) + 1;
      });
      
      Object.entries(businessTypes).forEach(([type, count]) => {
        summary.push({
          Metric: `Business Type: ${type}`,
          Value: count,
          Description: `Number of vendors with business type "${type}"`
        });
      });
      
      // Status distribution
      const statuses = {};
      data.forEach(item => {
        const status = item.sourcingStatus || 'Unknown';
        statuses[status] = (statuses[status] || 0) + 1;
      });
      
      Object.entries(statuses).forEach(([status, count]) => {
        summary.push({
          Metric: `Status: ${status}`,
          Value: count,
          Description: `Number of vendors with status "${status}"`
        });
      });
    }
    
    return summary;
  };

  // Validation functions
  const validateExportConfig = (config) => {
    const errors = [];
    
    if (!config.selectedColumns || config.selectedColumns.length === 0) {
      errors.push('At least one column must be selected');
    }
    
    if (config.format === 'pdf' && config.selectedColumns.length > 10) {
      errors.push('PDF exports are limited to 10 columns for readability');
    }
    
    if (config.customFileName && !/^[a-zA-Z0-9_-]+$/.test(config.customFileName)) {
      errors.push('File name can only contain letters, numbers, hyphens, and underscores');
    }
    
    if (data.length > 10000 && config.format === 'pdf') {
      errors.push('PDF exports are limited to 10,000 records for performance');
    }
    
    return errors;
  };

  // Calculate estimated file size
  const calculateEstimatedSize = (config) => {
    const recordCount = data.length;
    const columnCount = config.selectedColumns.length;
    
    let sizeMultiplier = 0.05; // Default for CSV
    
    switch (config.format) {
      case 'xlsx':
        sizeMultiplier = 0.08;
        break;
      case 'pdf':
        sizeMultiplier = 0.15;
        break;
      case 'json':
        sizeMultiplier = 0.12;
        break;
      case 'xml':
        sizeMultiplier = 0.18;
        break;
    }
    
    const estimatedKB = Math.ceil(recordCount * columnCount * sizeMultiplier);
    
    if (estimatedKB > 1024) {
      return `~${(estimatedKB / 1024).toFixed(1)}MB`;
    }
    return `~${estimatedKB}KB`;
  };

  // Performance optimization check
  const checkPerformanceWarning = (config) => {
    const recordCount = data.length;
    const columnCount = config.selectedColumns.length;
    const totalCells = recordCount * columnCount;
    
    if (totalCells > 100000) {
      return {
        level: 'warning',
        message: `Large export detected (${totalCells.toLocaleString()} cells). This may take some time.`
      };
    }
    
    if (totalCells > 500000) {
      return {
        level: 'error',
        message: `Export too large (${totalCells.toLocaleString()} cells). Consider reducing columns or filtering data.`
      };
    }
    
    return null;
  };

  // Handle export execution
  const handleExport = async () => {
    const validationErrors = validateExportConfig(exportConfig);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }
    
    const performanceWarning = checkPerformanceWarning(exportConfig);
    if (performanceWarning?.level === 'error') {
      toast.error(performanceWarning.message);
      return;
    }
    
    if (performanceWarning?.level === 'warning') {
      toast(performanceWarning.message, { duration: 5000 });
    }
    
    await handleExportWithConfig(exportConfig);
  };

  // Template management functions
  const handleSaveTemplate = (templateData) => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem('exportTemplates') || '[]');
      const newTemplate = {
        ...templateData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      };
      savedTemplates.push(newTemplate);
      localStorage.setItem('exportTemplates', JSON.stringify(savedTemplates));
      toast.success('Template saved successfully');
      return newTemplate;
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
      return null;
    }
  };

  const handleLoadTemplate = (template) => {
    try {
      setExportConfig(prev => ({
        ...prev,
        ...template.config,
        customFileName: prev.customFileName // Keep current filename
      }));
      
      // Update last used timestamp
      const savedTemplates = JSON.parse(localStorage.getItem('exportTemplates') || '[]');
      const updatedTemplates = savedTemplates.map(t => 
        t.id === template.id 
          ? { ...t, lastUsed: new Date().toISOString() }
          : t
      );
      localStorage.setItem('exportTemplates', JSON.stringify(updatedTemplates));
      
      toast.success('Template loaded successfully');
      setActiveTab('basic'); // Switch to basic tab to see loaded settings
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template');
    }
  };

  const handleDeleteTemplate = (templateId) => {
    try {
      const savedTemplates = JSON.parse(localStorage.getItem('exportTemplates') || '[]');
      const updatedTemplates = savedTemplates.filter(t => t.id !== templateId);
      localStorage.setItem('exportTemplates', JSON.stringify(updatedTemplates));
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  // Export history management
  const saveExportToHistory = (exportData) => {
    try {
      const exportHistory = JSON.parse(localStorage.getItem('exportHistory') || '[]');
      const historyEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        format: exportData.format,
        recordCount: exportData.recordCount,
        columnCount: exportData.columnCount,
        fileName: exportData.fileName,
        fileSize: exportData.fileSize,
        searchQuery: exportData.searchQuery,
        filters: exportData.filters,
        config: exportData.config
      };
      
      // Keep only last 50 exports
      exportHistory.unshift(historyEntry);
      if (exportHistory.length > 50) {
        exportHistory.splice(50);
      }
      
      localStorage.setItem('exportHistory', JSON.stringify(exportHistory));
    } catch (error) {
      console.error('Failed to save export to history:', error);
    }
  };

  // Schedule export function
  const handleScheduleExport = (scheduleData) => {
    try {
      const scheduledExports = JSON.parse(localStorage.getItem('scheduledExports') || '[]');
      const newSchedule = {
        ...scheduleData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true,
        config: exportConfig
      };
      scheduledExports.push(newSchedule);
      localStorage.setItem('scheduledExports', JSON.stringify(scheduledExports));
      toast.success('Export scheduled successfully');
      return newSchedule;
    } catch (error) {
      console.error('Failed to schedule export:', error);
      toast.error('Failed to schedule export');
      return null;
    }
  };

  // Toggle column selection
  const toggleColumn = (columnKey) => {
    setExportConfig(prev => ({
      ...prev,
      selectedColumns: prev.selectedColumns.includes(columnKey)
        ? prev.selectedColumns.filter(key => key !== columnKey)
        : [...prev.selectedColumns, columnKey]
    }));
  };

  // Select all columns
  const selectAllColumns = () => {
    setExportConfig(prev => ({
      ...prev,
      selectedColumns: availableColumns.map(col => col.key)
    }));
  };

  // Deselect all columns
  const deselectAllColumns = () => {
    setExportConfig(prev => ({
      ...prev,
      selectedColumns: []
    }));
  };

  // Quick export methods
  const quickExportExcel = async () => {
    const quickConfig = {
      ...exportConfig,
      format: 'xlsx',
      selectedColumns: visibleColumns,
      includeMetadata: true,
      xlsxSettings: { ...exportConfig.xlsxSettings, autoFilter: true, freezeHeaders: true }
    };
    
    setExportConfig(quickConfig);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to update config
    handleExportWithConfig(quickConfig);
  };

  const quickExportCSV = async () => {
    const quickConfig = {
      ...exportConfig,
      format: 'csv',
      selectedColumns: visibleColumns,
      includeMetadata: false
    };
    
    setExportConfig(quickConfig);
    await new Promise(resolve => setTimeout(resolve, 100));
    handleExportWithConfig(quickConfig);
  };

  const quickExportPDF = async () => {
    const quickConfig = {
      ...exportConfig,
      format: 'pdf',
      selectedColumns: visibleColumns,
      includeMetadata: true,
      pdfSettings: { ...exportConfig.pdfSettings, includeHeader: true, includeFooter: true }
    };
    
    setExportConfig(quickConfig);
    await new Promise(resolve => setTimeout(resolve, 100));
    handleExportWithConfig(quickConfig);
  };

  // Handle export with specific config
  const handleExportWithConfig = async (config) => {
    if (config.selectedColumns.length === 0) {
      toast.error('Please select at least one column to export');
      return;
    }
    
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const exportData = extractExportDataWithConfig(config);
      const exportFileName = `${config.customFileName || fileName}_${new Date().toISOString().split('T')[0]}`;
      
      switch (config.format) {
        case 'xlsx':
          await exportToExcelWithConfig(config);
          break;
        case 'csv':
          exportToCSVWithConfig(config);
          break;
        case 'pdf':
          exportToPDFWithConfig(config);
          break;
        case 'json':
          exportToJSONWithConfig(config);
          break;
        case 'xml':
          exportToXMLWithConfig(config);
          break;
        default:
          throw new Error('Unsupported export format');
      }
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      // Save to export history
      const estimatedSize = Math.ceil(exportData.length * config.selectedColumns.length * 0.05);
      saveExportToHistory({
        format: config.format,
        recordCount: exportData.length,
        columnCount: config.selectedColumns.length,
        fileName: `${exportFileName}.${config.format}`,
        fileSize: `${estimatedSize}KB`,
        searchQuery: searchQuery || 'None',
        filters: activeFilters,
        config: config
      });
      
      toast.success(`Successfully exported ${exportData.length} records to ${config.format.toUpperCase()}`);
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        if (isOpen) {
          setIsOpen(false);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Export failed: ${error.message}`);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  // Export methods with config parameter
  const exportToExcelWithConfig = async (config = exportConfig) => {
    const exportData = extractExportDataWithConfig(config);
    const workbook = XLSX.utils.book_new();
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    const columnWidths = config.selectedColumns.map(colKey => {
      const column = columns.find(c => c.key === colKey);
      return { wch: Math.max(column?.label?.length || 10, 15) };
    });
    worksheet['!cols'] = columnWidths;
    
    if (config.xlsxSettings.autoFilter) {
      worksheet['!autofilter'] = { ref: worksheet['!ref'] };
    }
    
    if (config.xlsxSettings.freezeHeaders) {
      worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, config.xlsxSettings.sheetName);
    
    if (config.includeMetadata) {
      const metadata = generateMetadata();
      const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Export Info');
    }
    
    if (config.xlsxSettings.includeSummary) {
      const summary = generateSummaryData();
      const summarySheet = XLSX.utils.json_to_sheet(summary);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
    }
    
    const exportFileName = `${config.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, exportFileName);
  };

  const exportToCSVWithConfig = (config = exportConfig) => {
    const exportData = extractExportDataWithConfig(config);
    const csv = Papa.unparse(exportData, {
      delimiter: config.csvSettings.delimiter,
      header: config.csvSettings.includeHeaders,
      quotes: config.csvSettings.quotePaths
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const exportFileName = `${config.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.csv`;
    saveAs(blob, exportFileName);
  };

  const exportToPDFWithConfig = (config = exportConfig) => {
    const doc = new jsPDF({
      orientation: config.pageSettings.orientation,
      unit: 'mm',
      format: config.pageSettings.paperSize
    });
    
    const exportData = extractExportDataWithConfig(config);
    const selectedColumns = columns.filter(col => 
      config.selectedColumns.includes(col.key)
    );
    
    if (config.pdfSettings.includeHeader) {
      doc.setFontSize(16);
      doc.setFont(config.customStyles.fontFamily, 'bold');
      doc.text(config.pdfSettings.headerText, 20, 20);
      
      if (subtitle) {
        doc.setFontSize(12);
        doc.setFont(config.customStyles.fontFamily, 'normal');
        doc.text(subtitle, 20, 30);
      }
    }
    
    if (config.includeMetadata) {
      const metadata = generateMetadata();
      let yPos = 40;
      doc.setFontSize(10);
      
      Object.entries(metadata).forEach(([key, value]) => {
        doc.text(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`, 20, yPos);
        yPos += 5;
      });
      yPos += 10;
    }
    
    // Use autoTable function
    autoTable(doc, {
      head: [selectedColumns.map(col => col.label)],
      body: exportData.map(row => selectedColumns.map(col => row[col.label] || '')),
      startY: config.includeMetadata ? 80 : 50,
      styles: {
        fontSize: config.customStyles.fontSize,
        font: config.customStyles.fontFamily
      },
      headStyles: {
        fillColor: config.customStyles.headerColor,
        textColor: config.customStyles.headerTextColor
      },
      alternateRowStyles: {
        fillColor: config.customStyles.alternateRowColor
      },
      margin: config.pageSettings.margins
    });
    
    if (config.pdfSettings.includeFooter) {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          config.pdfSettings.footerText,
          20,
          doc.internal.pageSize.height - 10
        );
        
        if (config.pdfSettings.includePageNumbers) {
          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width - 40,
            doc.internal.pageSize.height - 10
          );
        }
      }
    }
    
    const exportFileName = `${config.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(exportFileName);
  };

  const exportToJSONWithConfig = (config = exportConfig) => {
    const exportData = extractExportDataWithConfig(config);
    const jsonData = {
      metadata: config.includeMetadata ? generateMetadata() : undefined,
      data: exportData
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json' 
    });
    const exportFileName = `${config.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.json`;
    saveAs(blob, exportFileName);
  };

  const exportToXMLWithConfig = (config = exportConfig) => {
    const exportData = extractExportDataWithConfig(config);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<export>\n';
    
    if (config.includeMetadata) {
      const metadata = generateMetadata();
      xml += '  <metadata>\n';
      Object.entries(metadata).forEach(([key, value]) => {
        xml += `    <${key}>${value}</${key}>\n`;
      });
      xml += '  </metadata>\n';
    }
    
    xml += '  <data>\n';
    exportData.forEach(row => {
      xml += '    <record>\n';
      Object.entries(row).forEach(([key, value]) => {
        const sanitizedKey = key.replace(/[^a-zA-Z0-9]/g, '_');
        xml += `      <${sanitizedKey}>${String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</${sanitizedKey}>\n`;
      });
      xml += '    </record>\n';
    });
    xml += '  </data>\n';
    xml += '</export>';
    
    const blob = new Blob([xml], { type: 'application/xml' });
    const exportFileName = `${config.customFileName || fileName}_${new Date().toISOString().split('T')[0]}.xml`;
    saveAs(blob, exportFileName);
  };

  return (
    <div className="relative">
      {/* Export Button with Dropdown */}
      <div className="flex">
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-l-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          title="Export Data"
          disabled={isExporting}
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Export ({data.length})
        </button>
        
        {/* Quick Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickExport(!showQuickExport)}
            className="inline-flex items-center px-2 py-2 border-l-0 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isExporting}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showQuickExport && !isExporting && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowQuickExport(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-200">
                    Quick Export
                  </div>
                  <button
                    onClick={() => {
                      setShowQuickExport(false);
                      quickExportExcel();
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <TableCellsIcon className="h-4 w-4 mr-2 text-green-600" />
                    Excel (Current View)
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickExport(false);
                      quickExportCSV();
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2 text-blue-600" />
                    CSV (Current View)
                  </button>
                  <button
                    onClick={() => {
                      setShowQuickExport(false);
                      quickExportPDF();
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2 text-red-600" />
                    PDF (Current View)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Export Configuration Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => !isExporting && handleCloseModal()}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                {/* Header */}
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Advanced Export Manager
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Configure, preview, and manage your data exports with powerful tools
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Shortcuts: ESC to close • Ctrl+Enter to export • Ctrl+1-6 to switch tabs
                      </p>
                    </div>
                    {!isExporting && (
                      <button
                        onClick={handleCloseModal}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    )}
                  </div>

                  {/* Tab Navigation */}
                  <div className="mt-6 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                      {exportTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                              isActive
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                            disabled={isExporting}
                          >
                            <Icon
                              className={`h-5 w-5 mr-2 ${
                                isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                              }`}
                            />
                            {tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="px-4 pb-4 sm:px-6 sm:pb-6" style={{ minHeight: '400px', maxHeight: '600px', overflowY: 'auto' }}>
                  {activeTab === 'basic' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Format & Basic Settings */}
                      <div className="space-y-6">
                        {/* Export Format */}
                        <div>
                          <label className="text-sm font-medium text-gray-900 mb-3 block">
                            Export Format
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                            {exportFormats.map((format) => {
                              const Icon = format.icon;
                              return (
                                <button
                                  key={format.value}
                                  onClick={() => setExportConfig(prev => ({ ...prev, format: format.value }))}
                                  className={`flex items-start p-3 border rounded-lg text-left transition-colors ${
                                    exportConfig.format === format.value
                                      ? 'border-blue-500 bg-blue-50'
                                      : 'border-gray-300 hover:border-gray-400'
                                  }`}
                                  disabled={isExporting}
                                >
                                  <Icon className="h-5 w-5 mt-0.5 mr-3 text-gray-400" />
                                  <div>
                                    <div className="font-medium text-sm text-gray-900">
                                      {format.label}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {format.description}
                                    </div>
                                  </div>
                                  {exportConfig.format === format.value && (
                                    <CheckIcon className="h-5 w-5 text-blue-500 ml-auto" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* File Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Custom File Name
                          </label>
                          <input
                            type="text"
                            value={exportConfig.customFileName}
                            onChange={(e) => setExportConfig(prev => ({ 
                              ...prev, 
                              customFileName: e.target.value 
                            }))}
                            placeholder={`${fileName}_${new Date().toISOString().split('T')[0]}`}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isExporting}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Leave empty to use default naming
                          </p>
                        </div>

                        {/* Options */}
                        <div>
                          <label className="text-sm font-medium text-gray-900 mb-3 block">
                            Export Options
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
                                Include export metadata
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
                                Include filter information
                              </span>
                            </label>

                            {exportConfig.format === 'xlsx' && (
                              <>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exportConfig.xlsxSettings.autoFilter}
                                    onChange={(e) => setExportConfig(prev => ({ 
                                      ...prev, 
                                      xlsxSettings: { ...prev.xlsxSettings, autoFilter: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={isExporting}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Enable Excel auto-filter
                                  </span>
                                </label>
                                
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exportConfig.xlsxSettings.freezeHeaders}
                                    onChange={(e) => setExportConfig(prev => ({ 
                                      ...prev, 
                                      xlsxSettings: { ...prev.xlsxSettings, freezeHeaders: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={isExporting}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Freeze header row
                                  </span>
                                </label>

                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exportConfig.xlsxSettings.includeSummary}
                                    onChange={(e) => setExportConfig(prev => ({ 
                                      ...prev, 
                                      xlsxSettings: { ...prev.xlsxSettings, includeSummary: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={isExporting}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Include summary sheet
                                  </span>
                                </label>
                              </>
                            )}

                            {exportConfig.format === 'pdf' && (
                              <>
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exportConfig.pdfSettings.includeHeader}
                                    onChange={(e) => setExportConfig(prev => ({ 
                                      ...prev, 
                                      pdfSettings: { ...prev.pdfSettings, includeHeader: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={isExporting}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Include document header
                                  </span>
                                </label>
                                
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={exportConfig.pdfSettings.includePageNumbers}
                                    onChange={(e) => setExportConfig(prev => ({ 
                                      ...prev, 
                                      pdfSettings: { ...prev.pdfSettings, includePageNumbers: e.target.checked }
                                    }))}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    disabled={isExporting}
                                  />
                                  <span className="ml-2 text-sm text-gray-700">
                                    Include page numbers
                                  </span>
                                </label>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Advanced Settings Toggle */}
                        <div>
                          <button
                            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                            disabled={isExporting}
                          >
                            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                            {showAdvancedSettings ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
                          </button>
                        </div>

                        {/* Advanced Settings Panel */}
                        {showAdvancedSettings && (
                          <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                            <AdvancedExportSettings
                              exportConfig={exportConfig}
                              setExportConfig={setExportConfig}
                              format={exportConfig.format}
                              isExporting={isExporting}
                            />
                          </div>
                        )}
                      </div>

                      {/* Right Column - Column Selection */}
                      <div className="space-y-6">
                        {/* Column Selection */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-900">
                              Select Columns ({exportConfig.selectedColumns.length}/{availableColumns.length})
                            </label>
                            <div className="flex space-x-2">
                              <button
                                onClick={selectAllColumns}
                                className="text-xs text-blue-600 hover:text-blue-800"
                                disabled={isExporting}
                              >
                                Select All
                              </button>
                              <button
                                onClick={deselectAllColumns}
                                className="text-xs text-gray-600 hover:text-gray-800"
                                disabled={isExporting}
                              >
                                Clear All
                              </button>
                            </div>
                          </div>
                          
                          <div className="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
                            {availableColumns.map((column, index) => (
                              <label
                                key={column.key}
                                className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                  index !== availableColumns.length - 1 ? 'border-b border-gray-200' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={exportConfig.selectedColumns.includes(column.key)}
                                  onChange={() => toggleColumn(column.key)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  disabled={isExporting}
                                />
                                <div className="ml-3 flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900">
                                    {column.label}
                                  </div>
                                  {column.description && (
                                    <div className="text-xs text-gray-500 truncate">
                                      {column.description}
                                    </div>
                                  )}
                                </div>
                                {exportConfig.selectedColumns.includes(column.key) ? (
                                  <EyeIcon className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                )}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Export Preview */}
                        <div>
                          <label className="text-sm font-medium text-gray-900 mb-3 block">
                            Export Summary
                          </label>
                          <div className="bg-gray-50 border border-gray-300 rounded-md p-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-700">Format:</span>
                                <span className="ml-2 text-gray-900">{exportConfig.format.toUpperCase()}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Records:</span>
                                <span className="ml-2 text-gray-900">{data.length.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Columns:</span>
                                <span className="ml-2 text-gray-900">{exportConfig.selectedColumns.length}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">File Size:</span>
                                <span className="ml-2 text-gray-900">{calculateEstimatedSize(exportConfig)}</span>
                              </div>
                            </div>
                            
                            {/* Validation Warnings */}
                            {(() => {
                              const errors = validateExportConfig(exportConfig);
                              const performanceWarning = checkPerformanceWarning(exportConfig);
                              
                              return (errors.length > 0 || performanceWarning) && (
                                <div className="mt-3 pt-3 border-t border-gray-300">
                                  {errors.length > 0 && (
                                    <div className="mb-2">
                                      {errors.map((error, index) => (
                                        <div key={index} className="flex items-center text-red-600 text-xs mb-1">
                                          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                          {error}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {performanceWarning && (
                                    <div className={`flex items-center text-xs ${
                                      performanceWarning.level === 'error' ? 'text-red-600' : 'text-yellow-600'
                                    }`}>
                                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                      </svg>
                                      {performanceWarning.message}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                            
                            {searchQuery && (
                              <div className="mt-3 pt-3 border-t border-gray-300">
                                <span className="text-xs font-medium text-gray-700">Search Query:</span>
                                <span className="ml-2 text-xs text-gray-900">"{searchQuery}"</span>
                              </div>
                            )}
                            
                            {Object.keys(activeFilters).length > 0 && (
                              <div className="mt-2">
                                <span className="text-xs font-medium text-gray-700">Active Filters:</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {Object.entries(activeFilters).map(([key, value]) => (
                                    <span key={key} className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                                      {key}: {String(value)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'preview' && (
                    <div className="min-h-[300px]">
                      <ExportPreview
                        data={data}
                        columns={columns}
                        exportConfig={exportConfig}
                        extractExportData={() => extractExportDataWithConfig(exportConfig)}
                      />
                    </div>
                  )}

                  {activeTab === 'analytics' && (
                    <div className="min-h-[300px]">
                      <ExportAnalytics
                        data={data}
                        columns={columns}
                        exportConfig={exportConfig}
                        generateSummaryData={generateSummaryData}
                      />
                    </div>
                  )}

                  {activeTab === 'templates' && (
                    <div className="min-h-[300px]">
                      <ExportTemplates
                        exportConfig={exportConfig}
                        onSave={handleSaveTemplate}
                        onLoad={handleLoadTemplate}
                        onDelete={handleDeleteTemplate}
                      />
                    </div>
                  )}

                  {activeTab === 'scheduler' && (
                    <div className="min-h-[300px]">
                      <ExportScheduler
                        exportConfig={exportConfig}
                        onSchedule={handleScheduleExport}
                        data={data}
                        columns={columns}
                      />
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="min-h-[300px]">
                      <ExportHistory
                        onReuse={(historyConfig) => {
                          setExportConfig(prev => ({
                            ...prev,
                            ...historyConfig.config,
                            customFileName: prev.customFileName
                          }));
                          setActiveTab('basic');
                          toast.success('Export configuration loaded from history');
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  {isExporting ? (
                    <div className="w-full sm:w-auto">
                      <div className="flex items-center">
                        <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                        <span className="text-sm font-medium text-gray-900 mr-4">
                          Exporting... {exportProgress}%
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${exportProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleExport}
                        disabled={exportConfig.selectedColumns.length === 0 || isExporting || validateExportConfig(exportConfig).length > 0}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                        Export {data.length.toLocaleString()} Records
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportManager;
