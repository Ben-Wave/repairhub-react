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

  // Hilfsfunktion um Kategorie-Farben zu bestimmen
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
      <div className="p-5">
        {/* Device Image */}
        {device.thumbnail && (
          <img 
            src={device.thumbnail} 
            alt={device.model}
            className="w-full h-32 object-contain mb-4"
          />
        )}

        {/* Status Badge */}
        <div className="flex justify-between items-center mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-indigo-600 hover:text-indigo-900 text-sm"
          >
            {showDetails ? 'Weniger' : 'Details'}
          </button>
        </div>

        {/* Basic Info */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {device.model}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          IMEI: {device.imei}
        </p>
        <p className="text-sm text-gray-600 mb-4">
          {device.modelDesc}
        </p>

        {/* Price Info */}
        <div className="bg-gray-50 p-3 rounded mb-4">
          <p className="text-sm font-medium text-gray-900">
            Mindestpreis: <span className="text-green-600">{minimumPrice}€</span>
          </p>
          {deviceData.actualSalePrice && (
            <p className="text-sm text-gray-600">
              Verkauft für: <span className="text-green-600">{deviceData.actualSalePrice}€</span>
            </p>
          )}
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="border-t border-gray-200 pt-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Schäden & Reparaturen:</h4>
            <p className="text-sm text-gray-600 mb-3">{device.damageDescription || 'Keine Beschreibung'}</p>
            
            {repairDetails.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Verwendete Teile:</h5>
                <div className="space-y-2">
                  {repairDetails.map((part, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900">
                              {part.partNumber}
                            </span>
                            {/* Kategorie-Badge */}
                            {part.category && part.category !== 'Unbekannt' && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(part.category)}`}>
                                {part.category}
                              </span>
                            )}
                          </div>
                          {/* Beschreibung */}
                          {part.description && part.description !== 'Unbekannt' && (
                            <p className="text-sm text-gray-600 mb-1">
                              {part.description}
                            </p>
                          )}
                          {/* Kompatibilität */}
                          {part.forModel && part.forModel !== 'Unbekannt' && (
                            <p className="text-xs text-gray-500">
                              Für: {part.forModel}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-green-600">
                            {part.price}€
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-900 flex justify-between">
                    <span>Gesamte Reparaturkosten:</span>
                    <span className="text-green-600">{totalPartsCost}€</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {status === 'assigned' && !confirmingReceipt && (
            <button
              onClick={() => setConfirmingReceipt(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Erhalt bestätigen
            </button>
          )}

          {status === 'received' && !confirmingSale && (
            <button
              onClick={() => setConfirmingSale(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Verkauf melden
            </button>
          )}

          {status === 'sold' && (
            <div className="space-y-2">
              <div className="text-center text-green-600 font-medium">
                ✓ Verkauft für {deviceData.actualSalePrice}€
              </div>
              <button
                onClick={() => setReversingDialog(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded text-sm"
              >
                Verkauf zurücknehmen
              </button>
            </div>
          )}
        </div>

        {/* Receipt Confirmation Form */}
        {confirmingReceipt && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <h4 className="font-medium text-gray-900 mb-3">Erhalt bestätigen</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionale Notizen zum Zustand..."
              className="w-full p-2 border border-gray-300 rounded mb-3"
              rows="3"
            />
            <div className="flex space-x-2">
              <button
                onClick={confirmReceipt}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Bestätige...' : 'Bestätigen'}
              </button>
              <button
                onClick={() => setConfirmingReceipt(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Sale Confirmation Form */}
        {confirmingSale && (
          <div className="mt-4 p-4 bg-green-50 rounded">
            <h4 className="font-medium text-gray-900 mb-3">Verkauf melden</h4>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verkaufspreis (mind. {minimumPrice}€)
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                min={minimumPrice}
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded"
                placeholder={`Mindestens ${minimumPrice}`}
              />
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionale Notizen zum Verkauf..."
              className="w-full p-2 border border-gray-300 rounded mb-3"
              rows="3"
            />
            <div className="flex space-x-2">
              <button
                onClick={confirmSale}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Melde...' : 'Verkauf melden'}
              </button>
              <button
                onClick={() => setConfirmingSale(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Verkauf zurücknehmen Dialog */}
        {reversingDialog && (
          <div className="mt-4 p-4 bg-orange-50 rounded border border-orange-200">
            <h4 className="font-medium text-gray-900 mb-3 text-orange-800">⚠️ Verkauf zurücknehmen</h4>
            <p className="text-sm text-orange-700 mb-3">
              Bitte geben Sie einen detaillierten Grund für die Rücknahme an. 
              Das Gerät wird wieder als "verfügbar" markiert.
            </p>
            <textarea
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Grund für die Verkaufsrücknahme (z.B. Kunde hat Gerät zurückgegeben, Defekt festgestellt, etc.)..."
              className="w-full p-3 border border-orange-300 rounded mb-3"
              rows="4"
              minLength="10"
              required
            />
            <p className="text-xs text-orange-600 mb-3">
              Mindestens 10 Zeichen erforderlich. Aktuell: {reverseReason.length}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={reverseSale}
                disabled={loading || reverseReason.length < 10}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
              >
                {loading ? 'Nehme zurück...' : 'Verkauf zurücknehmen'}
              </button>
              <button
                onClick={() => {
                  setReversingDialog(false);
                  setReverseReason('');
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
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