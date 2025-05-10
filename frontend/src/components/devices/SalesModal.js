import React, { useState } from 'react';

const SalesModal = ({ isOpen, onClose, onSave, desiredSellingPrice }) => {
  const [actualSellingPrice, setActualSellingPrice] = useState(desiredSellingPrice || 0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(parseFloat(actualSellingPrice));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h3 className="text-xl font-semibold mb-4">Verkaufspreis eingeben</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Tatsächlicher Verkaufspreis (€)
            </label>
            <input
              type="number"
              value={actualSellingPrice}
              onChange={(e) => setActualSellingPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="mb-4">
            <p className="text-gray-700">
              <span className="font-medium">Kalkulierter Verkaufspreis:</span> {desiredSellingPrice?.toFixed(2) || '0.00'} €
            </p>
            <p className="text-gray-700 text-sm italic">
              Der tatsächliche Verkaufspreis wird verwendet, um den realen Gewinn zu berechnen und mit dem gewünschten Gewinn zu vergleichen.
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesModal;