import React, { useState } from 'react';
import {
  ClockIcon,
  CalendarIcon,
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  Cog6ToothIcon,
  BellIcon,
  EnvelopeIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

const ExportScheduler = ({ 
  config = {}, 
  onConfigChange,
  className = '' 
}) => {
  const [scheduleConfig, setScheduleConfig] = useState({
    enabled: config.schedule || false,
    frequency: config.scheduleFrequency || 'once',
    time: config.scheduleTime || '09:00',
    timezone: 'local',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    emailNotifications: true,
    webhookUrl: '',
    retryAttempts: 3,
    retryDelay: 60,
    compression: false,
    ...config.scheduleConfig
  });

  const frequencies = [
    { value: 'once', label: 'One-time Export', description: 'Export immediately' },
    { value: 'daily', label: 'Daily', description: 'Export every day at specified time' },
    { value: 'weekly', label: 'Weekly', description: 'Export every week on same day' },
    { value: 'monthly', label: 'Monthly', description: 'Export every month on same date' },
    { value: 'quarterly', label: 'Quarterly', description: 'Export every 3 months' },
    { value: 'custom', label: 'Custom Interval', description: 'Define custom schedule' }
  ];

  const timezones = [
    { value: 'local', label: 'Local Time' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }
  ];

  const handleConfigChange = (updates) => {
    const newConfig = { ...scheduleConfig, ...updates };
    setScheduleConfig(newConfig);
    
    if (onConfigChange) {
      onConfigChange(prevConfig => ({
        ...prevConfig,
        schedule: newConfig.enabled,
        scheduleFrequency: newConfig.frequency,
        scheduleTime: newConfig.time,
        scheduleConfig: newConfig
      }));
    }
  };

  const getNextRunTime = () => {
    if (!scheduleConfig.enabled || scheduleConfig.frequency === 'once') {
      return 'Immediate';
    }

    const now = new Date();
    const [hours, minutes] = scheduleConfig.time.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If scheduled time has passed today, move to next occurrence
    if (scheduledTime <= now) {
      switch (scheduleConfig.frequency) {
        case 'daily':
          scheduledTime.setDate(scheduledTime.getDate() + 1);
          break;
        case 'weekly':
          scheduledTime.setDate(scheduledTime.getDate() + 7);
          break;
        case 'monthly':
          scheduledTime.setMonth(scheduledTime.getMonth() + 1);
          break;
        case 'quarterly':
          scheduledTime.setMonth(scheduledTime.getMonth() + 3);
          break;
        default:
          return 'Custom schedule';
      }
    }

    return scheduledTime.toLocaleString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Export Scheduling</h3>
        <p className="text-sm text-gray-500">
          Automate your exports with scheduled runs and notifications
        </p>
      </div>

      {/* Enable/Disable Scheduling */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={scheduleConfig.enabled}
            onChange={(e) => handleConfigChange({ enabled: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <div className="ml-3">
            <span className="text-sm font-medium text-gray-900">Enable Scheduled Exports</span>
            <p className="text-xs text-gray-600">
              Automatically export data based on your schedule
            </p>
          </div>
        </label>
      </div>

      {scheduleConfig.enabled && (
        <>
          {/* Frequency Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-900">
              Export Frequency
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {frequencies.map(freq => (
                <label
                  key={freq.value}
                  className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                    scheduleConfig.frequency === freq.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    value={freq.value}
                    checked={scheduleConfig.frequency === freq.value}
                    onChange={(e) => handleConfigChange({ frequency: e.target.value })}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">
                        {freq.label}
                      </span>
                      <span className="block text-sm text-gray-500">
                        {freq.description}
                      </span>
                    </div>
                  </div>
                  {scheduleConfig.frequency === freq.value && (
                    <div className="absolute -inset-px rounded-lg border-2 border-blue-500 pointer-events-none" />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Schedule Details */}
          {scheduleConfig.frequency !== 'once' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Execution Time
                </label>
                <input
                  type="time"
                  value={scheduleConfig.time}
                  onChange={(e) => handleConfigChange({ time: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={scheduleConfig.timezone}
                  onChange={(e) => handleConfigChange({ timezone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={scheduleConfig.startDate}
                  onChange={(e) => handleConfigChange({ startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Advanced Scheduling Options */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900">Advanced Options</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={scheduleConfig.endDate}
                  onChange={(e) => handleConfigChange({ endDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for indefinite scheduling
                </p>
              </div>

              {/* Retry Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retry Attempts
                </label>
                <select
                  value={scheduleConfig.retryAttempts}
                  onChange={(e) => handleConfigChange({ retryAttempts: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>No retries</option>
                  <option value={1}>1 retry</option>
                  <option value={3}>3 retries</option>
                  <option value={5}>5 retries</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <BellIcon className="h-5 w-5 mr-2 text-gray-600" />
              Notifications
            </h4>
            
            <div className="space-y-3">
              {/* Email Notifications */}
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={scheduleConfig.emailNotifications}
                  onChange={(e) => handleConfigChange({ emailNotifications: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mt-1"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Email Notifications</span>
                  <p className="text-xs text-gray-600">
                    Send email when export completes or fails
                  </p>
                </div>
              </label>

              {/* Webhook URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Webhook URL (Optional)
                </label>
                <div className="flex">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mt-2 mr-2" />
                  <input
                    type="url"
                    value={scheduleConfig.webhookUrl}
                    onChange={(e) => handleConfigChange({ webhookUrl: e.target.value })}
                    placeholder="https://your-app.com/webhook"
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  POST request will be sent with export status
                </p>
              </div>
            </div>
          </div>

          {/* Performance Options */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 flex items-center">
              <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-600" />
              Performance Options
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={scheduleConfig.compression}
                  onChange={(e) => handleConfigChange({ compression: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mt-1"
                />
                <div className="ml-3">
                  <span className="text-sm font-medium text-gray-900">Enable Compression</span>
                  <p className="text-xs text-gray-600">
                    Compress exported files to reduce size (recommended for large datasets)
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Retry Delay (minutes)
                </label>
                <select
                  value={scheduleConfig.retryDelay}
                  onChange={(e) => handleConfigChange({ retryDelay: parseInt(e.target.value) })}
                  className="w-full max-w-xs border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Schedule Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-md font-medium text-blue-900 mb-3 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Schedule Summary
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Frequency:</span>
                <span className="ml-2 text-blue-700">
                  {frequencies.find(f => f.value === scheduleConfig.frequency)?.label}
                </span>
              </div>
              
              {scheduleConfig.frequency !== 'once' && (
                <>
                  <div>
                    <span className="font-medium text-blue-800">Next Run:</span>
                    <span className="ml-2 text-blue-700">{getNextRunTime()}</span>
                  </div>
                  
                  <div>
                    <span className="font-medium text-blue-800">Timezone:</span>
                    <span className="ml-2 text-blue-700">
                      {timezones.find(tz => tz.value === scheduleConfig.timezone)?.label}
                    </span>
                  </div>
                  
                  {scheduleConfig.endDate && (
                    <div>
                      <span className="font-medium text-blue-800">End Date:</span>
                      <span className="ml-2 text-blue-700">
                        {new Date(scheduleConfig.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              <div>
                <span className="font-medium text-blue-800">Notifications:</span>
                <span className="ml-2 text-blue-700">
                  {scheduleConfig.emailNotifications ? 'Email enabled' : 'Email disabled'}
                  {scheduleConfig.webhookUrl && ', Webhook configured'}
                </span>
              </div>
              
              <div>
                <span className="font-medium text-blue-800">Retry Policy:</span>
                <span className="ml-2 text-blue-700">
                  {scheduleConfig.retryAttempts} attempts, {scheduleConfig.retryDelay}min delay
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Actions */}
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Schedule Status</h4>
              <p className="text-xs text-gray-600">
                {scheduleConfig.frequency === 'once' 
                  ? 'Ready for immediate export'
                  : 'Schedule will be activated after export configuration is saved'
                }
              </p>
            </div>
            
            <div className="flex space-x-2">
              {scheduleConfig.frequency !== 'once' && (
                <>
                  <button className="inline-flex items-center px-3 py-1 border border-green-300 shadow-sm text-xs font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100">
                    <PlayIcon className="h-3 w-3 mr-1" />
                    Activate
                  </button>
                  <button className="inline-flex items-center px-3 py-1 border border-yellow-300 shadow-sm text-xs font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100">
                    <PauseIcon className="h-3 w-3 mr-1" />
                    Pause
                  </button>
                  <button className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100">
                    <StopIcon className="h-3 w-3 mr-1" />
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Disabled State Info */}
      {!scheduleConfig.enabled && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Scheduling Disabled
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Enable scheduling to automate your exports with custom frequencies and notifications
          </p>
          <button
            onClick={() => handleConfigChange({ enabled: true })}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            Enable Scheduling
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportScheduler;
