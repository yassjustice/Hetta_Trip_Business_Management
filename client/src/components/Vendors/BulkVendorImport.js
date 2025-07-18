import React, { useState } from 'react';
import { vendorAPI } from '../../services/api';

const csvTemplate = `companyName,businessType,description,contactPerson.name,contactPerson.email,contactPerson.phone,address.street,address.city,address.state,address.country,website,productCategories,serviceTypes,printingMethods,moq,priceRange,certifications.name,certifications.issuedBy,certifications.validUntil,certifications.verified,status,rating,addedBy
Acme Textiles,Manufacturer,High-quality cotton fabrics,John Doe,john.doe@email.com,+1234567890,123 Main St,Textile City,Textile State,China,https://acmetextiles.com,"Cotton Fabrics;Denim","Printing;Sewing","DTG;Embroidery",1000,Mid-range,"ISO 9001","ISO Org",2026-12-31,true,Approved,4.5,USER_ID_HERE
`;


export default function BulkVendorImport({ onImport }) {
  const [csvText, setCsvText] = useState('');
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handlePasteImport = async () => {
    setImporting(true);
    setError('');
    try {
      await vendorAPI.bulkImport({ csv: csvText });
      setCsvText('');
      if (onImport) onImport();
    } catch (e) {
      setError(e.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = async (e) => {
    setImporting(true);
    setError('');
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await vendorAPI.bulkImportFile(formData);
      setFile(null);
      if (onImport) onImport();
    } catch (e) {
      setError(e.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="mb-2">
      <button
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-blue-50"
        onClick={() => setOpen(!open)}
      >
        Bulk Import Vendors
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-2">Bulk Vendor Import</h2>
            <div className="mb-4">
              <label className="block font-medium mb-1">Copy-Paste CSV Data</label>
              <textarea
                className="w-full border rounded p-2 mb-2"
                rows={6}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={csvTemplate}
              />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handlePasteImport}
                disabled={importing || !csvText.trim()}
              >
                Import from Paste
              </button>
              <button
                className="ml-2 bg-gray-200 text-gray-800 px-4 py-2 rounded"
                onClick={() => setCsvText(csvTemplate)}
              >
                Paste Example Template
              </button>
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Import from File (CSV/Excel)</label>
              <input type="file" accept=".csv,.xlsx" onChange={handleFileImport} />
            </div>
            {error && <div className="text-red-600 mt-2">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
