// frontend/src/components/reseller/DeviceCard.js
import React, { useState } from 'react';
import axios from 'axios';

const DeviceCard = ({ deviceData, onUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  const [confirmingSale, setConfirmingSale] = useState(false);
  const [reversingDialog, setReversingDialog] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [reverseReason, setReverseReason] = useState('');
  const [loading, setLoading] = useState(false);

  const { device, status, minimumPrice, assignmentId, totalPartsCost, repairDetails } = deviceData;

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'received': return 'bg-blue-100 text-blue-800';
      case 'sold': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'assigned': return 'Zugewiesen';
      case 'received': return 'Erhalten';
      case 'sold': return 'Verkauft';
      default: return status;
    }
  };

  const getCategoryColor = (category) => {
    switch (category?.toLowerCase()) {
      case 'display': return 'bg-blue-100 text-blue-800';
      case 'akku': 
      case 'battery': return 'bg-green-100 text-green-800';
      case 'kamera': 
      case 'camera': return 'bg-purple-100 text-purple-800';
      case 'gehäuse': 
      case 'housing': return 'bg-gray-100 text-gray-800';
      case 'platine': 
      case 'board': return 'bg-red-100 text-red-800';
      case 'lautsprecher': 
      case 'speaker': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-indigo-100 text-indigo-800';
    }
  };

  const confirmReceipt = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('resellerToken');
      await axios.patch(`/api/reseller/devices/${assignmentId}/confirm-receipt`, 
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmingReceipt(false);
      setNotes('');
      onUpdate();
    } catch (error) {
      alert('Fehler beim Bestätigen des Erhalts');
    } finally {
      setLoading(false);
    }
  };

  const confirmSale = async () => {
    if (!salePrice || parseFloat(salePrice) < minimumPrice) {
      alert(`Verkaufspreis muss mindestens ${minimumPrice}€ betragen`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('resellerToken');
      await axios.patch(`/api/reseller/devices/${assignmentId}/confirm-sale`, 
        { 
          actualSalePrice: parseFloat(salePrice),
          notes 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConfirmingSale(false);
      setSalePrice('');
      setNotes('');
      onUpdate();
    } catch (error) {
      alert('Fehler beim Bestätigen des Verkaufs');
    } finally {
      setLoading(false);
    }
  };

  const reverseSale = async () => {
    if (!reverseReason || reverseReason.trim().length < 10) {
      alert('Bitte geben Sie einen ausführlichen Grund ein (mindestens 10 Zeichen)');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('resellerToken');
      await axios.patch(`/api/reseller/devices/${assignmentId}/reverse-sale`, 
        { reason: reverseReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReversingDialog(false);
      setReverseReason('');
      onUpdate();
      alert('Verkauf wurde erfolgreich zurückgenommen');
    } catch (error) {
      alert('Fehler beim Zurücknehmen des Verkaufs: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-4 sm:p-5">
        {/* Device Image - Mobile optimized */}
        {device.thumbnail && (
          <div className="w-full flex justify-center mb-4">
            <img 
              src={device.thumbnail} 
              alt={device.model}
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain"
            />
          </div>
        )}

        {/* Status and Details Toggle - Mobile optimized */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
          >
            {showDetails ? 'Weniger anzeigen' : 'Details anzeigen'}
          </button>
        </div>

        {/* Basic Info - Mobile optimized */}
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 leading-tight">
          {device.model}
        </h3>
        <div className="space-y-1 mb-4 text-sm text-gray-600">
          <p className="break-all">IMEI: {device.imei}</p>
          {device.modelDesc && (
            <p className="text-xs sm:text-sm">{device.modelDesc}</p>
          )}
        </div>

        {/* Price Info - Mobile optimized */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
            <p className="text-sm font-medium text-gray-900">
              Mindestpreis: <span className="text-green-600">{minimumPrice}€</span>
            </p>
            {deviceData.actualSalePrice && (
              <p className="text-sm text-gray-600">
                Verkauft für: <span className="text-green-600 font-medium">{deviceData.actualSalePrice}€</span>
              </p>
            )}
          </div>
          {deviceData.actualSalePrice && minimumPrice && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-green-700">
                <strong>Ihr Gewinn: {(deviceData.actualSalePrice - minimumPrice).toFixed(2)}€</strong>
              </p>
            </div>
          )}
        </div>

        {/* Expanded Details - Mobile optimized */}
        {showDetails && (
          <div className="border-t border-gray-200 pt-4 mb-4 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Schäden & Reparaturen:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {device.damageDescription || 'Keine Beschreibung verfügbar'}
              </p>
            </div>
            
            {repairDetails && repairDetails.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3 text-sm">Verwendete Ersatzteile:</h5>
                <div className="space-y-3">
                  {repairDetails.map((part, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm break-all">
                              {part.partNumber}
                            </span>
                            {part.category && part.category !== 'Unbekannt' && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(part.category)}`}>
                                {part.category}
                              </span>
                            )}
                          </div>
                          {part.description && part.description !== 'Unbekannt' && (
                            <p className="text-sm text-gray-600 mb-1">
                              {part.description}
                            </p>
                          )}
                          {part.forModel && part.forModel !== 'Unbekannt' && (
                            <p className="text-xs text-gray-500">
                              Für: {part.forModel}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-green-600 text-sm">
                            {part.price}€
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 p-2 rounded">
                  <p className="text-sm font-medium text-gray-900 flex justify-between">
                    <span>Gesamte Reparaturkosten:</span>
                    <span className="text-green-600">{totalPartsCost}€</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons - Mobile optimized */}
        <div className="space-y-3">
          {status === 'assigned' && !confirmingReceipt && (
            <button
              onClick={() => setConfirmingReceipt(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              Erhalt bestätigen
            </button>
          )}

          {status === 'received' && !confirmingSale && (
            <button
              onClick={() => setConfirmingSale(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              Verkauf melden
            </button>
          )}

          {status === 'sold' && (
            <div className="space-y-3">
              <div className="text-center text-green-600 font-medium py-2 bg-green-50 rounded-lg">
                ✓ Verkauft für {deviceData.actualSalePrice}€
                {deviceData.actualSalePrice > minimumPrice && (
                  <div className="text-sm text-green-700 mt-1">
                    Ihr Gewinn: {(deviceData.actualSalePrice - minimumPrice).toFixed(2)}€
                  </div>
                )}
              </div>
              <button
                onClick={() => setReversingDialog(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200"
              >
                Verkauf zurücknehmen
              </button>
            </div>
          )}
        </div>

        {/* Receipt Confirmation Form - Mobile optimized */}
        {confirmingReceipt && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">Erhalt bestätigen</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionale Notizen zum Zustand..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={confirmReceipt}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bestätige...
                  </div>
                ) : 'Bestätigen'}
              </button>
              <button
                onClick={() => setConfirmingReceipt(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Sale Confirmation Form - Mobile optimized */}
        {confirmingSale && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">Verkauf melden</h4>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verkaufspreis (mind. {minimumPrice}€)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                min={minimumPrice}
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder={`Mindestens ${minimumPrice}`}
              />
              {salePrice && parseFloat(salePrice) > minimumPrice && (
                <p className="text-sm text-green-600 mt-1">
                  Ihr Gewinn: {(parseFloat(salePrice) - minimumPrice).toFixed(2)}€
                </p>
              )}
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionale Notizen zum Verkauf..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows="3"
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={confirmSale}
                disabled={loading || !salePrice || parseFloat(salePrice) < minimumPrice}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Melde...
                  </div>
                ) : 'Verkauf melden'}
              </button>
              <button
                onClick={() => setConfirmingSale(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Reverse Sale Dialog - Mobile optimized */}
        {reversingDialog && (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h4 className="font-medium text-gray-900 mb-3 text-orange-800 text-sm">⚠️ Verkauf zurücknehmen</h4>
            <p className="text-sm text-orange-700 mb-3">
              Bitte geben Sie einen detaillierten Grund für die Rücknahme an. 
              Das Gerät wird wieder als "verfügbar" markiert.
            </p>
            <textarea
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Grund für die Verkaufsrücknahme (z.B. Kunde hat Gerät zurückgegeben, Defekt festgestellt, etc.)..."
              className="w-full p-3 border border-orange-300 rounded-lg mb-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows="4"
              minLength="10"
              required
            />
            <p className="text-xs text-orange-600 mb-3">
              Mindestens 10 Zeichen erforderlich. Aktuell: {reverseReason.length}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={reverseSale}
                disabled={loading || reverseReason.length < 10}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Nehme zurück...
                  </div>
                ) : 'Verkauf zurücknehmen'}
              </button>
              <button
                onClick={() => {
                  setReversingDialog(false);
                  setReverseReason('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-4 rounded-lg transition duration-200"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceCard;