import React, { useState, useEffect } from 'react';
import {
  StarIcon,
  BookmarkIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  FolderIcon,
  TagIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const ExportTemplates = ({ 
  config = {}, 
  onConfigChange, 
  onLoadTemplate,
  className = '' 
}) => {
  const [templates, setTemplates] = useState([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'general',
    tags: [],
    isPublic: false,
    isFavorite: false
  });

  // Built-in templates
  const builtInTemplates = [
    {
      id: 'vendor-basic',
      name: 'Basic Vendor Export',
      description: 'Essential vendor information for quick overview',
      category: 'vendor',
      isBuiltIn: true,
      isFavorite: false,
      settings: {
        format: 'xlsx',
        selectedColumns: ['companyName', 'businessType', 'location', 'contact', 'status'],
        includeMetadata: true,
        includeAnalytics: false,
        xlsxSettings: {
          autoFilter: true,
          freezeHeaders: true,
          includeSummary: false
        }
      },
      tags: ['basic', 'overview', 'quick']
    },
    {
      id: 'vendor-detailed',
      name: 'Detailed Vendor Report',
      description: 'Comprehensive vendor data with analytics',
      category: 'vendor',
      isBuiltIn: true,
      isFavorite: true,
      settings: {
        format: 'xlsx',
        selectedColumns: ['companyName', 'businessType', 'location', 'city', 'phone', 'website', 'contact', 'products', 'status', 'rating'],
        includeMetadata: true,
        includeAnalytics: true,
        xlsxSettings: {
          autoFilter: true,
          freezeHeaders: true,
          includeSummary: true
        },
        analyticsConfig: {
          summary: true,
          distribution: true,
          completeness: true
        }
      },
      tags: ['detailed', 'analytics', 'comprehensive']
    },
    {
      id: 'vendor-contact-list',
      name: 'Contact Directory',
      description: 'Contact information for communication',
      category: 'contact',
      isBuiltIn: true,
      isFavorite: false,
      settings: {
        format: 'csv',
        selectedColumns: ['companyName', 'contact', 'phone', 'website', 'location'],
        includeMetadata: false,
        includeAnalytics: false
      },
      tags: ['contacts', 'communication', 'directory']
    },
    {
      id: 'vendor-status-report',
      name: 'Status Summary Report',
      description: 'Focus on vendor sourcing status and progress',
      category: 'report',
      isBuiltIn: true,
      isFavorite: false,
      settings: {
        format: 'pdf',
        selectedColumns: ['companyName', 'businessType', 'status', 'rating'],
        includeMetadata: true,
        includeAnalytics: true,
        pdfSettings: {
          includeHeader: true,
          includeFooter: true,
          includePageNumbers: true
        },
        analyticsConfig: {
          summary: true,
          distribution: true
        }
      },
      tags: ['status', 'progress', 'report']
    },
    {
      id: 'vendor-api-data',
      name: 'API Data Export',
      description: 'JSON format for system integration',
      category: 'technical',
      isBuiltIn: true,
      isFavorite: false,
      settings: {
        format: 'json',
        selectedColumns: ['companyName', 'businessType', 'location', 'city', 'phone', 'website', 'status', 'rating'],
        includeMetadata: true,
        includeAnalytics: false
      },
      tags: ['api', 'integration', 'json']
    }
  ];

  const categories = [
    { value: 'general', label: 'General', icon: FolderIcon },
    { value: 'vendor', label: 'Vendor Management', icon: StarIcon },
    { value: 'contact', label: 'Contact Lists', icon: BookmarkIcon },
    { value: 'report', label: 'Reports', icon: DocumentDuplicateIcon },
    { value: 'technical', label: 'Technical/API', icon: CloudArrowUpIcon }
  ];

  // Load templates from localStorage on mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('exportTemplates');
    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (newTemplates) => {
    setTemplates(newTemplates);
    localStorage.setItem('exportTemplates', JSON.stringify(newTemplates));
  };

  const allTemplates = [...builtInTemplates, ...templates];

  const handleCreateTemplate = () => {
    if (!templateForm.name.trim()) return;

    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: templateForm.name,
      description: templateForm.description,
      category: templateForm.category,
      tags: templateForm.tags,
      isBuiltIn: false,
      isFavorite: templateForm.isFavorite,
      isPublic: templateForm.isPublic,
      createdAt: new Date().toISOString(),
      settings: { ...config }
    };

    saveTemplates([...templates, newTemplate]);
    setShowCreateTemplate(false);
    setTemplateForm({
      name: '',
      description: '',
      category: 'general',
      tags: [],
      isPublic: false,
      isFavorite: false
    });
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      const newTemplates = templates.filter(t => t.id !== templateId);
      saveTemplates(newTemplates);
    }
  };

  const handleToggleFavorite = (templateId) => {
    if (builtInTemplates.find(t => t.id === templateId)) {
      // Handle built-in templates differently - store favorites separately
      const favorites = JSON.parse(localStorage.getItem('templateFavorites') || '[]');
      const newFavorites = favorites.includes(templateId) 
        ? favorites.filter(id => id !== templateId)
        : [...favorites, templateId];
      localStorage.setItem('templateFavorites', JSON.stringify(newFavorites));
    } else {
      const newTemplates = templates.map(t => 
        t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t
      );
      saveTemplates(newTemplates);
    }
  };

  const handleLoadTemplate = (template) => {
    setSelectedTemplate(template);
    if (onConfigChange) {
      onConfigChange(prevConfig => ({
        ...prevConfig,
        ...template.settings,
        useTemplate: true,
        templateId: template.id
      }));
    }
    if (onLoadTemplate) {
      onLoadTemplate(template);
    }
  };

  const handleDuplicateTemplate = (template) => {
    const newTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isBuiltIn: false,
      createdAt: new Date().toISOString()
    };
    saveTemplates([...templates, newTemplate]);
  };

  const getTemplatesByCategory = (category) => {
    return allTemplates.filter(t => t.category === category);
  };

  const addTag = (tag) => {
    if (tag && !templateForm.tags.includes(tag)) {
      setTemplateForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setTemplateForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Export Templates</h3>
          <p className="text-sm text-gray-500">
            Save and reuse export configurations for consistent reporting
          </p>
        </div>
        
        <button
          onClick={() => setShowCreateTemplate(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
        </button>
      </div>

      {/* Current Template Info */}
      {selectedTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-md font-medium text-blue-900 flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Active Template: {selectedTemplate.name}
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {selectedTemplate.description}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                if (onConfigChange) {
                  onConfigChange(prevConfig => ({
                    ...prevConfig,
                    useTemplate: false,
                    templateId: null
                  }));
                }
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Clear Template
            </button>
          </div>
        </div>
      )}

      {/* Templates by Category */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryTemplates = getTemplatesByCategory(category.value);
          if (categoryTemplates.length === 0) return null;

          const Icon = category.icon;
          
          return (
            <div key={category.value} className="space-y-3">
              <h4 className="text-md font-medium text-gray-900 flex items-center">
                <Icon className="h-5 w-5 mr-2 text-gray-600" />
                {category.label}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryTemplates.map(template => {
                  const favorites = JSON.parse(localStorage.getItem('templateFavorites') || '[]');
                  const isFavorite = template.isBuiltIn 
                    ? favorites.includes(template.id)
                    : template.isFavorite;
                    
                  return (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                        selectedTemplate?.id === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleLoadTemplate(template)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <h5 className="text-sm font-medium text-gray-900 truncate">
                              {template.name}
                            </h5>
                            {template.isBuiltIn && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Built-in
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {template.description}
                          </p>
                          
                          {/* Template Details */}
                          <div className="mt-2 space-y-1">
                            <div className="text-xs text-gray-500">
                              Format: {template.settings.format?.toUpperCase()}
                              {template.settings.selectedColumns && (
                                <span> • {template.settings.selectedColumns.length} columns</span>
                              )}
                            </div>
                            
                            {/* Tags */}
                            {template.tags && template.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {template.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">
                                    +{template.tags.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(template.id);
                            }}
                            className="p-1 text-gray-400 hover:text-yellow-500"
                          >
                            {isFavorite ? (
                              <StarIconSolid className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <StarIcon className="h-4 w-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateTemplate(template);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-500"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          
                          {!template.isBuiltIn && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTemplate(template.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-500"
                              title="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCreateTemplate(false)}
          />
          
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Create Export Template
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Save your current export configuration as a reusable template
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Template Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Monthly Vendor Report"
                      />
                    </div>
                    
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe what this template is used for..."
                      />
                    </div>
                    
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {templateForm.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(tag)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Add tags (press Enter)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                        className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    {/* Options */}
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={templateForm.isFavorite}
                          onChange={(e) => setTemplateForm(prev => ({ ...prev, isFavorite: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Add to favorites
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={handleCreateTemplate}
                    disabled={!templateForm.name.trim()}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Template
                  </button>
                  <button
                    onClick={() => setShowCreateTemplate(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {allTemplates.length === 0 && (
        <div className="text-center py-8">
          <BookmarkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Templates Available
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Create your first template to save and reuse export configurations
          </p>
          <button
            onClick={() => setShowCreateTemplate(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Template
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportTemplates;
