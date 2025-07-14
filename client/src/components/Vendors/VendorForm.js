import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vendorAPI } from '../../services/api';
import FormInput from '../Common/FormInput';
import FormSelect from '../Common/FormSelect';
import LoadingSpinner from '../Common/LoadingSpinner';

const VendorForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Basic Information
    companyName: '',
    businessType: '',
    description: '',
    
    // Contact Information
    contactPerson: {
      name: '',
      position: '',
      email: '',
      phone: '',
      whatsapp: ''
    },
    
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    
    website: '',
    socialMedia: {
      linkedin: '',
      facebook: '',
      instagram: '',
      alibaba: ''
    },
    
    // Business Details
    yearEstablished: '',
    numberOfEmployees: '',
    certifications: [],
    
    // Product & Service Information
    productCategories: [],
    specializations: [],
    minimumOrderQuantity: {
      value: '',
      unit: 'pieces'
    },
    
    // Pricing & Terms
    priceRange: '',
    paymentTerms: [],
    deliveryTime: {
      min: '',
      max: '',
      unit: 'days'
    },
    
    // Capabilities
    customization: '',
    samplePolicy: {
      free: false,
      cost: '',
      refundable: false
    },
    
    // Quality & Compliance
    qualityStandards: [],
    sustainabilityPractices: [],
    
    // Status & Tracking
    sourcingStatus: 'New Lead',
    rating: {
      overall: '',
      communication: '',
      quality: '',
      pricing: '',
      delivery: ''
    },
    notes: '',
    tags: []
  });

  const businessTypeOptions = [
    { value: 'Manufacturer', label: 'Manufacturer' },
    { value: 'Supplier', label: 'Supplier' },
    { value: 'Wholesaler', label: 'Wholesaler' },
    { value: 'Agent', label: 'Agent' },
    { value: 'Trading Company', label: 'Trading Company' }
  ];

  const employeeOptions = [
    { value: '1-10', label: '1-10 employees' },
    { value: '11-50', label: '11-50 employees' },
    { value: '51-200', label: '51-200 employees' },
    { value: '201-500', label: '201-500 employees' },
    { value: '500+', label: '500+ employees' }
  ];

  const productCategoryOptions = [
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
  ];

  const priceRangeOptions = [
    { value: 'Budget', label: 'Budget' },
    { value: 'Mid-range', label: 'Mid-range' },
    { value: 'Premium', label: 'Premium' },
    { value: 'Luxury', label: 'Luxury' }
  ];

  const customizationOptions = [
    { value: 'None', label: 'None' },
    { value: 'Limited', label: 'Limited' },
    { value: 'Full Custom', label: 'Full Custom' },
    { value: 'OEM/ODM', label: 'OEM/ODM' }
  ];

  const sourcingStatusOptions = [
    { value: 'New Lead', label: 'New Lead' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Sample Requested', label: 'Sample Requested' },
    { value: 'Under Evaluation', label: 'Under Evaluation' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' }
  ];

  const countryOptions = [
    { value: 'China', label: 'China' },
    { value: 'India', label: 'India' },
    { value: 'Bangladesh', label: 'Bangladesh' },
    { value: 'Vietnam', label: 'Vietnam' },
    { value: 'Turkey', label: 'Turkey' },
    { value: 'Pakistan', label: 'Pakistan' },
    { value: 'Indonesia', label: 'Indonesia' },
    { value: 'Thailand', label: 'Thailand' },
    { value: 'South Korea', label: 'South Korea' },
    { value: 'Italy', label: 'Italy' },
    { value: 'Other', label: 'Other' }
  ];

  useEffect(() => {
    if (isEditing) {
      loadVendor();
    }
  }, [id, isEditing]);

  const loadVendor = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getById(id);
      setFormData(response.data);
    } catch (error) {
      console.error('Error loading vendor:', error);
      toast.error('Failed to load vendor data');
      navigate('/vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleArrayInputChange = (fieldName, values) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: values
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Only essential fields are required for quick saving
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.businessType) {
      newErrors.businessType = 'Business type is required';
    }

    if (!formData.contactPerson.name.trim()) {
      newErrors['contactPerson.name'] = 'Contact person name is required';
    }

    if (!formData.contactPerson.email.trim()) {
      newErrors['contactPerson.email'] = 'Contact email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactPerson.email)) {
      newErrors['contactPerson.email'] = 'Please enter a valid email';
    }

    if (!formData.address.country) {
      newErrors['address.country'] = 'Country is required';
    }

    // Removed productCategories requirement for flexible saving

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditing) {
        await vendorAPI.update(id, formData);
        toast.success('Vendor updated successfully');
      } else {
        await vendorAPI.create(formData);
        toast.success('Vendor created successfully');
      }
      
      navigate('/vendors');
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast.error(error.response?.data?.message || 'Failed to save vendor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/vendors');
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" text="Loading vendor data..." />;
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isEditing ? 'Update vendor information' : 'Add a new vendor to your network'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormInput
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                error={errors.companyName}
                required
                className="sm:col-span-2"
              />
              
              <FormSelect
                label="Business Type"
                name="businessType"
                value={formData.businessType}
                onChange={handleInputChange}
                options={businessTypeOptions}
                error={errors.businessType}
                required
              />
              
              <FormInput
                label="Year Established"
                name="yearEstablished"
                type="number"
                value={formData.yearEstablished}
                onChange={handleInputChange}
                error={errors.yearEstablished}
                placeholder="e.g., 2010"
              />
              
              <div className="sm:col-span-2">
                <FormInput
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  error={errors.description}
                  placeholder="Brief description of the company..."
                  type="textarea"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormInput
                label="Contact Person Name"
                name="contactPerson.name"
                value={formData.contactPerson.name}
                onChange={handleInputChange}
                error={errors['contactPerson.name']}
                required
              />
              
              <FormInput
                label="Position"
                name="contactPerson.position"
                value={formData.contactPerson.position}
                onChange={handleInputChange}
                error={errors['contactPerson.position']}
                placeholder="e.g., Sales Manager"
              />
              
              <FormInput
                label="Email"
                name="contactPerson.email"
                type="email"
                value={formData.contactPerson.email}
                onChange={handleInputChange}
                error={errors['contactPerson.email']}
                required
              />
              
              <FormInput
                label="Phone"
                name="contactPerson.phone"
                value={formData.contactPerson.phone}
                onChange={handleInputChange}
                error={errors['contactPerson.phone']}
                placeholder="+1 234 567 8900"
              />
              
              <FormInput
                label="WhatsApp"
                name="contactPerson.whatsapp"
                value={formData.contactPerson.whatsapp}
                onChange={handleInputChange}
                error={errors['contactPerson.whatsapp']}
                placeholder="+1 234 567 8900"
              />
              
              <FormInput
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                error={errors.website}
                placeholder="www.example.com or https://example.com"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormInput
                label="Street Address"
                name="address.street"
                value={formData.address.street}
                onChange={handleInputChange}
                error={errors['address.street']}
                className="sm:col-span-2"
              />
              
              <FormInput
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                error={errors['address.city']}
              />
              
              <FormInput
                label="State/Province"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                error={errors['address.state']}
              />
              
              <FormSelect
                label="Country"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                options={countryOptions}
                error={errors['address.country']}
                required
              />
              
              <FormInput
                label="ZIP/Postal Code"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleInputChange}
                error={errors['address.zipCode']}
              />
            </div>
          </div>

          {/* Business Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormSelect
                label="Number of Employees"
                name="numberOfEmployees"
                value={formData.numberOfEmployees || ''}
                onChange={handleInputChange}
                options={employeeOptions}
                error={errors.numberOfEmployees}
              />
              
              <FormSelect
                label="Price Range"
                name="priceRange"
                value={formData.priceRange || ''}
                onChange={handleInputChange}
                options={priceRangeOptions}
                error={errors.priceRange}
              />
              
              <FormSelect
                label="Customization Level"
                name="customization"
                value={formData.customization || ''}
                onChange={handleInputChange}
                options={customizationOptions}
                error={errors.customization}
              />
              
              <FormSelect
                label="Sourcing Status"
                name="sourcingStatus"
                value={formData.sourcingStatus}
                onChange={handleInputChange}
                options={sourcingStatusOptions}
                error={errors.sourcingStatus}
              />
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
            <ProductCategorySelector
              selectedCategories={formData.productCategories}
              options={productCategoryOptions}
              onChange={(categories) => handleArrayInputChange('productCategories', categories)}
              error={errors.productCategories}
            />
          </div>

          {/* Minimum Order Quantity */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <FormInput
                label="Minimum Order Quantity"
                name="minimumOrderQuantity.value"
                type="number"
                value={formData.minimumOrderQuantity.value}
                onChange={handleInputChange}
                error={errors['minimumOrderQuantity.value']}
                placeholder="e.g., 1000"
              />
              
              <FormSelect
                label="Unit"
                name="minimumOrderQuantity.unit"
                value={formData.minimumOrderQuantity.unit}
                onChange={handleInputChange}
                options={[
                  { value: 'pieces', label: 'Pieces' },
                  { value: 'meters', label: 'Meters' },
                  { value: 'yards', label: 'Yards' },
                  { value: 'kg', label: 'Kilograms' },
                  { value: 'tons', label: 'Tons' }
                ]}
                error={errors['minimumOrderQuantity.unit']}
              />
              
              <div className="sm:col-span-1"></div>
            </div>
          </div>

          {/* Delivery Time */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <FormInput
                label="Minimum Delivery Time"
                name="deliveryTime.min"
                type="number"
                value={formData.deliveryTime.min}
                onChange={handleInputChange}
                error={errors['deliveryTime.min']}
                placeholder="e.g., 15"
              />
              
              <FormInput
                label="Maximum Delivery Time"
                name="deliveryTime.max"
                type="number"
                value={formData.deliveryTime.max}
                onChange={handleInputChange}
                error={errors['deliveryTime.max']}
                placeholder="e.g., 30"
              />
              
              <FormSelect
                label="Unit"
                name="deliveryTime.unit"
                value={formData.deliveryTime.unit}
                onChange={handleInputChange}
                options={[
                  { value: 'days', label: 'Days' },
                  { value: 'weeks', label: 'Weeks' },
                  { value: 'months', label: 'Months' }
                ]}
                error={errors['deliveryTime.unit']}
              />
            </div>
          </div>

          {/* Sample Policy */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Policy</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="flex items-center">
                <input
                  id="samplePolicy.free"
                  name="samplePolicy.free"
                  type="checkbox"
                  checked={formData.samplePolicy.free}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="samplePolicy.free" className="ml-2 block text-sm text-gray-900">
                  Free samples available
                </label>
              </div>
              
              <FormInput
                label="Sample Cost (if not free)"
                name="samplePolicy.cost"
                type="number"
                value={formData.samplePolicy.cost}
                onChange={handleInputChange}
                error={errors['samplePolicy.cost']}
                placeholder="e.g., 50"
                disabled={formData.samplePolicy.free}
              />
              
              <div className="flex items-center">
                <input
                  id="samplePolicy.refundable"
                  name="samplePolicy.refundable"
                  type="checkbox"
                  checked={formData.samplePolicy.refundable}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={formData.samplePolicy.free}
                />
                <label htmlFor="samplePolicy.refundable" className="ml-2 block text-sm text-gray-900">
                  Sample cost is refundable
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
            <FormInput
              label="Notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              error={errors.notes}
              placeholder="Any additional notes or comments..."
              type="textarea"
              rows={4}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">{isEditing ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                isEditing ? 'Update Vendor' : 'Create Vendor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Product Category Selector Component
const ProductCategorySelector = ({ selectedCategories, options, onChange, error }) => {
  const handleCategoryToggle = (categoryValue) => {
    const updatedCategories = selectedCategories.includes(categoryValue)
      ? selectedCategories.filter(cat => cat !== categoryValue)
      : [...selectedCategories, categoryValue];
    
    onChange(updatedCategories);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Product Categories
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {options.map((option) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`category-${option.value}`}
              type="checkbox"
              checked={selectedCategories.includes(option.value)}
              onChange={() => handleCategoryToggle(option.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`category-${option.value}`} className="ml-2 block text-sm text-gray-900">
              {option.label}
            </label>
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-1 text-sm text-gray-500">
        Selected: {selectedCategories.length} categories
      </p>
    </div>
  );
};

export default VendorForm;
