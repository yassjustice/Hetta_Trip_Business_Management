import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const VendorCard = ({ vendor, onDelete }) => {
  const getStatusColor = (status) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {vendor.companyName}
            </h3>
            <p className="text-sm text-gray-500">{vendor.businessType}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.sourcingStatus)}`}>
            {vendor.sourcingStatus}
          </span>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Location:</span>
            <span className="ml-1">{vendor.address?.country || 'N/A'}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <span className="font-medium">Contact:</span>
            <span className="ml-1">{vendor.contactPerson?.name}</span>
          </div>
          {vendor.productCategories?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {vendor.productCategories.slice(0, 2).map((category, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  {category}
                </span>
              ))}
              {vendor.productCategories.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{vendor.productCategories.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <div className="flex space-x-2">
            <Link
              to={`/vendors/${vendor._id}`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              View
            </Link>
            <Link
              to={`/vendors/${vendor._id}/edit`}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </div>
          <button
            onClick={() => onDelete(vendor._id)}
            className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorCard;
