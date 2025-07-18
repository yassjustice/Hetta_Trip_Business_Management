import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const ResearchImportModal = ({ 
  open, 
  onClose, 
  selectedResults = [], 
  onImport, 
  loading = false 
}) => {
  const [importSettings, setImportSettings] = useState({
    importMode: 'create_new', // 'create_new', 'update_existing', 'merge'
    conflictResolution: 'skip', // 'skip', 'overwrite', 'merge'
    validateBeforeImport: true,
    createProjects: false,
    defaultStatus: 'active',
    assignToUser: '',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('ready'); // 'ready', 'importing', 'completed', 'error'

  useEffect(() => {
    if (selectedResults.length > 0) {
      generateImportPreview();
    }
  }, [selectedResults, importSettings]);

  const generateImportPreview = () => {
    const preview = selectedResults.map(result => {
      const data = result.extractedData || {};
      return {
        id: result._id,
        companyName: data.companyName || data.name || 'Unknown Company',
        website: data.website,
        email: data.email,
        phone: data.phone,
        location: data.location,
        serviceTypes: data.serviceTypes || [],
        status: result.validationStatus || 'pending',
        action: getImportAction(result),
        conflicts: getConflicts(result)
      };
    });
    setImportPreview(preview);
  };

  const getImportAction = (result) => {
    switch (importSettings.importMode) {
      case 'create_new':
        return 'Create New Vendor';
      case 'update_existing':
        return 'Update Existing';
      case 'merge':
        return 'Merge Data';
      default:
        return 'Create New Vendor';
    }
  };

  const getConflicts = (result) => {
    // Mock conflict detection - in real implementation, this would check against existing vendors
    const conflicts = [];
    const data = result.extractedData || {};
    
    if (data.website) {
      // Check if website already exists
      conflicts.push('Website already exists in database');
    }
    
    return conflicts;
  };

  const handleSettingChange = (setting, value) => {
    setImportSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !importSettings.tags.includes(tagInput.trim())) {
      setImportSettings(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setImportSettings(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImport = async () => {
    try {
      setImportStatus('importing');
      setImportProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await onImport({
        results: selectedResults,
        settings: importSettings
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportStatus('completed');

      // Auto-close after success
      setTimeout(() => {
        onClose();
        setImportStatus('ready');
        setImportProgress(0);
      }, 2000);

    } catch (error) {
      setImportStatus('error');
      console.error('Import failed:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'validated':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'needs_review':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'invalid':
        return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      validated: 'bg-green-100 text-green-800',
      needs_review: 'bg-yellow-100 text-yellow-800',
      invalid: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {getStatusIcon(status)}
        <span className="ml-1">{status.replace('_', ' ').toUpperCase()}</span>
      </span>
    );
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">
                      Import Research Results
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-600">
                      Import {selectedResults.length} selected result{selectedResults.length !== 1 ? 's' : ''} into your vendor database
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={importStatus === 'importing'}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                  {importStatus === 'importing' && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Importing vendors...</span>
                        <span className="text-sm text-blue-700">{importProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${importProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {importStatus === 'completed' && (
                    <div className="mb-6 p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircleIcon className="w-5 h-5 text-green-400 mr-2" />
                        <span className="text-sm font-medium text-green-900">
                          Successfully imported {selectedResults.length} vendor{selectedResults.length !== 1 ? 's' : ''}!
                        </span>
                      </div>
                    </div>
                  )}

                  {importStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center">
                        <XCircleIcon className="w-5 h-5 text-red-400 mr-2" />
                        <span className="text-sm font-medium text-red-900">
                          Import failed. Please try again.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Import Settings */}
                    <div className="space-y-6">
                      <h4 className="text-md font-medium text-gray-900">Import Settings</h4>
                      
                      {/* Import Mode */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Import Mode
                        </label>
                        <select
                          value={importSettings.importMode}
                          onChange={(e) => handleSettingChange('importMode', e.target.value)}
                          disabled={importStatus === 'importing'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="create_new">Create New Vendors</option>
                          <option value="update_existing">Update Existing Vendors</option>
                          <option value="merge">Merge with Existing</option>
                        </select>
                      </div>

                      {/* Conflict Resolution */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Conflict Resolution
                        </label>
                        <select
                          value={importSettings.conflictResolution}
                          onChange={(e) => handleSettingChange('conflictResolution', e.target.value)}
                          disabled={importStatus === 'importing'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="skip">Skip Conflicting Records</option>
                          <option value="overwrite">Overwrite Existing Data</option>
                          <option value="merge">Merge Data Fields</option>
                        </select>
                      </div>

                      {/* Default Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Vendor Status
                        </label>
                        <select
                          value={importSettings.defaultStatus}
                          onChange={(e) => handleSettingChange('defaultStatus', e.target.value)}
                          disabled={importStatus === 'importing'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending Review</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importSettings.validateBeforeImport}
                            onChange={(e) => handleSettingChange('validateBeforeImport', e.target.checked)}
                            disabled={importStatus === 'importing'}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">Validate data before import</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={importSettings.createProjects}
                            onChange={(e) => handleSettingChange('createProjects', e.target.checked)}
                            disabled={importStatus === 'importing'}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                          />
                          <span className="ml-2 text-sm text-gray-700">Create initial projects for vendors</span>
                        </label>
                      </div>

                      {/* Tags */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add Tags to Imported Vendors
                        </label>
                        <div className="flex space-x-2 mb-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                            placeholder="Enter tag"
                            disabled={importStatus === 'importing'}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                          <button
                            type="button"
                            onClick={handleAddTag}
                            disabled={importStatus === 'importing'}
                            className="px-3 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {importSettings.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                disabled={importStatus === 'importing'}
                                className="ml-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Import Preview */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4">Import Preview</h4>
                      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                        {importPreview.map((item, index) => (
                          <div key={item.id} className="p-4 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">{item.companyName}</span>
                                  {getStatusBadge(item.status)}
                                </div>
                                <div className="mt-1 text-sm text-gray-600 space-y-1">
                                  {item.website && <div>🌐 {item.website}</div>}
                                  {item.email && <div>📧 {item.email}</div>}
                                  {item.location && <div>📍 {item.location}</div>}
                                  {item.serviceTypes.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {item.serviceTypes.slice(0, 3).map((service, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                          {service}
                                        </span>
                                      ))}
                                      {item.serviceTypes.length > 3 && (
                                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                          +{item.serviceTypes.length - 3}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-blue-600">{item.action}</div>
                            {item.conflicts.length > 0 && (
                              <div className="mt-2">
                                {item.conflicts.map((conflict, idx) => (
                                  <div key={idx} className="text-xs text-yellow-600 flex items-center">
                                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                    {conflict}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {selectedResults.length} vendor{selectedResults.length !== 1 ? 's' : ''} selected for import
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={onClose}
                      disabled={importStatus === 'importing'}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={selectedResults.length === 0 || importStatus === 'importing' || importStatus === 'completed'}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {importStatus === 'importing' ? 'Importing...' : 
                       importStatus === 'completed' ? 'Completed' : 
                       `Import ${selectedResults.length} Vendor${selectedResults.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ResearchImportModal;
