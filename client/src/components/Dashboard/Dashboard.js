import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  FolderIcon,
  ChartBarIcon,
  UserGroupIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { vendorAPI, projectAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';

const Dashboard = () => {
  const [stats, setStats] = useState({
    vendors: null,
    projects: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [vendorStats, projectStats] = await Promise.all([
        vendorAPI.getStats(),
        projectAPI.getStats()
      ]);

      setStats({
        vendors: vendorStats.data,
        projects: projectStats.data
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  const quickActions = [
    {
      name: 'Add New Vendor',
      href: '/vendors/new',
      icon: BuildingOfficeIcon,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Create Project',
      href: '/projects/new',
      icon: FolderIcon,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'Compare Quotes',
      href: '/quotes/compare',
      icon: ChartBarIcon,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to your Trip-Tex dashboard. Here's an overview of your textile production ecosystem.
          </p>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Vendors"
          value={stats.vendors?.total || 0}
          icon={BuildingOfficeIcon}
          color="blue"
          link="/vendors"
          change="+12%"
          changeType="increase"
        />
        <StatsCard
          title="Active Projects"
          value={stats.projects?.active || 0}
          icon={FolderIcon}
          color="green"
          link="/projects"
          change="+3%"
          changeType="increase"
        />
        <StatsCard
          title="Pending Quotes"
          value={stats.projects?.pendingQuotes || 0}
          icon={ChartBarIcon}
          color="yellow"
          link="/quotes/compare"
          change="-2%"
          changeType="decrease"
        />
        <StatsCard
          title="Total Projects"
          value={stats.projects?.total || 0}
          icon={UserGroupIcon}
          color="purple"
          link="/projects"
          change="+8%"
          changeType="increase"
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className={`${action.color} text-white rounded-lg p-4 hover:shadow-lg transition-all duration-200 transform hover:scale-105`}
            >
              <div className="flex items-center">
                <action.icon className="h-6 w-6 mr-3" />
                <span className="font-medium">{action.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Vendor Analytics */}
      {stats.vendors && (
        <div className="mt-8">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Vendor Analytics
          </h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Business Type Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">By Business Type</h4>
              <div className="space-y-3">
                {stats.vendors.byBusinessType?.map((item) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item._id}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Country Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">Top Countries</h4>
              <div className="space-y-3">
                {stats.vendors.byCountry?.slice(0, 5).map((item) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item._id || 'Unknown'}</span>
                    <span className="text-sm font-medium text-gray-900">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">By Status</h4>
              <div className="space-y-3">
                {stats.vendors.bySourceStatus?.map((item) => (
                  <div key={item._id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item._id}</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">{item.count}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        item._id === 'Approved' ? 'bg-green-400' :
                        item._id === 'Under Evaluation' ? 'bg-yellow-400' :
                        item._id === 'Rejected' ? 'bg-red-400' : 'bg-blue-400'
                      }`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Vendors
          </h3>
          <div className="bg-white shadow rounded-lg">
            <RecentActivity 
              items={stats.vendors?.recentlyAdded || []}
              type="vendor"
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Projects
          </h3>
          <div className="bg-white shadow rounded-lg">
            <RecentActivity 
              items={stats.projects?.recentProjects || []}
              type="project"
            />
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Performance Insights
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-green-800">Approved Vendors</p>
                <p className="text-xs text-green-600">Ready for production</p>
              </div>
              <span className="text-lg font-bold text-green-800">
                {stats.vendors?.bySourceStatus?.find(s => s._id === 'Approved')?.count || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-yellow-800">Under Evaluation</p>
                <p className="text-xs text-yellow-600">In review process</p>
              </div>
              <span className="text-lg font-bold text-yellow-800">
                {stats.vendors?.bySourceStatus?.find(s => s._id === 'Under Evaluation')?.count || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md">
              <div>
                <p className="text-sm font-medium text-blue-800">New Leads</p>
                <p className="text-xs text-blue-600">Potential vendors</p>
              </div>
              <span className="text-lg font-bold text-blue-800">
                {stats.vendors?.bySourceStatus?.find(s => s._id === 'New Lead')?.count || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Vendors</span>
              <span className="text-lg font-semibold text-gray-900">{stats.vendors?.total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Projects</span>
              <span className="text-lg font-semibold text-gray-900">{stats.projects?.active || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Countries Covered</span>
              <span className="text-lg font-semibold text-gray-900">{stats.vendors?.byCountry?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Business Types</span>
              <span className="text-lg font-semibold text-gray-900">{stats.vendors?.byBusinessType?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
