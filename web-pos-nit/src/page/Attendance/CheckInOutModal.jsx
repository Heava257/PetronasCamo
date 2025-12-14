// CheckInOutModal.jsx
import React from 'react';

const CheckInOutModal = ({ isOpen, onClose, onSubmit, type }) => {
  const [note, setNote] = React.useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-lg font-bold mb-4 text-gray-800">{type === 'checkin' ? 'ចូលធ្វើការ' : 'ចេញពីការងារ'}</h2>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows="3"
          placeholder="សូមបញ្ចូលកំណត់សម្គាល់..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        ></textarea>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded text-sm"
            onClick={onClose}
          >
            បិទ
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
            onClick={() => onSubmit(note)}
          >
            បញ្ជូន
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckInOutModal;
