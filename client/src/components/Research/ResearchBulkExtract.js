import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { researchAPI } from '../../services/api';
import LoadingSpinner from '../Common/LoadingSpinner';

const ResearchBulkExtract = ({ open, onClose }) => {
  const [links, setLinks] = useState('');
  const [results, setResults] = useState([]);
  const [csv, setCsv] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExtract = async () => {
    setIsLoading(true);
    setError('');
    setResults([]);
    setCsv('');
    try {
      const linkArr = links.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (linkArr.length === 0) {
        setError('Please enter at least one valid URL.');
        setIsLoading(false);
        return;
      }
      const response = await researchAPI.bulkExtract({ links: linkArr });
      setResults(response.data.vendors || []);
      setCsv(response.data.csv || '');
    } catch (e) {
      setError(e.response?.data?.message || 'Extraction failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_extracted_vendors.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Transition appear show={open} as={Fragment}>
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
                    Bulk Vendor Extraction
                  </Dialog.Title>
                  <button onClick={onClose} className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <textarea
                    rows={8}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Paste URLs here, one per line..."
                    value={links}
                    onChange={e => setLinks(e.target.value)}
                  />
                  <button
                    onClick={handleExtract}
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <LoadingSpinner /> : 'Extract Vendors'}
                  </button>
                  {error && <div className="text-red-500 text-sm">{error}</div>}
                  {results.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-2">Extracted Vendors ({results.length})</h4>
                      <div className="overflow-x-auto max-h-64 border rounded">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 border">Company Name</th>
                              <th className="px-2 py-1 border">Business Type</th>
                              <th className="px-2 py-1 border">Website</th>
                              <th className="px-2 py-1 border">Email</th>
                              <th className="px-2 py-1 border">Phone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.map((r, idx) => (
                              <tr key={r.website || idx}>
                                <td className="px-2 py-1 border">{r.companyName}</td>
                                <td className="px-2 py-1 border">{r.businessType}</td>
                                <td className="px-2 py-1 border"><a href={r.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{r.website}</a></td>
                                <td className="px-2 py-1 border">{r.email || (r.contactPerson && r.contactPerson.email)}</td>
                                <td className="px-2 py-1 border">{r.phone || (r.contactPerson && r.contactPerson.phone)}</td>
                                <td className="px-2 py-1 border text-xs">
                                  {r.error ? (
                                    <span className="text-red-500">{r.error.message || r.error}</span>
                                  ) : r.status ? (
                                    <span className="text-green-600">{r.status}</span>
                                  ) : 'OK'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {csv && (
                        <button
                          onClick={handleDownloadCsv}
                          className="mt-4 inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                          Download CSV
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ResearchBulkExtract;
