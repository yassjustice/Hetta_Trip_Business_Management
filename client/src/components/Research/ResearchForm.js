import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { Fragment } from 'react';

const ResearchForm = ({ onClose, onSubmit }) => {
  const [searchTerms, setSearchTerms] = useState(['']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [config, setConfig] = useState({
    maxResultsPerTerm: 10,
    searchEngines: ['Google', 'Bing', 'DuckDuckGo'],
    includeImages: false,
    fetchTimeout: 30000,
    respectRobotsTxt: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addSearchTerm = () => {
    if (searchTerms.length < 10) {
      setSearchTerms([...searchTerms, '']);
    }
  };

  const removeSearchTerm = (index) => {
    if (searchTerms.length > 1) {
      setSearchTerms(searchTerms.filter((_, i) => i !== index));
    }
  };

  const updateSearchTerm = (index, value) => {
    const newTerms = [...searchTerms];
    newTerms[index] = value;
    setSearchTerms(newTerms);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const filteredTerms = searchTerms.filter(term => term.trim().length > 0);
    
    if (filteredTerms.length === 0) {
      alert('Please enter at least one search term');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(filteredTerms, config);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSearchEngine = (engine) => {
    const engines = [...config.searchEngines];
    const index = engines.indexOf(engine);
    
    if (index > -1) {
      if (engines.length > 1) { // Keep at least one engine
        engines.splice(index, 1);
      }
    } else {
      engines.push(engine);
    }
    
    setConfig({ ...config, searchEngines: engines });
  };

  const predefinedTerms = [
    'custom t-shirt printing',
    'DTG printing services',
    'screen printing supplier',
    'embroidery services',
    'promotional apparel',
    'wholesale blank apparel',
    'fashion manufacturer',
    'textile supplier',
    'heat press equipment',
    'vinyl cutting services'
  ];

  return (
    <Transition appear show={true} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Start New Research Session
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Search Terms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Search Terms
                      <span className="text-gray-500 font-normal ml-2">
                        (Add keywords, competitor names, or service types)
                      </span>
                    </label>
                    
                    <div className="space-y-3">
                      {searchTerms.map((term, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={term}
                              onChange={(e) => updateSearchTerm(index, e.target.value)}
                              placeholder={`Search term ${index + 1}...`}
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              required={index === 0}
                            />
                          </div>
                          {searchTerms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSearchTerm(index)}
                              className="inline-flex items-center p-2 border border-transparent rounded-md text-red-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {searchTerms.length < 10 && (
                      <button
                        type="button"
                        onClick={addSearchTerm}
                        className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Search Term
                      </button>
                    )}
                  </div>

                  {/* Predefined Terms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Quick Add (Click to add to search terms)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {predefinedTerms.map((term, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            const emptyIndex = searchTerms.findIndex(t => t.trim() === '');
                            if (emptyIndex > -1) {
                              updateSearchTerm(emptyIndex, term);
                            } else if (searchTerms.length < 10) {
                              setSearchTerms([...searchTerms, term]);
                            }
                          }}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Configuration */}
                  <div className="border-t pt-6">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      <CogIcon className="h-4 w-4 mr-2" />
                      Advanced Settings
                      <span className="ml-2 text-gray-500">
                        {showAdvanced ? '(Hide)' : '(Show)'}
                      </span>
                    </button>

                    {showAdvanced && (
                      <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                        {/* Max Results */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Max Results Per Search Term
                          </label>
                          <select
                            value={config.maxResultsPerTerm}
                            onChange={(e) => setConfig({ ...config, maxResultsPerTerm: parseInt(e.target.value) })}
                            className="mt-1 block w-32 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                          </select>
                        </div>

                        {/* Search Engines */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Engines
                          </label>
                          <div className="space-y-2">
                            {['Google', 'Bing', 'DuckDuckGo'].map((engine) => (
                              <label key={engine} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={config.searchEngines.includes(engine)}
                                  onChange={() => toggleSearchEngine(engine)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">{engine}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Timeout */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Fetch Timeout (seconds)
                          </label>
                          <select
                            value={config.fetchTimeout / 1000}
                            onChange={(e) => setConfig({ ...config, fetchTimeout: parseInt(e.target.value) * 1000 })}
                            className="mt-1 block w-32 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value={15}>15</option>
                            <option value={30}>30</option>
                            <option value={60}>60</option>
                          </select>
                        </div>

                        {/* Other Options */}
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={config.respectRobotsTxt}
                              onChange={(e) => setConfig({ ...config, respectRobotsTxt: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Respect robots.txt</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || searchTerms.filter(t => t.trim()).length === 0}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Starting Research...
                        </>
                      ) : (
                        <>
                          <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                          Start Research
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ResearchForm;
