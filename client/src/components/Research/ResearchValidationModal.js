import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Disclosure } from '@headlessui/react';
import {
  XMarkIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ResearchValidationModal = ({ 
  open, 
  onClose, 
  result, 
  onSave, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({});
  const [validationStatus, setValidationStatus] = useState('pending');
  const [validationNotes, setValidationNotes] = useState('');
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    if (result && open) {
      setFormData(result.extractedData || {});
      setValidationStatus(result.validationStatus || 'pending');
      setValidationNotes(result.validationNotes || '');
      setConfidence(result.confidence || 0);
    }
  }, [result, open]);

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayFieldChange = (field, value, index) => {
    const currentArray = formData[field] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    handleFieldChange(field, newArray);
  };

  const handleAddArrayItem = (field) => {
    const currentArray = formData[field] || [];
    handleFieldChange(field, [...currentArray, '']);
  };

  const handleRemoveArrayItem = (field, index) => {
    const currentArray = formData[field] || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    handleFieldChange(field, newArray);
  };

  const handleSave = () => {
    const updatedResult = {
      ...result,
      extractedData: formData,
      validationStatus,
      validationNotes,
      confidence,
      validatedAt: new Date().toISOString(),
      validatedBy: 'current_user' // This should come from auth context
    };

    onSave(updatedResult);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'validated':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'invalid':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'needs_review':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const renderTextField = (field, label, multiline = false, placeholder = '') => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={3}
          value={formData[field] || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      ) : (
        <input
          type="text"
          value={formData[field] || ''}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      )}
    </div>
  );

  const renderArrayField = (field, label) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="space-y-2">
        {(formData[field] || []).map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleArrayFieldChange(field, e.target.value, index)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => handleRemoveArrayItem(field, index)}
              className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-md hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => handleAddArrayItem(field)}
          className="px-3 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
        >
          Add {label.slice(0, -1)}
        </button>
      </div>
    </div>
  );

  if (!result) return null;

  return (
    <Transition show={!!open} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Validate Research Result
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Source Info */}
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <div className="text-sm text-blue-800">
                    <p><strong>Source:</strong> {result.url}</p>
                    <p><strong>Search Term:</strong> {result.searchTerm}</p>
                    <p><strong>Confidence:</strong> {Math.round(confidence * 100)}%</p>
                  </div>
                </div>

                {/* Validation Status */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Validation Status
                  </label>
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(validationStatus)}
                    <select
                      value={validationStatus}
                      onChange={(e) => setValidationStatus(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="validated">Validated</option>
                      <option value="needs_review">Needs Review</option>
                      <option value="invalid">Invalid</option>
                    </select>
                  </div>
                  <textarea
                    rows={2}
                    value={validationNotes}
                    onChange={(e) => setValidationNotes(e.target.value)}
                    placeholder="Add notes about validation or required changes..."
                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Form Fields */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Company Information */}
                  <Disclosure defaultOpen>
                    {({ open }) => (
                      <div>
                        <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-blue-900 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                          <span>Company Information</span>
                          <ChevronDownIcon
                            className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-blue-500`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderTextField('companyName', 'Company Name')}
                            {renderTextField('website', 'Website')}
                            {renderTextField('email', 'Email')}
                            {renderTextField('phone', 'Phone')}
                            {renderTextField('description', 'Description', true)}
                          </div>
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>

                  {/* Location Information */}
                  <Disclosure>
                    {({ open }) => (
                      <div>
                        <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-blue-900 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                          <span>Location Information</span>
                          <ChevronDownIcon
                            className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-blue-500`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderTextField('country', 'Country')}
                            {renderTextField('city', 'City')}
                            {renderTextField('address', 'Address', true)}
                          </div>
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>

                  {/* Services & Capabilities */}
                  <Disclosure>
                    {({ open }) => (
                      <div>
                        <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-blue-900 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                          <span>Services & Capabilities</span>
                          <ChevronDownIcon
                            className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-blue-500`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderArrayField('serviceTypes', 'Service Types')}
                            {renderArrayField('printingMethods', 'Printing Methods')}
                            {renderTextField('moq', 'Minimum Order Quantity')}
                            {renderTextField('leadTime', 'Lead Time')}
                            {renderArrayField('certifications', 'Certifications')}
                          </div>
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>

                  {/* Pricing Information */}
                  <Disclosure>
                    {({ open }) => (
                      <div>
                        <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-blue-900 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                          <span>Pricing Information</span>
                          <ChevronDownIcon
                            className={`${open ? 'transform rotate-180' : ''} w-5 h-5 text-blue-500`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderTextField('priceRange', 'Price Range')}
                            {renderTextField('currency', 'Currency')}
                            {renderTextField('pricingNotes', 'Pricing Notes', true)}
                          </div>
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidationStatus('invalid')}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Mark Invalid
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ResearchValidationModal;
