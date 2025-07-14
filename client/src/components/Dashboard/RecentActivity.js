import React from 'react';
import { Link } from 'react-router-dom';

const RecentActivity = ({ items, type }) => {
  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No recent {type}s found
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      'New Lead': 'bg-blue-100 text-blue-800',
      'Contacted': 'bg-yellow-100 text-yellow-800',
      'Sample Requested': 'bg-purple-100 text-purple-800',
      'Under Evaluation': 'bg-orange-100 text-orange-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Planning': 'bg-gray-100 text-gray-800',
      'Sourcing': 'bg-blue-100 text-blue-800',
      'Sampling': 'bg-yellow-100 text-yellow-800',
      'Production': 'bg-purple-100 text-purple-800',
      'Delivery': 'bg-orange-100 text-orange-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      if (diffInHours === 0) {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
      }
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="divide-y divide-gray-200">
      {items.map((item, index) => (
        <div key={index} className="p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Link
                to={`/${type}s/${item._id}`}
                className="text-sm font-medium text-gray-900 hover:text-indigo-600"
              >
                {type === 'vendor' ? item.companyName : item.name}
              </Link>
              <div className="mt-1 flex items-center space-x-2">
                {item.sourcingStatus && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.sourcingStatus)}`}>
                    {item.sourcingStatus}
                  </span>
                )}
                {item.status && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                )}
                {item.priority && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.priority)}`}>
                    {item.priority}
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {formatTimeAgo(item.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;
