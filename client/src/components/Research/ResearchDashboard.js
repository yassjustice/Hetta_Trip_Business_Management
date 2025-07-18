import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlassIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { researchAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../Common/LoadingSpinner';
import ResearchForm from './ResearchForm';
import ResearchSessionCard from './ResearchSessionCard';
import ResearchResults from './ResearchResults';
import ResearchBulkExtract from './ResearchBulkExtract';

const ResearchDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewResearch, setShowNewResearch] = useState(false);
  const [showBulkExtract, setShowBulkExtract] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, session, results
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadResearchSessions();
  }, [statusFilter]);

  const loadResearchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const response = await researchAPI.getAllSessions(params);
      setSessions(response.data.research);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading research sessions:', error);
      toast.error('Failed to load research sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartResearch = async (searchTerms, config) => {
    try {
      const response = await researchAPI.createSession({
        searchTerms,
        config
      });
      
      toast.success('Research session started successfully');
      setShowNewResearch(false);
      loadResearchSessions();
      
      // Optionally navigate to the new session
      if (response.data.researchId) {
        handleViewSession(response.data.researchId);
      }
    } catch (error) {
      console.error('Error starting research:', error);
      toast.error('Failed to start research session');
    }
  };

  const handleViewSession = async (sessionId) => {
    try {
      const response = await researchAPI.getSession(sessionId);
      setSelectedSession(response.data);
      setViewMode('session');
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Failed to load session details');
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this research session?')) {
      return;
    }

    try {
      await researchAPI.cancelSession(sessionId);
      toast.success('Research session cancelled');
      loadResearchSessions();
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel research session');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'Processing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'Completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'Failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'Cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Processing':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (viewMode === 'session' && selectedSession) {
    return (
      <ResearchResults
        session={selectedSession}
        onBack={() => {
          setViewMode('dashboard');
          setSelectedSession(null);
        }}
        onRefresh={() => handleViewSession(selectedSession._id)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Research Center
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Discover and research textile and fashion suppliers from across the web
          </p>
        </div>
        <div className="mt-4 md:mt-0 md:ml-4 flex gap-2">
          <button
            onClick={() => setShowNewResearch(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Research
          </button>
          <button
            onClick={() => setShowBulkExtract(true)}
            className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Bulk Extract
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Searches
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {sessions.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowPathIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {sessions.filter(s => ['Pending', 'Processing'].includes(s.status)).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {sessions.filter(s => s.status === 'Completed').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentArrowDownIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Vendors Imported
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {sessions.reduce((total, s) => total + (s.summary?.importedVendors || 0), 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Sessions', count: sessions.length },
            { key: 'Pending', label: 'Pending', count: sessions.filter(s => s.status === 'Pending').length },
            { key: 'Processing', label: 'Processing', count: sessions.filter(s => s.status === 'Processing').length },
            { key: 'Completed', label: 'Completed', count: sessions.filter(s => s.status === 'Completed').length },
            { key: 'Failed', label: 'Failed', count: sessions.filter(s => s.status === 'Failed').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`${
                statusFilter === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`${
                  statusFilter === tab.key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900'
                } inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Research Sessions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading research sessions..." />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12">
          <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No research sessions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first research session.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowNewResearch(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Start Research
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {sessions.map((session) => (
            <ResearchSessionCard
              key={session._id}
              session={{
                ...session,
                onDelete: async () => {
                  try {
                    await researchAPI.deleteSession(session._id);
                    toast.success('Research session deleted');
                    loadResearchSessions();
                  } catch (error) {
                    toast.error('Failed to delete research session');
                  }
                }
              }}
              onView={() => handleViewSession(session._id)}
              onCancel={() => handleCancelSession(session.sessionId)}
              getStatusIcon={getStatusIcon}
              getStatusColor={getStatusColor}
            />
          ))}
        </div>
      )}

      {/* New Research Modal */}
      {showNewResearch && (
        <ResearchForm
          onClose={() => setShowNewResearch(false)}
          onSubmit={handleStartResearch}
        />
      )}
      {/* Bulk Extract Modal */}
      {showBulkExtract && (
        <ResearchBulkExtract
          open={showBulkExtract}
          onClose={() => setShowBulkExtract(false)}
        />
      )}
    </div>
  );
};

export default ResearchDashboard;
