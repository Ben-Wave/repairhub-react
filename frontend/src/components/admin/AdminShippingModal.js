// frontend/src/components/admin/AdminShippingModal.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminShippingModal = ({ assignment, onClose, onShipped }) => {
  const [shippingMethod, setShippingMethod] = useState('dhl');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('2');
  const [loading, setLoading] = useState(false);

  // Reseller-Adresse vorausfüllen falls vorhanden
  useEffect(() => {
    if (assignment?.resellerId) {
      const reseller = assignment.resellerId;
      let addr = `${reseller.name}\n${reseller.email}`;
      
      if (reseller.company) {
        addr = `${reseller.company}\n${reseller.name}\n${reseller.email}`;
      }
      
      if (reseller.phone) {
        addr += `\nTel: ${reseller.phone}`;
      }
      
      setRecipientAddress(addr);
    }
  }, [assignment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`/api/admin/ship-device/${assignment._id}`, {
        shippingMethod,
        trackingNumber: shippingMethod === 'dhl' ? trackingNumber : null,
        recipientAddress,
        notes,
        estimatedDays: parseInt(estimatedDays)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ ${response.data.message}`);
      onShipped(response.data.assignment);
      onClose();
    } catch (error) {
      console.error('Versand-Fehler:', error);
      alert('❌ Fehler beim Versand: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    } finally {
      setLoading(false);
    }
  };

  if (!assignment) return null;

  const device = assignment.deviceId;
  const reseller = assignment.resellerId;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative top-10 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            📦 Gerät versenden: {device.brand} {device.model}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reseller Info */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">👤 Empfänger-Informationen:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-800">Name:</span>
                <p className="text-blue-700">{reseller.name}</p>
              </div>
              <div>
                <span className="font-medium text-blue-800">Username:</span>
                <p className="text-blue-700">@{reseller.username}</p>
              </div>
              <div>
                <span className="font-medium text-blue-800">E-Mail:</span>
                <p className="text-blue-700">{reseller.email}</p>
              </div>
              {reseller.phone && (
                <div>
                  <span className="font-medium text-blue-800">Telefon:</span>
                  <p className="text-blue-700">📱 {reseller.phone}</p>
                </div>
              )}
              {reseller.company && (
                <div className="col-span-2">
                  <span className="font-medium text-blue-800">Firma:</span>
                  <p className="text-blue-700">🏢 {reseller.company}</p>
                </div>
              )}
            </div>
          </div>

          {/* Gerät Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">📱 Gerät-Details:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Modell:</span>
                <p className="text-gray-800">{device.brand} {device.model}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">IMEI:</span>
                <p className="text-gray-800 font-mono">{device.imei}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Farbe:</span>
                <p className="text-gray-800">{device.color}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Speicher:</span>
                <p className="text-gray-800">{device.storage}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Zustand:</span>
                <p className="text-gray-800">{device.condition}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Preis:</span>
                <p className="text-gray-800 font-semibold">€{device.price}</p>
              </div>
            </div>
          </div>

          {/* Versandart */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              🚚 Versandart wählen
            </label>
            <select
              value={shippingMethod}
              onChange={(e) => setShippingMethod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dhl">📦 DHL Paket (mit Tracking)</option>
              <option value="pickup">🤝 Persönliche Übergabe</option>
              <option value="other">📮 Andere Versandart</option>
            </select>
          </div>

          {/* DHL Tracking */}
          {shippingMethod === 'dhl' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📋 DHL Tracking-Nummer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="z.B. 00340434798362100413"
                  className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700 mb-1">
                    ✅ Automatischer Tracking-Link wird generiert:
                  </p>
                  <p className="font-mono text-xs text-blue-600 break-all">
                    https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={trackingNumber || 'TRACKING_NUMMER'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏱️ Geschätzte Lieferzeit
                </label>
                <select
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">1 Tag (Express)</option>
                  <option value="2">2 Tage (Standard)</option>
                  <option value="3">3 Tage</option>
                  <option value="5">5 Tage</option>
                  <option value="7">1 Woche</option>
                </select>
              </div>
            </>
          )}

          {/* Empfänger-Adresse */}
          {shippingMethod !== 'pickup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📍 Empfänger-Adresse
              </label>
              <textarea
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Name, Firma, Straße, PLZ Ort..."
                className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tipp: Adresse wurde automatisch mit Reseller-Daten ausgefüllt
              </p>
            </div>
          )}

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Versand-Notizen (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                shippingMethod === 'pickup' 
                  ? "z.B. Übergabeort, Termindetails, besondere Hinweise..."
                  : "z.B. Verpackungsdetails, besondere Versandhinweise, Fragile-Aufkleber..."
              }
              className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            />
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">
              ✅ Nach dem {shippingMethod === 'pickup' ? 'Dokumentieren der Übergabe' : 'Versand'}:
            </h4>
            <ul className="text-sm text-green-800 space-y-1 list-disc pl-5">
              <li>Reseller erhält automatisch eine E-Mail-Benachrichtigung</li>
              {shippingMethod === 'dhl' && <li>Tracking-Link wird automatisch generiert und übermittelt</li>}
              <li>Status wird auf "{shippingMethod === 'pickup' ? 'handed_over' : 'shipped'}" gesetzt</li>
              <li>Reseller kann den Erhalt im System bestätigen</li>
              <li>Nach Erhalt-Bestätigung kann der Verkauf beginnen</li>
            </ul>
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
              disabled={loading || (shippingMethod === 'dhl' && !trackingNumber)}
              className="px-6 py-3 text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird versendet...
                </span>
              ) : (
                <>
                  {shippingMethod === 'pickup' && '🤝 Übergabe dokumentieren'}
                  {shippingMethod === 'dhl' && '📦 DHL-Versand starten'}
                  {shippingMethod === 'other' && '📮 Versand starten'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminShippingModal;