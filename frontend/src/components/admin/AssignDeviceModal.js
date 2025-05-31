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
      // Verwende die spezielle Route für verfügbare Geräte
      const response = await axios.get('/api/admin/available-devices');
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
      await axios.post('/api/admin/assign-device', {
        deviceId: selectedDevice,
        resellerId: selectedReseller,
        minimumPrice: parseFloat(minimumPrice)
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Gerät einem Reseller zuweisen
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Info-Box über Gewinn-System */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">💰 Gewinn-System</h4>
            <p className="text-blue-800 text-sm">
              <strong>Mindestverkaufspreis:</strong> Ist der Gewinn für Repairhub<br />
              <strong>Alles darüber:</strong> Ist der Gewinn für den Reseller<br />
              <em>Beispiel: Mindestpreis 300€, Verkauf für 350€ → Repairhub: 300€, Reseller: 50€</em>
            </p>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {loadingDevices ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Lade verfügbare Geräte...</p>
            </div>
          ) : availableDevices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">Keine verfügbaren Geräte zum Zuweisen</p>
              <p className="text-gray-400 text-sm mt-2">
                Stellen Sie sicher, dass Geräte den Status 'verkaufsbereit' oder 'in_reparatur' haben
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gerät auswählen *
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Gerät auswählen --</option>
                  {availableDevices.map(device => (
                    <option key={device._id} value={device._id}>
                      {device.model} - IMEI: {device.imei} ({device.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedDeviceData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Gerätedetails:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {selectedDeviceData.thumbnail && (
                        <img 
                          src={selectedDeviceData.thumbnail} 
                          alt={selectedDeviceData.model}
                          className="w-20 h-20 object-contain mb-3"
                        />
                      )}
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Modell:</span> {selectedDeviceData.modelDesc || selectedDeviceData.model}</p>
                        <p><span className="font-medium">IMEI:</span> {selectedDeviceData.imei}</p>
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
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Einkaufspreis:</span> {selectedDeviceData.purchasePrice}€</p>
                      <p><span className="font-medium">Reparaturkosten:</span> {
                        selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0
                      }€</p>
                      <p><span className="font-medium">Gesamtkosten:</span> {
                        (selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0)).toFixed(2)
                      }€</p>
                      <p><span className="font-medium">Kalkulierter Verkaufspreis:</span> {selectedDeviceData.sellingPrice || 0}€</p>
                      {selectedDeviceData.damageDescription && (
                        <p><span className="font-medium">Schäden:</span> {selectedDeviceData.damageDescription}</p>
                      )}
                    </div>
                  </div>

                  {selectedDeviceData.parts && selectedDeviceData.parts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="font-medium text-gray-900 mb-2">Verwendete Ersatzteile:</h5>
                      <div className="space-y-1">
                        {selectedDeviceData.parts.map((part, index) => (
                          <p key={index} className="text-sm text-gray-600">
                            • {part.partNumber} - {part.price}€
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reseller auswählen *
                </label>
                <select
                  value={selectedReseller}
                  onChange={(e) => setSelectedReseller(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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

              {selectedResellerData && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Ausgewählter Reseller:</h5>
                  <div className="text-sm text-blue-800">
                    <p><strong>Name:</strong> {selectedResellerData.name}</p>
                    <p><strong>E-Mail:</strong> {selectedResellerData.email}</p>
                    {selectedResellerData.company && (
                      <p><strong>Firma:</strong> {selectedResellerData.company}</p>
                    )}
                    {selectedResellerData.phone && (
                      <p><strong>Telefon:</strong> {selectedResellerData.phone}</p>
                    )}
                  </div>
                </div>
              )}

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="mt-2 text-xs text-gray-500">
                  <p><strong>Dieser Betrag geht an Repairhub.</strong> Alles darüber ist der Gewinn für den Reseller.</p>
                  {selectedDeviceData && (
                    <div className="mt-2 p-2 bg-gray-100 rounded">
                      <p><strong>Kostenaufstellung:</strong></p>
                      <p>• Einkauf: {selectedDeviceData.purchasePrice}€</p>
                      <p>• Reparatur: {(selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0)}€</p>
                      <p>• <strong>Gesamtkosten: {(selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0)).toFixed(2)}€</strong></p>
                      {minimumPrice && (
                        <p className="mt-1 font-medium text-green-600">
                          • Repairhub-Gewinn: {(parseFloat(minimumPrice) - (selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0))).toFixed(2)}€
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Zusammenfassung */}
              {selectedDeviceData && selectedResellerData && minimumPrice && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">📋 Zuweisungs-Zusammenfassung</h4>
                  <div className="text-sm text-green-800 space-y-1">
                    <p><strong>Gerät:</strong> {selectedDeviceData.model} (IMEI: {selectedDeviceData.imei})</p>
                    <p><strong>Reseller:</strong> {selectedResellerData.name} (@{selectedResellerData.username})</p>
                    <p><strong>Mindestverkaufspreis:</strong> {minimumPrice}€</p>
                    <p><strong>Gerätekosten:</strong> {(selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0)).toFixed(2)}€</p>
                    <p><strong>Repairhub-Gewinn:</strong> {(parseFloat(minimumPrice) - (selectedDeviceData.purchasePrice + (selectedDeviceData.parts?.reduce((sum, part) => sum + part.price, 0) || 0))).toFixed(2)}€</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedDevice || !selectedReseller || !minimumPrice}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Zuweisen...
                    </>
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
  );
};

export default AssignDeviceModal;