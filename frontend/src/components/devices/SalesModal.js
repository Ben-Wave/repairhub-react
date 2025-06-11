import React, { useState } from 'react';

const SalesModal = ({ isOpen, onClose, onSave, desiredSellingPrice }) => {
  const [actualSellingPrice, setActualSellingPrice] = useState(desiredSellingPrice || 0);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(parseFloat(actualSellingPrice));
    onClose();
  };

  const priceDifference = parseFloat(actualSellingPrice) - (desiredSellingPrice || 0);
  const isHigherThanExpected = priceDifference > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header - Mobile optimized */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 leading-tight">
                💰 Verkaufspreis eingeben
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Geben Sie den tatsächlichen Verkaufspreis ein
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-3 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Price Input - Mobile optimized */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tatsächlicher Verkaufspreis (€) *
              </label>
              <input
                type="number"
                value={actualSellingPrice}
                onChange={(e) => setActualSellingPrice(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                min="0"
                step="0.01"
                required
                placeholder="0.00"
              />
            </div>

            {/* Price Comparison - Mobile optimized */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3 text-sm">Preisvergleich</h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kalkulierter Verkaufspreis:</span>
                  <span className="font-medium text-blue-600">
                    {(desiredSellingPrice || 0).toFixed(2)} €
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tatsächlicher Verkaufspreis:</span>
                  <span className="font-medium text-gray-900">
                    {parseFloat(actualSellingPrice || 0).toFixed(2)} €
                  </span>
                </div>
                
                {actualSellingPrice && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Differenz:</span>
                      <span className={`font-medium ${
                        isHigherThanExpected ? 'text-green-600' : priceDifference < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {isHigherThanExpected ? '+' : ''}{priceDifference.toFixed(2)} €
                        {isHigherThanExpected && (
                          <span className="ml-1 text-xs">📈</span>
                        )}
                        {priceDifference < 0 && (
                          <span className="ml-1 text-xs">📉</span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box - Mobile optimized */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-900">Information</h4>
                  <p className="text-xs sm:text-sm text-blue-800 mt-1">
                    Der tatsächliche Verkaufspreis wird verwendet, um den realen Gewinn zu berechnen 
                    und mit dem geplanten Gewinn zu vergleichen.
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Indicator - Mobile optimized */}
            {actualSellingPrice && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Verkaufsperformance</h4>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      isHigherThanExpected ? 'bg-green-100' : priceDifference < 0 ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      <span className={`text-lg ${
                        isHigherThanExpected ? 'text-green-600' : priceDifference < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {isHigherThanExpected ? '🎉' : priceDifference < 0 ? '😔' : '😐'}
                      </span>
                    </div>
                    <p className={`text-xs font-medium ${
                      isHigherThanExpected ? 'text-green-600' : priceDifference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {isHigherThanExpected ? 'Über Erwartung!' : priceDifference < 0 ? 'Unter Erwartung' : 'Wie erwartet'}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Abweichung</p>
                    <p className={`text-sm font-bold ${
                      isHigherThanExpected ? 'text-green-600' : priceDifference < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {((priceDifference / (desiredSellingPrice || 1)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action Buttons - Mobile optimized */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 order-2 sm:order-1"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={!actualSellingPrice || parseFloat(actualSellingPrice) <= 0}
                className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                Als verkauft markieren
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalesModal;