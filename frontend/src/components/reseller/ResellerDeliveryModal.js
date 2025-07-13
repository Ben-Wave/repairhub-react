// frontend/src/components/reseller/ResellerDeliveryModal.js - KORRIGIERT

import React, { useState } from 'react';
import axios from 'axios';

const ResellerDeliveryModal = ({ assignment, onClose, onConfirmed }) => {
  const [condition, setCondition] = useState('gut');
  const [issues, setIssues] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('resellerToken');
      const response = await axios.post(`/api/admin/confirm-delivery/${assignment._id || assignment.assignmentId}`, {
        condition,
        issues: issues.trim(),
        notes: notes.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✅ ' + response.data.message);
      onConfirmed(response.data.assignment);
      onClose();
    } catch (error) {
      console.error('Bestätigungs-Fehler:', error);
      alert('❌ Fehler bei der Bestätigung: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  if (!assignment) return null;

  // KORRIGIERT: Sichere Datenextraktion
  console.log('Assignment Objekt:', assignment); // Debug-Ausgabe
  
  // Verschiedene mögliche Datenstrukturen abfangen
  const device = assignment.device || assignment.deviceId || assignment;
  const shipping = assignment.shippingInfo || null;
  
  // Fallback-Werte falls device undefined ist
  const deviceInfo = {
    brand: device?.brand || 'Unbekannt',
    model: device?.model || 'Unbekannt', 
    imei: device?.imei || 'Unbekannt',
    color: device?.color || 'Unbekannt',
    storage: device?.storage || 'Unbekannt',
    condition: device?.condition || 'Unbekannt',
    price: device?.price || 0
  };

  const conditionOptions = [
    { value: 'ausgezeichnet', label: '⭐⭐⭐ Ausgezeichnet', description: 'Wie beschrieben, perfekter Zustand' },
    { value: 'gut', label: '⭐⭐ Gut', description: 'Kleine Abweichungen, aber akzeptabel' },
    { value: 'okay', label: '⭐ Okay', description: 'Größere Abweichungen von der Beschreibung' },
    { value: 'problematisch', label: '❌ Problematisch', description: 'Erhebliche Probleme oder Schäden' }
  ];

  const selectedCondition = conditionOptions.find(opt => opt.value === condition);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            📦 Erhalt bestätigen: {deviceInfo.brand} {deviceInfo.model}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gerät Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">📱 Erhaltenes Gerät:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Modell:</span>
                <p className="text-blue-800">{deviceInfo.brand} {deviceInfo.model}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">IMEI:</span>
                <p className="text-blue-800 font-mono">{deviceInfo.imei}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Farbe:</span>
                <p className="text-blue-800">{deviceInfo.color}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Speicher:</span>
                <p className="text-blue-800">{deviceInfo.storage}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Zustand:</span>
                <p className="text-blue-800">{deviceInfo.condition}</p>
              </div>
              <div>
                <span className="font-medium text-blue-700">Preis:</span>
                <p className="text-blue-800 font-semibold">€{deviceInfo.price}</p>
              </div>
            </div>
          </div>

          {/* Versand-Info anzeigen */}
          {shipping && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">🚚 Versand-Informationen:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-700">Versandart:</span>
                  <p className="text-green-800">
                    {shipping.method === 'dhl' && '📦 DHL Paket'}
                    {shipping.method === 'pickup' && '🤝 Persönliche Übergabe'}
                    {shipping.method === 'other' && '📮 Andere Versandart'}
                    {!shipping.method && '📮 Versandart unbekannt'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-green-700">Versendet am:</span>
                  <p className="text-green-800">
                    {shipping.shippedAt ? new Date(shipping.shippedAt).toLocaleDateString('de-DE') : 'Unbekannt'}
                  </p>
                </div>
                {shipping.trackingNumber && (
                  <div className="col-span-2">
                    <span className="font-medium text-green-700">Tracking:</span>
                    <div className="mt-1">
                      <p className="text-green-800 font-mono">{shipping.trackingNumber}</p>
                      {shipping.trackingUrl && (
                        <a 
                          href={shipping.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          🔍 Sendung bei DHL verfolgen
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {shipping.estimatedDelivery && (
                  <div>
                    <span className="font-medium text-green-700">Geschätzte Lieferung:</span>
                    <p className="text-green-800">
                      {new Date(shipping.estimatedDelivery).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Zustand bewerten */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              📋 Zustand bei Erhalt bewerten
            </label>
            <div className="space-y-2">
              {conditionOptions.map((option) => (
                <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    value={option.value}
                    checked={condition === option.value}
                    onChange={(e) => setCondition(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
            
            {/* Zustand-Vorschau */}
            <div className={`mt-3 p-3 rounded-lg border ${
              condition === 'ausgezeichnet' ? 'bg-green-50 border-green-200' :
              condition === 'gut' ? 'bg-blue-50 border-blue-200' :
              condition === 'okay' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                condition === 'ausgezeichnet' ? 'text-green-800' :
                condition === 'gut' ? 'text-blue-800' :
                condition === 'okay' ? 'text-yellow-800' :
                'text-red-800'
              }`}>
                Ausgewählt: {selectedCondition?.label}
              </p>
            </div>
          </div>

          {/* Probleme/Schäden */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⚠️ Festgestellte Probleme oder Schäden (optional)
            </label>
            <textarea
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              placeholder="z.B. Kratzer am Display, Verpackung beschädigt, andere Farbe als erwartet, fehlende Komponenten..."
              className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="4"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 Bitte beschreiben Sie alle Probleme detailliert - das hilft bei der Qualitätskontrolle
            </p>
          </div>

          {/* Allgemeine Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 Zusätzliche Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Alles perfekt, schnelle Lieferung, Verpackung sehr gut, vielen Dank..."
              className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-3">✅ Nach der Bestätigung:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ul className="text-sm text-green-800 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Das Gerät ist offiziell bei Ihnen angekommen
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Sie können mit dem Verkauf beginnen
                </li>
              </ul>
              <ul className="text-sm text-green-800 space-y-2">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Verkäufe melden Sie über das Dashboard
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Bei Problemen kontaktieren Sie den Admin
                </li>
              </ul>
            </div>
            
            {condition === 'problematisch' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Hinweis:</strong> Bei problematischen Zuständen wird der Admin automatisch 
                  benachrichtigt und meldet sich zeitnah bei Ihnen.
                </p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors text-base font-medium"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird bestätigt...
                </span>
              ) : (
                '✅ Erhalt bestätigen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResellerDeliveryModal;