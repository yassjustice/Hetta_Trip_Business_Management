import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const VendorCompactList = ({ vendors, onDelete }) => {
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
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {vendors.map((vendor) => (
          <li key={vendor._id} className="hover:bg-gray-50">
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/vendors/${vendor._id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {vendor.companyName}
                      </Link>
                      <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                        <span>{vendor.businessType}</span>
                        <span>•</span>
                        <span>{vendor.address?.country || 'Unknown'}</span>
                        {vendor.contactPerson?.name && (
                          <>
                            <span>•</span>
                            <span>{vendor.contactPerson.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.sourcingStatus)}`}>
                        {vendor.sourcingStatus}
                      </span>
                      {vendor.rating?.overall && (
                        <div className="flex items-center">
                          <StarIconSolid className="h-4 w-4 text-yellow-400" />
                          <span className="ml-1 text-sm text-gray-500">
                            {vendor.rating.overall.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {vendor.productCategories?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {vendor.productCategories.slice(0, 3).map((category, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {category}
                        </span>
                      ))}
                      {vendor.productCategories.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                          +{vendor.productCategories.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <Link
                    to={`/vendors/${vendor._id}`}
                    className="text-blue-600 hover:text-blue-900 p-1"
                    title="View Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/vendors/${vendor._id}/edit`}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                    title="Edit Vendor"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => onDelete(vendor._id)}
                    className="text-red-600 hover:text-red-900 p-1"
                    title="Delete Vendor"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default VendorCompactList;
