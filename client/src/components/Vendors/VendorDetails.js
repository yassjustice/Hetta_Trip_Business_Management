import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  PencilIcon, 
  TrashIcon, 
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  StarIcon,
  DocumentIcon,
  CalendarIcon,
  TagIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { vendorAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await vendorAPI.getById(id);
      setVendor(response.data);
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast.error('Failed to load vendor details');
      navigate('/vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await vendorAPI.delete(id);
      toast.success('Vendor deleted successfully');
      navigate('/vendors');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor');
    }
  };

  const handleRatingUpdate = async (category, value) => {
    try {
      // Initialize rating object if it doesn't exist
      const currentRating = vendor.rating || {};
      
      // Only send the specific category being updated
      const ratingUpdate = { [category]: value };
      
      console.log('Updating rating:', { 
        category, 
        value, 
        currentRating, 
        ratingUpdate,
        vendorId: id 
      }); // Debug log
      
      const response = await vendorAPI.updateRating(id, ratingUpdate);
      
      console.log('Rating update response:', response.data);
      
      // Update local state with the response from server
      setVendor({ 
        ...vendor, 
        rating: response.data.rating || { ...currentRating, [category]: value }
      });
      
      toast.success(`${category.charAt(0).toUpperCase() + category.slice(1)} rating updated successfully`);
    } catch (error) {
      console.error('Error updating rating:', error);
      console.error('Error response:', error.response?.data);
      
      // More detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          'Failed to update rating';
      
      toast.error(errorMessage);
    }
  };

  const renderStars = (rating, category) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          onClick={() => handleRatingUpdate(category, i)}
          className="text-yellow-400 hover:text-yellow-500 transition-colors"
        >
          {i <= (rating || 0) ? (
            <StarIconSolid className="h-5 w-5" />
          ) : (
            <StarIcon className="h-5 w-5" />
          )}
        </button>
      );
    }
    return stars;
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'New Lead': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Sample Requested': 'bg-purple-100 text-purple-800',
      'Under Evaluation': 'bg-orange-100 text-orange-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!vendor) {
    return (
      <div className="max-w-4xl mx-auto py-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h1>
          <p className="text-gray-600">The vendor you're looking for doesn't exist.</p>
          <Link
            to="/vendors"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Vendors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/vendors')}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{vendor.companyName}</h1>
              <div className="flex items-center space-x-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(vendor.sourcingStatus)}`}>
                  {vendor.sourcingStatus}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {vendor.businessType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/vendors/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Business Type</label>
                <p className="mt-1 text-sm text-gray-900">{vendor.businessType}</p>
              </div>
              {vendor.yearEstablished && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year Established</label>
                  <p className="mt-1 text-sm text-gray-900">{vendor.yearEstablished}</p>
                </div>
              )}
              {vendor.numberOfEmployees && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Employees</label>
                  <p className="mt-1 text-sm text-gray-900">{vendor.numberOfEmployees}</p>
                </div>
              )}
              {vendor.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <a 
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {vendor.website}
                  </a>
                </div>
              )}
            </div>
            {vendor.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-900">{vendor.description}</p>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <UserIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{vendor.contactPerson.name}</p>
                  {vendor.contactPerson.position && (
                    <p className="text-sm text-gray-600">{vendor.contactPerson.position}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <a 
                  href={`mailto:${vendor.contactPerson.email}`}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  {vendor.contactPerson.email}
                </a>
              </div>
              {vendor.contactPerson.phone && (
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-900">{vendor.contactPerson.phone}</p>
                </div>
              )}
            </div>

            {/* Address */}
            {vendor.address && (
              <div className="mt-6">
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600">
                      {[
                        vendor.address.street,
                        vendor.address.city,
                        vendor.address.state,
                        vendor.address.country,
                        vendor.address.zipCode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Categories & Specializations */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Products & Services
            </h2>
            {vendor.productCategories && vendor.productCategories.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Categories</label>
                <div className="flex flex-wrap gap-2">
                  {vendor.productCategories.map((category, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {vendor.specializations && vendor.specializations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {vendor.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Business Terms */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Business Terms
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vendor.minimumOrderQuantity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Order Quantity</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {vendor.minimumOrderQuantity.value} {vendor.minimumOrderQuantity.unit}
                  </p>
                </div>
              )}
              {vendor.priceRange && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price Range</label>
                  <p className="mt-1 text-sm text-gray-900">{vendor.priceRange}</p>
                </div>
              )}
              {vendor.deliveryTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Delivery Time</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {vendor.deliveryTime.min}-{vendor.deliveryTime.max} {vendor.deliveryTime.unit}
                  </p>
                </div>
              )}
              {vendor.customization && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customization</label>
                  <p className="mt-1 text-sm text-gray-900">{vendor.customization}</p>
                </div>
              )}
            </div>
            {vendor.paymentTerms && vendor.paymentTerms.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                <div className="flex flex-wrap gap-2">
                  {vendor.paymentTerms.map((term, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {vendor.notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{vendor.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ratings */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <StarIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Ratings
            </h3>
            <div className="space-y-4">
              {[
                { key: 'overall', label: 'Overall' },
                { key: 'communication', label: 'Communication' },
                { key: 'quality', label: 'Quality' },
                { key: 'pricing', label: 'Pricing' },
                { key: 'delivery', label: 'Delivery' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-sm text-gray-600">
                      {vendor.rating?.[key] || 0}/5
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {renderStars(vendor.rating?.[key], key)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Added</span>
                <span className="text-sm text-gray-900">
                  {new Date(vendor.createdAt).toLocaleDateString()}
                </span>
              </div>
              {vendor.lastContact && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Contact</span>
                  <span className="text-sm text-gray-900">
                    {new Date(vendor.lastContact).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(vendor.sourcingStatus)}`}>
                  {vendor.sourcingStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Certifications */}
          {vendor.certifications && vendor.certifications.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-indigo-500" />
                Certifications
              </h3>
              <div className="space-y-2">
                {vendor.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-gray-900">{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {vendor.documents && vendor.documents.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentIcon className="h-5 w-5 mr-2 text-indigo-500" />
                Documents
              </h3>
              <div className="space-y-2">
                {vendor.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DocumentIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{doc.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{doc.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <TrashIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Vendor</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete {vendor.companyName}? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDetails;
