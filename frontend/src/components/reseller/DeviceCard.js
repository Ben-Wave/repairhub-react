// frontend/src/components/reseller/DeviceCard.js - AKTUALISIERT für neuen Workflow
import React, { useState } from 'react';
import axios from 'axios';
import ResellerApprovalModal from './ResellerApprovalModal';
import ResellerDeliveryModal from './ResellerDeliveryModal';

const DeviceCard = ({ deviceData, onUpdate, confirmingReceipt, onConfirmReceipt }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [confirmingSale, setConfirmingSale] = useState(false);
  const [reversingDialog, setReversingDialog] = useState(false);
  const [salePrice, setSalePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [reverseReason, setReverseReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Aktualisierte Daten-Extraktion für neuen Workflow
  const device = deviceData.device || deviceData.deviceId || deviceData;
  const assignment = deviceData.assignment || deviceData;
  const status = assignment?.status || deviceData.status || 'assigned';
  const minimumPrice = assignment?.minimumPrice || deviceData.minimumPrice || 0;
  const assignmentId = assignment?._id || assignment?.assignmentId || deviceData.assignmentId;

  // Aktualisierte Status-Farben für neuen Workflow
  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'handed_over': return 'bg-purple-100 text-purple-800';
      case 'received': return 'bg-green-100 text-green-800';
      case 'sold': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Aktualisierte Status-Texte für neuen Workflow
  const getStatusText = (status) => {
    switch (status) {
      case 'assigned': return '📋 Zugewiesen';
      case 'approved': return '🚀 Freigegeben';
      case 'shipped': return '📦 Versendet';
      case 'handed_over': return '🤝 Übergeben';
      case 'received': return '✅ Erhalten';
      case 'sold': return '💰 Verkauft';
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

  // NEU: Verkauf melden mit E-Mail-Benachrichtigung an Admin (aktualisiert)
const confirmSale = async () => {
  if (!salePrice || parseFloat(salePrice) < minimumPrice) {
    alert(`Verkaufspreis muss mindestens ${minimumPrice}€ betragen`);
    return;
  }

  setLoading(true);
  try {
    const token = localStorage.getItem('resellerToken');
    
    // ✅ VERWENDE DIE NEUE ROUTE (mit E-Mail-Funktionalität)
    const response = await axios.post(`/api/admin/report-sale/${assignmentId}`, 
      { 
        salePrice: parseFloat(salePrice),  // Achtung: Parameter heißt "salePrice"
        notes 
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setConfirmingSale(false);
    setSalePrice('');
    setNotes('');
    
    const profit = parseFloat(salePrice) - minimumPrice;
    
    // Erfolgs-Nachricht mit E-Mail-Info
    alert(`🎉 Verkauf erfolgreich gemeldet!\n\nVerkaufspreis: ${salePrice}€\nIhr Gewinn: ${profit.toFixed(2)}€\n\n📧 Der Administrator wurde per E-Mail mit einer detaillierten Gewinn-Aufschlüsselung benachrichtigt.`);
    
    onUpdate();
  } catch (error) {
    console.error('Fehler beim Bestätigen des Verkaufs:', error);
    alert('❌ Fehler beim Melden des Verkaufs: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
  } finally {
    setLoading(false);
  }
};

  // ERWEITERT: Verkauf zurücknehmen (aktualisiert)
const reverseSale = async () => {
  if (!reverseReason || reverseReason.trim().length < 10) {
    alert('Bitte geben Sie einen ausführlichen Grund ein (mindestens 10 Zeichen)');
    return;
  }

  setLoading(true);
  try {
    const token = localStorage.getItem('resellerToken');
    
    // ✅ VERWENDE DIE NEUE ROUTE
    await axios.post(`/api/admin/reverse-sale/${assignmentId}`, 
      { reason: reverseReason },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setReversingDialog(false);
    setReverseReason('');
    onUpdate();
    
    alert('↩️ Verkauf wurde erfolgreich zurückgenommen.\n\nDas Gerät kann erneut verkauft werden.');
  } catch (error) {
    console.error('Fehler beim Zurücknehmen des Verkaufs:', error);
    alert('❌ Fehler beim Zurücknehmen des Verkaufs: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
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
          {device.brand} {device.model}
        </h3>
        <div className="space-y-1 mb-4 text-sm text-gray-600">
          <p className="break-all">IMEI: {device.imei}</p>
          {device.modelDesc && (
            <p className="text-xs sm:text-sm">{device.modelDesc}</p>
          )}
          {/* NEU: Zusätzliche Geräte-Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {device.color && <p><strong>Farbe:</strong> {device.color}</p>}
            {device.storage && <p><strong>Speicher:</strong> {device.storage}</p>}
            {device.condition && <p><strong>Zustand:</strong> {device.condition}</p>}
          </div>
        </div>

        {/* Price Info - Mobile optimized */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
            <p className="text-sm font-medium text-gray-900">
              Mindestpreis: <span className="text-green-600">{minimumPrice}€</span>
            </p>
            {assignment?.actualSalePrice && (
              <p className="text-sm text-gray-600">
                Verkauft für: <span className="text-green-600 font-medium">{assignment.actualSalePrice}€</span>
              </p>
            )}
          </div>
          {assignment?.actualSalePrice && minimumPrice && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-green-700">
                <strong>Ihr Gewinn: {(assignment.actualSalePrice - minimumPrice).toFixed(2)}€</strong>
              </p>
            </div>
          )}
        </div>

        {/* NEU: Versand-Informationen für shipped/handed_over Status */}
        {assignment?.shippingInfo && ['shipped', 'handed_over', 'received'].includes(status) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📦 Versand-Informationen</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <p>
                <strong>Art:</strong> {
                  assignment.shippingInfo.method === 'dhl' ? '📦 DHL Paket' :
                  assignment.shippingInfo.method === 'pickup' ? '🤝 Persönliche Übergabe' :
                  '📮 Andere Versandart'
                }
              </p>
              {assignment.shippingInfo.trackingNumber && (
                <p><strong>Tracking:</strong> {assignment.shippingInfo.trackingNumber}</p>
              )}
              {assignment.shippingInfo.shippedAt && (
                <p><strong>Versendet am:</strong> {new Date(assignment.shippingInfo.shippedAt).toLocaleDateString('de-DE')}</p>
              )}
              {assignment.shippingInfo.estimatedDelivery && (
                <p><strong>Geschätzte Ankunft:</strong> {new Date(assignment.shippingInfo.estimatedDelivery).toLocaleDateString('de-DE')}</p>
              )}
              {assignment.shippingInfo.trackingUrl && (
                <div className="mt-2">
                  <a 
                    href={assignment.shippingInfo.trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    🔍 Sendung bei DHL verfolgen
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEU: Status-spezifische Hinweise */}
        {status === 'assigned' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>📧 E-Mail erhalten?</strong> Sie sollten eine E-Mail mit Gerätedetails erhalten haben. 
                  Geben Sie hier den Versand frei - der Admin wird automatisch benachrichtigt.
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'approved' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-sm text-yellow-800">
                <strong>🚀 Freigabe erteilt!</strong> Der Admin bereitet den Versand vor. Sie erhalten bald eine Versand-Benachrichtigung.
              </p>
            </div>
          </div>
        )}

        {['shipped', 'handed_over'].includes(status) && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-purple-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-purple-800">
                  <strong>📦 {status === 'shipped' ? 'Unterwegs!' : 'Übergeben!'}</strong> 
                  {status === 'shipped' ? ' Ihr Gerät ist auf dem Weg. ' : ' Ihr Gerät wurde persönlich übergeben. '}
                  Bestätigen Sie den Erhalt sobald es bei Ihnen angekommen ist.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Details - Mobile optimized (bestehend, aber erweitert) */}
        {showDetails && (
          <div className="border-t border-gray-200 pt-4 mb-4 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Schäden & Reparaturen:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                {device.damageDescription || 'Keine Beschreibung verfügbar'}
              </p>
            </div>
            
            {deviceData.repairDetails && deviceData.repairDetails.length > 0 && (
              <div>
                <h5 className="font-medium text-gray-900 mb-3 text-sm">Verwendete Ersatzteile:</h5>
                <div className="space-y-3">
                  {deviceData.repairDetails.map((part, index) => (
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
                {deviceData.totalPartsCost && (
                  <div className="mt-3 pt-3 border-t border-gray-200 bg-gray-50 p-2 rounded">
                    <p className="text-sm font-medium text-gray-900 flex justify-between">
                      <span>Gesamte Reparaturkosten:</span>
                      <span className="text-green-600">{deviceData.totalPartsCost}€</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* NEU: Action Buttons für neuen Workflow */}
        <div className="space-y-3">
          {/* SCHRITT 1: Versand freigeben */}
          {status === 'assigned' && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              🚀 Versand freigeben
            </button>
          )}

          {/* SCHRITT 2: Warten auf Versand */}
          {status === 'approved' && (
            <div className="text-center text-blue-600 font-medium py-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Admin bereitet Versand vor...
              </div>
            </div>
          )}

          {/* SCHRITT 3: Erhalt bestätigen */}
          {['shipped', 'handed_over'].includes(status) && (
            <button
              onClick={() => setShowDeliveryModal(true)}
              disabled={confirmingReceipt === assignmentId}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              {confirmingReceipt === assignmentId ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Bestätige...
                </div>
              ) : (
                '📦 Erhalt bestätigen'
              )}
            </button>
          )}

          {/* SCHRITT 4: Verkauf melden */}
          {status === 'received' && !confirmingSale && (
            <button
              onClick={() => setConfirmingSale(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
            >
              💰 Verkauf melden
            </button>
          )}

          {/* SCHRITT 5: Verkauft */}
          {status === 'sold' && (
            <div className="space-y-3">
              <div className="text-center text-green-600 font-medium py-2 bg-green-50 rounded-lg">
                ✓ Verkauft für {assignment?.actualSalePrice}€
                {assignment?.actualSalePrice > minimumPrice && (
                  <div className="text-sm text-green-700 mt-1">
                    Ihr Gewinn: {(assignment.actualSalePrice - minimumPrice).toFixed(2)}€
                  </div>
                )}
              </div>
              
              {/* NEU: E-Mail-Bestätigung für verkaufte Geräte */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      <strong>📧 Admin benachrichtigt:</strong> Der Administrator wurde per E-Mail über den Verkauf informiert und erhielt eine detaillierte Gewinn-Aufschlüsselung.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setReversingDialog(true)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition duration-200"
              >
                ↩️ Verkauf zurücknehmen
              </button>
            </div>
          )}
        </div>

        {/* Sale Confirmation Form - Mobile optimized (bestehend, etwas angepasst) */}
        {confirmingSale && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">💰 Verkauf melden</h4>
            
            {/* E-Mail-Info */}
            <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded">
              <p className="text-sm text-green-800">
                <strong>📧 Was passiert:</strong> Der Administrator erhält eine E-Mail mit dem Verkaufspreis 
                und einer detaillierten Gewinn-Aufschlüsselung (RepairHub vs. Ihr Anteil).
              </p>
            </div>
            
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
                  💰 Ihr Gewinn: {(parseFloat(salePrice) - minimumPrice).toFixed(2)}€
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
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Melde...
                  </div>
                ) : '💰 Verkauf melden & Admin benachrichtigen'}
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

        {/* Reverse Sale Dialog - Mobile optimized (bestehend) */}
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
                ) : '↩️ Verkauf zurücknehmen'}
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

      {/* NEU: Modals für neuen Workflow */}
      {showApprovalModal && (
        <ResellerApprovalModal
          assignment={assignment}
          onClose={() => setShowApprovalModal(false)}
          onApproved={(updatedAssignment) => {
            setShowApprovalModal(false);
            onUpdate();
          }}
        />
      )}

      {showDeliveryModal && (
        <ResellerDeliveryModal
          assignment={assignment}
          onClose={() => setShowDeliveryModal(false)}
          onConfirmed={(updatedAssignment) => {
            setShowDeliveryModal(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};

export default DeviceCard;