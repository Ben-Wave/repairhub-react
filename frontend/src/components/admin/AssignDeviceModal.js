// frontend/src/components/admin/AssignDeviceModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignDeviceModal = ({ onClose, onDeviceAssigned, resellers }) => {
  const [availableDevices, setAvailableDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedReseller, setSelectedReseller] = useState('');
  const [minimumPrice, setMinimumPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableDevices();
  }, []);

  const fetchAvailableDevices = async () => {
  try {
    const token = localStorage.getItem('adminToken');
    const response = await axios.get('/api/admin/available-devices', {
      headers: { Authorization: `Bearer ${token}` }
    });
      setAvailableDevices(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Geräte:', error);
      setError('Fehler beim Laden der verfügbaren Geräte');
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedDevice || !selectedReseller || !minimumPrice) {
      setError('Bitte füllen Sie alle Felder aus');
      setLoading(false);
      return;
    }

    if (parseFloat(minimumPrice) <= 0) {
      setError('Mindestpreis muss größer als 0 sein');
      setLoading(false);
      return;
    }

  try {
    const token = localStorage.getItem('adminToken');
    await axios.post('/api/admin/assign-device', {
      deviceId: selectedDevice,
      resellerId: selectedReseller,
      minimumPrice: parseFloat(minimumPrice)
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
      onDeviceAssigned();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Zuweisen des Geräts');
    } finally {
      setLoading(false);
    }
  };

  const selectedDeviceData = availableDevices.find(d => d._id === selectedDevice);
  const selectedResellerData = resellers.find(r => r._id === selectedReseller);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Header - Mobile optimized */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 leading-tight">
                  Gerät einem Reseller zuweisen
                </h3>
              </div>
              <button
                onClick={onClose}
                className="ml-3 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Info Panel - Mobile optimized */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">💰 Gewinn-System</h4>
              <p className="text-blue-800 text-xs sm:text-sm">
                <strong>Mindestverkaufspreis:</strong> Ist der Gewinn für Repairhub<br />
                <strong>Alles darüber:</strong> Ist der Gewinn für den Reseller<br />
                <em>Beispiel: Mindestpreis 300€, Verkauf für 350€ → Repairhub: 300€, Reseller: 50€</em>
              </p>
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {/* Loading State */}
            {loadingDevices ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="mt-2 text-gray-600 text-sm">Lade verfügbare Geräte...</p>
              </div>
            ) : availableDevices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-base sm:text-lg">Keine verfügbaren Geräte zum Zuweisen</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                  Stellen Sie sicher, dass Geräte den Status 'verkaufsbereit' oder 'in_reparatur' haben
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Device Selection - Mobile optimized */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gerät auswählen *
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => setSelectedDevice(e.target.value)}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="">-- Gerät auswählen --</option>
                    {availableDevices.map(device => (
                      <option key={device._id} value={device._id}>
                        {device.model} - IMEI: {device.imei} ({device.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Device Details - Mobile optimized */}
                {selectedDeviceData && (
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Gerätedetails:</h4>
                    <div className="space-y-4">
                      {/* Device Image and Basic Info */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        {selectedDeviceData.thumbnail && (
                          <div className="flex-shrink-0 self-center sm:self-start">
                            <img 
                              src={selectedDeviceData.thumbnail} 
                              alt={selectedDeviceData.model}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <p><span className="font-medium">Modell:</span> {selectedDeviceData.modelDesc || selectedDeviceData.model}</p>
                              <p><span className="font-medium">IMEI:</span> <span className="break-all">{selectedDeviceData.imei}</span></p>
                            </div>
                            <div>
                              <p><span className="font-medium">Status:</span> 
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                  selectedDeviceData.status === 'verkaufsbereit' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {selectedDeviceData.status}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Financial Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Einkaufspreis:</span> {selectedDeviceData.purchasePrice}€</p>
                          <p><span className="font-medium">Reparaturkosten:</span> {
                            selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0
                          }€</p>
                          <p className="font-medium text-gray-900">
                            <span>Gesamtkosten:</span> {
                              (selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0)).toFixed(2)
                            }€
                          </p>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">Kalkulierter Verkaufspreis:</span> {selectedDeviceData.sellingPrice || 0}€</p>
                          {selectedDeviceData.damageDescription && (
                            <div>
                              <p className="font-medium">Schäden:</p>
                              <p className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border">
                                {selectedDeviceData.damageDescription}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Parts List - Mobile optimized */}
                      {selectedDeviceData.parts && selectedDeviceData.parts.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <h5 className="font-medium text-gray-900 mb-2 text-sm">Verwendete Ersatzteile:</h5>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {selectedDeviceData.parts.map((part, index) => (
                              <div key={index} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                <span className="flex-1 min-w-0 truncate">{part.partNumber}</span>
                                <span className="font-medium ml-2">{part.price}€</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reseller Selection - Mobile optimized */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reseller auswählen *
                  </label>
                  <select
                    value={selectedReseller}
                    onChange={(e) => setSelectedReseller(e.target.value)}
                    required
                    className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  >
                    <option value="">-- Reseller auswählen --</option>
                    {resellers.filter(r => r.isActive).map(reseller => (
                      <option key={reseller._id} value={reseller._id}>
                        {reseller.name} (@{reseller.username})
                        {reseller.company && ` - ${reseller.company}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Reseller Info - Mobile optimized */}
                {selectedResellerData && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2 text-sm">Ausgewählter Reseller:</h5>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Name:</strong> {selectedResellerData.name}</p>
                      <p><strong>E-Mail:</strong> <span className="break-all">{selectedResellerData.email}</span></p>
                      {selectedResellerData.company && (
                        <p><strong>Firma:</strong> {selectedResellerData.company}</p>
                      )}
                      {selectedResellerData.phone && (
                        <p><strong>Telefon:</strong> {selectedResellerData.phone}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Minimum Price - Mobile optimized */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mindestverkaufspreis (€) * - Repairhub-Gewinn
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={minimumPrice}
                    onChange={(e) => setMinimumPrice(e.target.value)}
                    required
                    placeholder={selectedDeviceData ? `Empfohlen: ${selectedDeviceData.sellingPrice || 0}€` : 'z.B. 350.00'}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                  
                  {/* Cost Breakdown - Mobile optimized */}
                  <div className="mt-2 text-xs text-gray-500">
                    <p><strong>Dieser Betrag geht an Repairhub.</strong> Alles darüber ist der Gewinn für den Reseller.</p>
                    {selectedDeviceData && (
                      <div className="mt-2 p-3 bg-gray-100 rounded text-xs">
                        <p className="font-medium mb-1">Kostenaufstellung:</p>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Einkauf:</span>
                            <span>{selectedDeviceData.purchasePrice}€</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Reparatur:</span>
                            <span>{(selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0)}€</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>Gesamtkosten:</span>
                            <span>{(selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0)).toFixed(2)}€</span>
                          </div>
                          {minimumPrice && (
                            <div className="flex justify-between font-medium text-green-600 border-t pt-1">
                              <span>Repairhub-Gewinn:</span>
                              <span>{(parseFloat(minimumPrice) - (selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0))).toFixed(2)}€</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assignment Summary - Mobile optimized */}
                {selectedDeviceData && selectedResellerData && minimumPrice && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-medium text-green-900 mb-2 text-sm sm:text-base">📋 Zuweisungs-Zusammenfassung</h4>
                    <div className="text-sm text-green-800 space-y-1">
                      <p><strong>Gerät:</strong> {selectedDeviceData.model}</p>
                      <p><strong>IMEI:</strong> <span className="break-all">{selectedDeviceData.imei}</span></p>
                      <p><strong>Reseller:</strong> {selectedResellerData.name} (@{selectedResellerData.username})</p>
                      <p><strong>Mindestverkaufspreis:</strong> {minimumPrice}€</p>
                      <p><strong>Gerätekosten:</strong> {(selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0)).toFixed(2)}€</p>
                      <p><strong>Repairhub-Gewinn:</strong> {(parseFloat(minimumPrice) - (selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0))).toFixed(2)}€</p>
                    </div>
                  </div>
                )}

                {/* Buttons - Mobile optimized */}
                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 order-2 sm:order-1"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedDevice || !selectedReseller || !minimumPrice}
                    className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Zuweisen...
                      </div>
                    ) : (
                      'Gerät zuweisen'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignDeviceModal;