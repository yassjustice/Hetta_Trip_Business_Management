import React from 'react';
import { Link } from 'react-router-dom';
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  StarIcon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const VendorTable = ({ 
  vendors, 
  onDelete, 
  sortConfig, 
  onSort, 
  visibleColumns, 
  columnOrder, 
  columns,
  statusEditingEnabled = false,
  editingStatus = null,
  onStatusEdit,
  onStatusSave,
  onStatusCancel
}) => {
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

  const renderStars = (rating) => {
    const stars = [];
    const overallRating = rating?.overall || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= overallRating ? (
          <StarIconSolid key={i} className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        )
      );
    }
    return <div className="flex">{stars}</div>;
  };

  const SortableHeader = ({ sortKey, children, className = "" }) => (
    <th 
      scope="col" 
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'asc' ? (
            <ChevronUpIcon className="h-4 w-4" />
          ) : (
            <ChevronDownIcon className="h-4 w-4" />
          )
        )}
      </div>
    </th>
  );

  // Get ordered and visible columns
  // Ensure all columns from DEFAULT_COLUMNS are present in columnOrder and visibleColumns
  const allColumnKeys = columns.map(col => col.key);
  const mergedColumnOrder = Array.from(new Set([...allColumnKeys, ...columnOrder]));
  const mergedVisibleColumns = Array.from(new Set([...allColumnKeys, ...visibleColumns]));

  const orderedColumns = mergedColumnOrder
    .map(key => columns.find(col => col.key === key))
    .filter(col => col && mergedVisibleColumns.includes(col.key));

  // Column renderers
  const renderColumnHeader = (column) => {
    // Remove responsive hiding, always show columns
    const getResponsiveClass = () => '';

    const getMinWidthClass = (minWidth) => {
      if (!minWidth) return '';
      // Convert minWidth like '200px' to 'min-w-[200px]'
      return `min-w-[${minWidth}]`;
    };

    if (['companyName', 'businessType', 'location', 'city', 'status', 'rating', 'serviceTypes', 'printingMethods', 'moq', 'priceRange', 'certifications'].includes(column.key)) {
      return (
        <SortableHeader 
          key={column.key}
          sortKey={column.key} 
          className={`${getResponsiveClass(column.key)} ${getMinWidthClass(column.minWidth)}`}
        >
          {column.label}
        </SortableHeader>
      );
    }

    return (
      <th 
        key={column.key}
        scope="col" 
        className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${getResponsiveClass(column.key)} ${getMinWidthClass(column.minWidth)}`}
      >
        {column.label}
      </th>
    );
  };

  const renderColumnCell = (vendor, column) => {
    // Remove responsive hiding, always show columns
    const getResponsiveClass = () => '';

    switch (column.key) {
      case 'companyName':
        return (
          <td key={column.key} className="px-4 py-4 whitespace-nowrap">
            <div className="flex items-center">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {vendor.companyName}
                </div>
                <div className="md:hidden text-xs text-gray-500 mt-1">
                  {vendor.businessType}
                  {vendor.address?.country && ` • ${vendor.address.country}`}
                  {vendor.address?.city && ` • ${vendor.address.city}`}
                </div>
                {vendor.yearEstablished && (
                  <div className="hidden md:block text-sm text-gray-500">
                    Est. {vendor.yearEstablished}
                  </div>
                )}
              </div>
            </div>
          </td>
        );

      case 'businessType':
        return (
          <td key={column.key} className={`${getResponsiveClass('businessType')} px-4 py-4 whitespace-nowrap`}>
            <div className="text-sm text-gray-900">{vendor.businessType}</div>
          </td>
        );

      case 'location':
        return (
          <td key={column.key} className={`${getResponsiveClass('location')} px-4 py-4 whitespace-nowrap`}>
            <div className="text-sm text-gray-900">{vendor.address?.country || 'Unknown'}</div>
            {vendor.address?.state && (
              <div className="text-sm text-gray-500">{vendor.address.state}</div>
            )}
          </td>
        );

      case 'city':
        return (
          <td key={column.key} className={`${getResponsiveClass('city')} px-4 py-4 whitespace-nowrap`}>
            <div className="text-sm text-gray-900">{vendor.address?.city || '-'}</div>
          </td>
        );

      case 'phone':
        return (
          <td key={column.key} className={`${getResponsiveClass('phone')} px-4 py-4 whitespace-nowrap`}>
            <div className="text-sm text-gray-900">{vendor.contactPerson?.phone || '-'}</div>
          </td>
        );

      case 'website':
        return (
          <td key={column.key} className={`${getResponsiveClass('website')} px-4 py-4 whitespace-nowrap`}>
            {vendor.website ? (
              <a 
                href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 truncate block max-w-[120px]"
                title={vendor.website}
              >
                {vendor.website}
              </a>
            ) : (
              <span className="text-sm text-gray-500">-</span>
            )}
          </td>
        );

      case 'contact':
        return (
          <td key={column.key} className={`${getResponsiveClass('contact')} px-4 py-4 whitespace-nowrap`}>
            <div className="text-sm text-gray-900 truncate">{vendor.contactPerson?.name}</div>
            <div className="text-sm text-gray-500 truncate">{vendor.contactPerson?.email}</div>
          </td>
        );

      case 'products':
        return (
          <td key={column.key} className={`${getResponsiveClass('products')} px-4 py-4`}>
            <div className="flex flex-wrap gap-1 max-w-[160px]">
              {vendor.productCategories?.slice(0, 2).map((category, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 truncate">
                  {category}
                </span>
              ))}
              {vendor.productCategories?.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{vendor.productCategories.length - 2}
                </span>
              )}
            </div>
          </td>
        );

      case 'status':
        const isEditing = editingStatus?.vendorId === vendor._id;
        const statusOptions = [
          'New Lead',
          'Contacted', 
          'Sample Requested',
          'Under Evaluation',
          'Approved',
          'Rejected'
        ];

        return (
          <td key={column.key} className="px-4 py-4 whitespace-nowrap">
            {statusEditingEnabled && isEditing ? (
              <div className="flex items-center space-x-2">
                <select
                  value={editingStatus.status}
                  onChange={(e) => onStatusEdit(vendor._id, e.target.value)}
                  className="text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <div className="flex space-x-1">
                  <button
                    onClick={() => onStatusSave(vendor._id, editingStatus.status)}
                    className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                    title="Save"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={onStatusCancel}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                    title="Cancel"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={`group cursor-pointer ${statusEditingEnabled ? 'hover:bg-gray-50' : ''}`}
                onClick={() => statusEditingEnabled && onStatusEdit(vendor._id, vendor.sourcingStatus)}
              >
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(vendor.sourcingStatus)}`}>
                  <span className="hidden sm:inline truncate">{vendor.sourcingStatus}</span>
                  <span className="sm:hidden">
                    {vendor.sourcingStatus === 'New Lead' ? 'New' : 
                     vendor.sourcingStatus === 'Under Evaluation' ? 'Eval' :
                     vendor.sourcingStatus === 'Sample Requested' ? 'Sample' :
                     vendor.sourcingStatus === 'Contacted' ? 'Contact' :
                     vendor.sourcingStatus}
                  </span>
                  {statusEditingEnabled && (
                    <svg className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                </span>
              </div>
            )}
          </td>
        );

      case 'rating':
        return (
          <td key={column.key} className={`${getResponsiveClass('rating')} px-4 py-4 whitespace-nowrap`}>
            <div className="flex items-center space-x-1">
              {renderStars(vendor.rating)}
              {vendor.rating?.overall && (
                <span className="text-sm text-gray-500 ml-2">
                  {vendor.rating.overall.toFixed(1)}
                </span>
              )}
            </div>
          </td>
        );

      case 'serviceTypes':
        return (
          <td key={column.key} className={`${getResponsiveClass('serviceTypes')} px-4 py-4`}>
            <div className="flex flex-wrap gap-1 max-w-[160px]">
              {vendor.serviceTypes?.slice(0, 2).map((service, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 truncate">
                  {service}
                </span>
              ))}
              {vendor.serviceTypes?.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{vendor.serviceTypes.length - 2}
                </span>
              )}
            </div>
          </td>
        );

      case 'printingMethods':
        return (
          <td key={column.key} className={`${getResponsiveClass('printingMethods')} px-4 py-4`}>
            <div className="flex flex-wrap gap-1 max-w-[150px]">
              {vendor.printingMethods?.slice(0, 2).map((method, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 truncate">
                  {method}
                </span>
              ))}
              {vendor.printingMethods?.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{vendor.printingMethods.length - 2}
                </span>
              )}
            </div>
          </td>
        );

      case 'moq':
        return (
          <td key={column.key} className={`${getResponsiveClass('moq')} px-4 py-4 whitespace-nowrap`}>
            <div className="text-sm text-gray-900">
              {vendor.businessPolicies?.moq || vendor.moq || vendor.minimumOrderQuantity?.value || '-'}
            </div>
          </td>
        );

      case 'priceRange':
        return (
          <td key={column.key} className={`${getResponsiveClass('priceRange')} px-4 py-4 whitespace-nowrap`}>
            <div className="text-sm text-gray-900">
              {vendor.priceRanges?.length > 0 ? vendor.priceRanges[0] : vendor.pricing?.priceRange || vendor.priceRange || '-'}
            </div>
          </td>
        );

      case 'certifications':
        return (
          <td key={column.key} className={`${getResponsiveClass('certifications')} px-4 py-4`}>
            <div className="flex flex-wrap gap-1 max-w-[140px]">
              {vendor.certifications?.slice(0, 2).map((cert, index) => {
                if (typeof cert === 'object' && cert !== null) {
                  // Render name, issuedBy, validUntil, verified if present
                  return (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 truncate">
                      {cert.name || 'Unnamed'}
                      {cert.issuedBy ? ` (${cert.issuedBy})` : ''}
                      {cert.validUntil ? `, valid until ${cert.validUntil}` : ''}
                      {cert.verified ? ' ✔' : ''}
                    </span>
                  );
                } else {
                  return (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 truncate">
                      {cert}
                    </span>
                  );
                }
              })}
              {vendor.certifications?.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                  +{vendor.certifications.length - 2}
                </span>
              )}
            </div>
          </td>
        );

      case 'actions':
        return (
          <td key={column.key} className="px-4 py-4 whitespace-nowrap text-sm font-medium">
            <div className="flex space-x-2">
              <Link
                to={`/vendors/${vendor._id}`}
                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                title="View Details"
              >
                <EyeIcon className="h-4 w-4" />
              </Link>
              <Link
                to={`/vendors/${vendor._id}/edit`}
                className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                title="Edit Vendor"
              >
                <PencilIcon className="h-4 w-4" />
              </Link>
              <button
                onClick={() => onDelete(vendor._id)}
                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                title="Delete Vendor"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </td>
        );

      default:
        // Fallback: display raw value if present
        const value = vendor[column.key];
        let displayValue = '-';
        if (value !== undefined && value !== null) {
          if (typeof value === 'object') {
            displayValue = JSON.stringify(value);
          } else {
            displayValue = value;
          }
        }
        return <td key={column.key} className="px-4 py-4 whitespace-nowrap">{displayValue}</td>;
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {/* Responsive table container with proper overflow handling */}
      <div className="overflow-x-auto mobile-scroll-fix scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 table-container">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky-header">
              <tr>
                {orderedColumns.map(column => renderColumnHeader(column))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendors.map((vendor) => (
                <tr key={vendor._id} className="hover:bg-gray-50">
                  {orderedColumns.map(column => renderColumnCell(vendor, column))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorTable;
