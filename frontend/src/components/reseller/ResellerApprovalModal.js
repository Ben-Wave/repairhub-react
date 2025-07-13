// frontend/src/components/reseller/ResellerApprovalModal.js - KORRIGIERT

import React, { useState } from 'react';
import axios from 'axios';

const ResellerApprovalModal = ({ assignment, onClose, onApproved }) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('resellerToken');
      const response = await axios.post(`/api/admin/approve-shipping/${assignment._id || assignment.assignmentId}`, {
        notes: notes.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ ' + response.data.message);
      onApproved(response.data.assignment);
      onClose();
    } catch (error) {
      console.error('Freigabe-Fehler:', error);
      alert('❌ Fehler bei der Freigabe: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  if (!assignment) return null;

  // KORRIGIERT: Sichere Datenextraktion
  console.log('Assignment Objekt:', assignment); // Debug-Ausgabe
  
  // Verschiedene mögliche Datenstrukturen abfangen
  const device = assignment.device || assignment.deviceId || assignment;
  
  // Fallback-Werte falls device undefined ist
  const deviceInfo = {
    brand: device?.brand || 'Unbekannt',
    model: device?.model || 'Unbekannt', 
    imei: device?.imei || 'Unbekannt',
    color: device?.color || 'Unbekannt',
    storage: device?.storage || 'Unbekannt',
    condition: device?.condition || 'Unbekannt',
    damageDescription: device?.damageDescription || ''
  };

  const minimumPrice = assignment?.minimumPrice || assignment?.device?.price || 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-lg shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900">
            🚀 Versand freigeben
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Gerät Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">📱 Zugewiesenes Gerät:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-blue-700">Modell:</span>
                <span className="text-blue-800">{deviceInfo.brand} {deviceInfo.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-700">IMEI:</span>
                <span className="text-blue-800 font-mono">{deviceInfo.imei}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-700">Farbe:</span>
                <span className="text-blue-800">{deviceInfo.color}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-700">Speicher:</span>
                <span className="text-blue-800">{deviceInfo.storage}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-blue-700">Zustand:</span>
                <span className="text-blue-800">{deviceInfo.condition}</span>
              </div>
              {deviceInfo.damageDescription && (
                <div className="pt-2 border-t border-blue-200">
                  <span className="font-medium text-blue-700">Beschreibung:</span>
                  <p className="text-blue-800 text-xs mt-1">{deviceInfo.damageDescription}</p>
                </div>
              )}
            </div>
          </div>

          {/* Gewinn-Info */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">💰 Ihr Gewinnpotenzial:</h4>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 mb-1">
                €{minimumPrice}
              </div>
              <div className="text-sm text-green-700">
                Mindestverkaufspreis - alles darüber gehört Ihnen!
              </div>
            </div>
          </div>

          {/* Bestätigung */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-2">✅ Freigabe-Bestätigung:</h4>
            <p className="text-sm text-yellow-800 mb-3">
              Ich bestätige, dass ich dieses Gerät haben möchte und der Admin es 
              an mich versenden soll.
            </p>
            <div className="space-y-2 text-xs text-yellow-700">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                Der Admin wählt die Versandart (DHL, persönliche Übergabe, etc.)
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                Sie erhalten eine Benachrichtigung mit Tracking-Informationen
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2"></span>
                Nach Erhalt bestätigen Sie den Zustand im System
              </div>
            </div>
          </div>

          {/* Optionale Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 Notizen für den Admin (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Bevorzugte Lieferzeit, besondere Wünsche, Fragen zum Gerät..."
              className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>💡 Tipp:</strong> Nach der Freigabe kann die Zuweisung nicht mehr 
              rückgängig gemacht werden. Das Gerät wird fest für Sie reserviert.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Freigabe läuft...
                </span>
              ) : (
                '🚀 Ja, Versand freigeben!'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResellerApprovalModal;