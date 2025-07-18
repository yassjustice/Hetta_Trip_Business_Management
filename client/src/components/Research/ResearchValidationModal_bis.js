import React from 'react';

// Placeholder fallback for missing modal implementation
const ResearchValidationModal = ({ result, onClose, onSave }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">Validation Modal</h2>
        <pre className="bg-gray-100 p-2 rounded text-xs mb-4 max-h-48 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Close</button>
          <button onClick={() => onSave(result?._id, true, {})} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Validate</button>
        </div>
      </div>
    </div>
  );
};

export default ResearchValidationModal;
