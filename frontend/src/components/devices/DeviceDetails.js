import React, { useEffect, useContext, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DeviceContext } from '../../context/DeviceContext';
import { PartsContext } from '../../context/PartsContext';
import Spinner from '../layout/Spinner';
import Alert from '../layout/Alert';
import SalesModal from './SalesModal';

const DeviceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // KRITISCHER FIX: Verwende currentDevice statt device und entferne getStats
  const { 
    currentDevice: device, 
    loading, 
    error, 
    getDevice, 
    updateDevice, 
    deleteDevice
  } = useContext(DeviceContext);
  
  const { parts, getParts } = useContext(PartsContext);
  
  const [alert, setAlert] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [damageDescription, setDamageDescription] = useState('');
  const [desiredProfit, setDesiredProfit] = useState(0);
  const [filterType, setFilterType] = useState('compatible');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [showPartsSection, setShowPartsSection] = useState(false);
  const [activeSection, setActiveSection] = useState('info'); // 'info', 'parts', 'costs'
  
  // NEU: Qualitätsprüfung State
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [qualityChecklist, setQualityChecklist] = useState({
    display: false,
    touchscreen: false,
    buttons: false,
    speakers: false,
    microphone: false,
    camera: false,
    battery: false,
    charging: false,
    wifi: false,
    cellular: false,
    sensors: false,
    overall: false
  });
  const [qualityNotes, setQualityNotes] = useState('');
  
  // Hilfs-/Berechungsfunktionen zuerst definieren
  const calculateTotalPartsPrice = () => {
    return selectedParts.reduce((total, part) => total + (part.price || 0), 0);
  };
  
  const calculateSellingPrice = () => {
    return (parseFloat(purchasePrice) || 0) + 
           calculateTotalPartsPrice() + 
           (parseFloat(desiredProfit) || 0);
  };
  
  const calculateActualProfit = () => {
    if (!device || !device.actualSellingPrice) return 0;
    const costs = (parseFloat(purchasePrice) || 0) + calculateTotalPartsPrice();
    return device.actualSellingPrice - costs;
  };
  
  // Extrahiere das Basismodell (z.B. "iPhone 13 mini")
  const getBaseModel = (modelString) => {
    if (!modelString) return '';
    const modelRegex = /^(iPhone \d+(?:\s(?:mini|Pro|Pro Max))?)/i;
    const modelMatch = modelString.match(modelRegex);
    return modelMatch ? modelMatch[1] : '';
  };
  
  // NEU: Qualitätsprüfungs-Funktionen
  const resetQualityCheck = () => {
    setQualityChecklist({
      display: false,
      touchscreen: false,
      buttons: false,
      speakers: false,
      microphone: false,
      camera: false,
      battery: false,
      charging: false,
      wifi: false,
      cellular: false,
      sensors: false,
      overall: false
    });
    setQualityNotes('');
  };
  
  const getQualityCheckItems = () => [
    { key: 'display', label: 'Display funktioniert einwandfrei (keine Pixelfehler, richtige Farben)', icon: '📱' },
    { key: 'touchscreen', label: 'Touchscreen reagiert präzise in allen Bereichen', icon: '👆' },
    { key: 'buttons', label: 'Alle Tasten funktionieren (Power, Lautstärke, Home/Touch ID)', icon: '🔘' },
    { key: 'speakers', label: 'Lautsprecher und Hörmuschel funktionieren klar', icon: '🔊' },
    { key: 'microphone', label: 'Mikrofon nimmt deutlich auf', icon: '🎤' },
    { key: 'camera', label: 'Alle Kameras funktionieren (Foto/Video, Front/Back)', icon: '📷' },
    { key: 'battery', label: 'Akku hält mindestens einen Tag normale Nutzung', icon: '🔋' },
    { key: 'charging', label: 'Laden funktioniert schnell und zuverlässig', icon: '⚡' },
    { key: 'wifi', label: 'WLAN verbindet sich stabil', icon: '📶' },
    { key: 'cellular', label: 'Mobilfunk funktioniert (Anrufe, Daten)', icon: '📡' },
    { key: 'sensors', label: 'Face ID/Touch ID und andere Sensoren funktionieren', icon: '🔍' },
    { key: 'overall', label: 'Gerät läuft flüssig ohne Abstürze oder Hänger', icon: '✅' }
  ];
  
  const isQualityCheckPassed = () => {
    const items = getQualityCheckItems();
    return items.every(item => qualityChecklist[item.key]);
  };
  
  const handleQualityCheckSubmit = async () => {
    if (!isQualityCheckPassed()) {
      setAlert({ 
        type: 'error', 
        message: 'Bitte bestätigen Sie alle Qualitätsprüfungen bevor das Gerät als verkaufsbereit markiert wird.' 
      });
      return;
    }
    
    try {
      // Qualitätsprüfung in Notes speichern
      const qualityReport = `QUALITÄTSPRÜFUNG BESTANDEN - ${new Date().toLocaleDateString('de-DE')}\n` +
        `Geprüft von: Admin\n` +
        `Alle Funktionen getestet und einwandfrei.\n` +
        (qualityNotes ? `Zusätzliche Notizen: ${qualityNotes}\n` : '') +
        `\nVorherige Beschreibung: ${damageDescription || 'Keine'}`;
      
      await updateDevice(id, { 
        status: 'verkaufsbereit',
        damageDescription: qualityReport,
        updatedAt: new Date()
      });
      
      setDamageDescription(qualityReport);
      setShowQualityCheck(false);
      resetQualityCheck();
      setAlert({ type: 'success', message: 'Gerät erfolgreich als verkaufsbereit markiert! Qualitätsprüfung bestanden.' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Fehler beim Aktualisieren des Status' });
    }
  };
  
  // KRITISCHER FIX: Entferne getDevice aus Dependencies um Endlosschleife zu vermeiden
  useEffect(() => {
    if (typeof getDevice === 'function' && id) {
      getDevice(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // NUR id als Dependency!
  
  // KRITISCHER FIX: Entferne getParts aus Dependencies
  useEffect(() => {
    if (typeof getParts === 'function') {
      getParts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Leere Dependencies!
  
  useEffect(() => {
    if (device) {
      setPurchasePrice(device.purchasePrice || 0);
      setDamageDescription(device.damageDescription || '');
      setDesiredProfit(device.desiredProfit || 0);
      setSelectedParts(device.parts || []);
    }
  }, [device]);
  
  // Verfügbare Kategorien aus allen Teilen extrahieren
  const categories = useMemo(() => {
    if (!parts || !parts.length) return [];
    const categorySet = new Set(parts.map(part => part.category).filter(Boolean));
    return Array.from(categorySet).sort();
  }, [parts]);
  
  // Filtern der Teile basierend auf verschiedenen Kriterien
  const filteredParts = useMemo(() => {
    if (!device || !parts || !parts.length) return [];
    
    const deviceBaseModel = getBaseModel(device.model);
    
    let filtered = [...parts];
    
    // Filtern nach Kompatibilität
    if (filterType === 'compatible' && deviceBaseModel) {
      filtered = parts.filter(part => {
        const partBaseModel = getBaseModel(part.forModel);
        return partBaseModel.toLowerCase() === deviceBaseModel.toLowerCase();
      });
    }
    
    // Filtern nach Kategorie
    if (selectedCategory) {
      filtered = filtered.filter(part => part.category === selectedCategory);
    }
    
    // Filtern nach Suchbegriff
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(part => 
        part.partNumber.toLowerCase().includes(query) || 
        part.description.toLowerCase().includes(query) ||
        (part.forModel && part.forModel.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [device, parts, filterType, searchQuery, selectedCategory]);
  
  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'verkauft') {
        setIsSalesModalOpen(true);
      } else if (newStatus === 'verkaufsbereit' && device?.status === 'in_reparatur') {
        // NEU: Qualitätsprüfung bei Wechsel von "in_reparatur" zu "verkaufsbereit"
        setShowQualityCheck(true);
        resetQualityCheck();
      } else {
        await updateDevice(id, { status: newStatus });
        setAlert({ type: 'success', message: 'Status erfolgreich aktualisiert' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Fehler beim Aktualisieren des Status' });
    }
  };
  
  const handleSaveActualSellingPrice = async (actualSellingPrice) => {
    try {
      const now = new Date();
      await updateDevice(id, { 
        status: 'verkauft',
        actualSellingPrice,
        soldDate: now
      });
      
      setAlert({ type: 'success', message: 'Gerät als verkauft markiert und Verkaufspreis gespeichert' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Fehler beim Speichern des Verkaufspreises' });
    }
  };
  
  const handleSaveChanges = async () => {
    try {
      // Kalkulierten Verkaufspreis berechnen
      const sellingPrice = calculateSellingPrice();
      
      await updateDevice(id, {
        purchasePrice,
        damageDescription,
        desiredProfit,
        sellingPrice,
        parts: selectedParts,
        updatedAt: new Date()
      });
      setAlert({ type: 'success', message: 'Gerät erfolgreich aktualisiert' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Fehler beim Aktualisieren des Geräts' });
    }
  };
  
  const handleDeleteDevice = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Gerät löschen möchten?')) {
      try {
        await deleteDevice(id);
        navigate('/devices');
      } catch (err) {
        setAlert({ type: 'error', message: 'Fehler beim Löschen des Geräts' });
      }
    }
  };
  
  const handleAddPart = (part) => {
    const exists = selectedParts.some(p => p.partNumber === part.partNumber);
    if (!exists) {
      setSelectedParts([...selectedParts, {
        partNumber: part.partNumber,
        price: part.price
      }]);
    }
  };
  
  const handleRemovePart = (partNumber) => {
    setSelectedParts(selectedParts.filter(p => p.partNumber !== partNumber));
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'gekauft':
        return 'Gekauft';
      case 'in_reparatur':
        return 'In Reparatur';
      case 'verkaufsbereit':
        return 'Verkaufsbereit';
      case 'zum_verkauf':
        return 'Zum Verkauf';
      case 'verkauft':
        return 'Verkauft';
      default:
        return 'Unbekannt';
    }
  };

  // Einheitliche Farbe für Status-Buttons und Status-Badges (nur Farben, keine Größen)
  const statusColorMap = {
    gekauft: 'bg-blue-100 text-blue-800',
    in_reparatur: 'bg-yellow-100 text-yellow-800',
    verkaufsbereit: 'bg-orange-100 text-orange-800',
    zum_verkauf: 'bg-green-100 text-green-800',
    verkauft: 'bg-purple-100 text-purple-800'
  };
  const statusActiveColorMap = {
    gekauft: 'bg-blue-600 text-white',
    in_reparatur: 'bg-yellow-600 text-white',
    verkaufsbereit: 'bg-orange-600 text-white',
    zum_verkauf: 'bg-green-600 text-white',
    verkauft: 'bg-purple-600 text-white'
  };
  const statusInactiveColorMap = statusColorMap;
  
  if (loading || !device) {
    return <Spinner />;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {alert && (
          <Alert 
            message={alert.message} 
            type={alert.type} 
            onClose={() => setAlert(null)} 
          />
        )}
        
        <SalesModal 
          isOpen={isSalesModalOpen} 
          onClose={() => setIsSalesModalOpen(false)} 
          onSave={handleSaveActualSellingPrice}
          desiredSellingPrice={device.sellingPrice || calculateSellingPrice()}
        />
        
        {/* NEU: Qualitätsprüfung Modal */}
        {showQualityCheck && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative min-h-screen flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-medium text-gray-900 flex items-center">
                      <span className="text-2xl mr-3">🔍</span>
                      Qualitätsprüfung
                    </h3>
                    <button
                      onClick={() => {
                        setShowQualityCheck(false);
                        resetQualityCheck();
                      }}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Info Panel */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-blue-800">
                          <strong>Wichtig:</strong> Bevor das Gerät als "verkaufsbereit" markiert wird, müssen alle 
                          Funktionen getestet und bestätigt werden. Dies stellt sicher, dass nur einwandfreie Geräte 
                          an Kunden verkauft werden.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Device Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Geräteinformationen</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Modell:</span>
                        <span className="ml-2 font-medium">{device.model}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">IMEI:</span>
                        <span className="ml-2 font-medium break-all">{device.imei}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Aktueller Status:</span>
                        <span className={`ml-2 inline-block px-2 py-1 rounded text-xs font-medium ${statusColorMap[device.status]}`}>
                          {getStatusLabel(device.status)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Neuer Status:</span>
                        <span className="ml-2 inline-block px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800">
                          Verkaufsbereit
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Qualitäts-Checkliste */}
                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">
                      Funktionsprüfung - Alle Punkte müssen bestätigt werden
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {getQualityCheckItems().map((item) => (
                        <div key={item.key} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            <input
                              type="checkbox"
                              id={`quality-${item.key}`}
                              checked={qualityChecklist[item.key]}
                              onChange={(e) => setQualityChecklist({
                                ...qualityChecklist,
                                [item.key]: e.target.checked
                              })}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                          </div>
                          <label htmlFor={`quality-${item.key}`} className="flex-1 cursor-pointer">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{item.icon}</span>
                              <span className="text-sm font-medium text-gray-900">{item.label}</span>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="mt-4 bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(Object.values(qualityChecklist).filter(Boolean).length / getQualityCheckItems().length) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2">
                      {Object.values(qualityChecklist).filter(Boolean).length} von {getQualityCheckItems().length} Punkten bestätigt
                    </p>
                  </div>
                  
                  {/* Zusätzliche Notizen */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zusätzliche Notizen zur Qualitätsprüfung (optional)
                    </label>
                    <textarea
                      value={qualityNotes}
                      onChange={(e) => setQualityNotes(e.target.value)}
                      placeholder="z.B. Besondere Auffälligkeiten, durchgeführte Tests, Garantiehinweise..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      rows="3"
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowQualityCheck(false);
                        resetQualityCheck();
                      }}
                      className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleQualityCheckSubmit}
                      disabled={!isQualityCheckPassed()}
                      className={`px-6 py-3 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                        isQualityCheckPassed()
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isQualityCheckPassed() 
                        ? '✅ Als verkaufsbereit markieren' 
                        : `Noch ${getQualityCheckItems().length - Object.values(qualityChecklist).filter(Boolean).length} Punkte bestätigen`
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Header - Mobile optimized */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-blue-900 leading-tight">
                {device.modelDesc || device.model}
              </h2>
              <p className="text-sm text-gray-600 mt-1 break-all">IMEI: {device.imei}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate('/devices')}
                className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200 text-sm"
              >
                ← Zurück
              </button>
              <button
                onClick={handleDeleteDevice}
                className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-200 text-sm"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Section Navigation */}
        <div className="block lg:hidden mb-6">
          <div className="bg-white rounded-lg shadow-md p-1">
            <div className="grid grid-cols-3 gap-1">
              {[
                { key: 'info', label: '📱 Info', icon: '📱' },
                { key: 'parts', label: '🔧 Teile', icon: '🔧' },
                { key: 'costs', label: '💰 Kosten', icon: '💰' }
              ].map(section => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`p-3 rounded-md text-center transition duration-200 ${
                    activeSection === section.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-lg mb-1">{section.icon}</div>
                  <div className="text-xs font-medium">{section.label}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          {/* Left Column - Device Info */}
          <div className="space-y-6">
            {/* Device Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Geräteinformationen</h3>
              
              {device.thumbnail && (
                <div className="mb-4 text-center">
                  <img 
                    src={device.thumbnail} 
                    alt={device.model} 
                    className="max-w-xs mx-auto"
                  />
                </div>
              )}
              
              <div className="bg-gray-100 p-4 rounded mb-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p className="text-gray-600">IMEI:</p>
                  <p className="font-medium break-all">{device.imei}</p>
                  
                  {device.imei2 && (
                    <>
                      <p className="text-gray-600">IMEI2:</p>
                      <p className="font-medium break-all">{device.imei2}</p>
                    </>
                  )}
                  
                  <p className="text-gray-600">Seriennummer:</p>
                  <p className="font-medium break-all">{device.serial}</p>
                  
                  <p className="text-gray-600">Modell:</p>
                  <p className="font-medium">{device.model}</p>
                  
                  <p className="text-gray-600">Status:</p>
                  <div>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColorMap[device.status] || 'bg-gray-100 text-gray-800'}`}>
                      {getStatusLabel(device.status)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600">Garantiestatus:</p>
                  <p className="font-medium">{device.warrantyStatus}</p>
                  
                  <p className="text-gray-600">Blockierung:</p>
                  <p className={`font-medium ${device.usaBlockStatus === 'Clean' ? 'text-green-600' : 'text-red-600'}`}>
                    {device.usaBlockStatus}
                  </p>
                  
                  <p className="text-gray-600">SIM-Lock:</p>
                  <p className={`font-medium ${!device.simLock ? 'text-green-600' : 'text-red-600'}`}>
                    {!device.simLock ? 'Entsperrt' : 'Gesperrt'}
                  </p>
                  
                  <p className="text-gray-600">Find My iPhone:</p>
                  <p className={`font-medium ${!device.fmiOn ? 'text-green-600' : 'text-red-600'}`}>
                    {!device.fmiOn ? 'Aus' : 'An'}
                  </p>
                </div>
              </div>
              
              {/* Status Change Buttons */}
              <div className="mb-4">
                <h4 className="font-semibold mb-3">Status ändern</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['gekauft', 'in_reparatur', 'verkaufsbereit', 'zum_verkauf', 'verkauft'].map(st => (
                    <button
                      key={st}
                      className={`px-3 py-2 rounded text-sm font-medium transition duration-200 ${
                        device.status === st ? statusActiveColorMap[st] : statusInactiveColorMap[st]
                      } ${
                        // NEU: Visueller Hinweis für Qualitätsprüfung
                        st === 'verkaufsbereit' && device.status === 'in_reparatur' 
                          ? 'ring-2 ring-green-300 ring-opacity-50' 
                          : ''
                      }`}
                      onClick={() => handleStatusChange(st)}
                      title={
                        st === 'verkaufsbereit' && device.status === 'in_reparatur'
                          ? 'Qualitätsprüfung erforderlich'
                          : ''
                      }
                    >
                      {st === 'verkaufsbereit' && device.status === 'in_reparatur' ? (
                        <span className="flex items-center">
                          🔍 {getStatusLabel(st)}
                        </span>
                      ) : (
                        getStatusLabel(st)
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details & Parts */}
          <div className="space-y-6">
            {/* Purchase Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">Kaufdetails & Reparatur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Einkaufspreis (€)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Schadensbeschreibung
                  </label>
                  <textarea
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Gewünschter Gewinn (€)
                  </label>
                  <input
                    type="number"
                    value={desiredProfit}
                    onChange={(e) => setDesiredProfit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Parts Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h4 className="font-semibold mb-4">Ersatzteile</h4>
              
              {/* Selected Parts */}
              <div className="mb-4">
                <h5 className="font-medium mb-2">Ausgewählte Ersatzteile</h5>
                {selectedParts.length === 0 ? (
                  <p className="text-gray-500 text-sm">Keine Ersatzteile ausgewählt</p>
                ) : (
                  <div className="bg-gray-50 p-3 rounded max-h-32 overflow-y-auto">
                    {selectedParts.map((part, index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b last:border-0">
                        <span className="text-sm">{part.partNumber}</span>
                        <div className="flex items-center">
                          <span className="mr-2 text-sm">{part.price?.toFixed(2)} €</span>
                          <button
                            onClick={() => handleRemovePart(part.partNumber)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Parts Filter and Search */}
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                  <select 
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="compatible">Nur kompatible</option>
                    <option value="all">Alle Teile</option>
                  </select>
                  
                  <select 
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Alle Kategorien</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  
                  <input 
                    type="text"
                    placeholder="Suche..."
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {/* Available Parts */}
                <h5 className="font-medium mb-2">Verfügbare Ersatzteile</h5>
                {filteredParts.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Keine Ersatzteile gefunden.
                  </p>
                ) : (
                  <div className="bg-gray-50 p-2 rounded max-h-40 overflow-y-auto">
                    {filteredParts.slice(0, 10).map(part => {
                      const isSelected = selectedParts.some(p => p.partNumber === part.partNumber);
                      const isInStock = typeof part.stock === 'number' ? part.stock > 0 : true;
                      return (
                        <div key={part._id} className="flex justify-between items-center py-1 border-b last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className="font-medium text-sm truncate">{part.partNumber}</p>
                              {isInStock ? (
                                <span className="ml-2 text-green-600 text-xs">✓</span>
                              ) : (
                                <span className="ml-2 text-red-500 text-xs">✗</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">{part.description}</p>
                          </div>
                          <div className="flex items-center ml-2">
                            <span className="mr-2 text-sm">{part.price?.toFixed(2)} €</span>
                            <button
                              onClick={() => handleAddPart(part)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              disabled={isSelected}
                            >
                              {isSelected ? '✓' : '+'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Cost Overview */}
            <div className="bg-blue-50 rounded-lg shadow-md p-6">
              <h4 className="font-semibold mb-4">Kostenübersicht</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Einkaufspreis:</span>
                  <span className="font-medium">{parseFloat(purchasePrice).toFixed(2)} €</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Ersatzteile:</span>
                  <span className="font-medium">{calculateTotalPartsPrice().toFixed(2)} €</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Gewünschter Gewinn:</span>
                  <span className="font-medium">{parseFloat(desiredProfit).toFixed(2)} €</span>
                </div>
                
                <div className="flex justify-between pt-2 border-t border-blue-200">
                  <span className="text-gray-700 font-bold">Kalkulierter Verkaufspreis:</span>
                  <span className="font-bold text-blue-700">{calculateSellingPrice().toFixed(2)} €</span>
                </div>
                
                {device.status === 'verkauft' && device.actualSellingPrice && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-bold">Tatsächlicher Verkaufspreis:</span>
                      <span className="font-bold text-purple-700">{parseFloat(device.actualSellingPrice).toFixed(2)} €</span>
                    </div>
                    
                    <div className="bg-gray-100 p-3 rounded mt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm text-gray-500">Gewünscht</span>
                          <p className="font-bold text-gray-700">{parseFloat(desiredProfit).toFixed(2)} €</p>
                        </div>
                        
                        <div className="text-center">
                          {(() => {
                            const diff = calculateActualProfit() - parseFloat(desiredProfit);
                            const isPositive = diff >= 0;
                            return (
                              <>
                                <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                  {isPositive ? '+' : ''}{diff.toFixed(2)} €
                                </span>
                                <div className="flex justify-center mt-1">
                                  <span className={`inline-block w-5 h-5 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'} 
                                    flex items-center justify-center`}>
                                    <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                      {isPositive ? '▲' : '▼'}
                                    </span>
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        
                        <div className="text-right">
                          <span className="text-sm text-gray-500">Tatsächlich</span>
                          <p className="font-bold text-green-600">{calculateActualProfit().toFixed(2)} €</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSaveChanges}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
              >
                Änderungen speichern
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Section-based */}
        <div className="block lg:hidden">
          {/* Device Info Section */}
          {activeSection === 'info' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">📱 Geräteinformationen</h3>
              
              {device.thumbnail && (
                <div className="mb-4 text-center">
                  <img 
                    src={device.thumbnail} 
                    alt={device.model} 
                    className="max-w-xs mx-auto"
                  />
                </div>
              )}
              
              <div className="space-y-3 mb-6">
                {[
                  { label: 'IMEI', value: device.imei },
                  { label: 'IMEI2', value: device.imei2 },
                  { label: 'Seriennummer', value: device.serial },
                  { label: 'Modell', value: device.model },
                  { label: 'Garantiestatus', value: device.warrantyStatus },
                  { label: 'Blockierung', value: device.usaBlockStatus, color: device.usaBlockStatus === 'Clean' ? 'text-green-600' : 'text-red-600' },
                  { label: 'SIM-Lock', value: !device.simLock ? 'Entsperrt' : 'Gesperrt', color: !device.simLock ? 'text-green-600' : 'text-red-600' },
                  { label: 'Find My iPhone', value: !device.fmiOn ? 'Aus' : 'An', color: !device.fmiOn ? 'text-green-600' : 'text-red-600' }
                ].filter(item => item.value).map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600">{item.label}:</span>
                    <span className={`text-sm font-medium break-all text-right ${item.color || 'text-gray-900'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColorMap[device.status] || 'bg-gray-100 text-gray-800'}`}>
                    {getStatusLabel(device.status)}
                  </span>
                </div>
              </div>
              
              {/* Status Change Buttons - Mobile */}
              <div>
                <h4 className="font-semibold mb-3">Status ändern</h4>
                <div className="grid grid-cols-2 gap-2">
                  {['gekauft', 'in_reparatur', 'verkaufsbereit', 'zum_verkauf', 'verkauft'].map(st => (
                    <button
                      key={st}
                      className={`px-3 py-2 rounded text-sm font-medium transition duration-200 ${
                        device.status === st ? statusActiveColorMap[st] : statusInactiveColorMap[st]
                      } ${
                        // NEU: Visueller Hinweis für Qualitätsprüfung - Mobile
                        st === 'verkaufsbereit' && device.status === 'in_reparatur' 
                          ? 'ring-2 ring-green-300 ring-opacity-50' 
                          : ''
                      }`}
                      onClick={() => handleStatusChange(st)}
                      title={
                        st === 'verkaufsbereit' && device.status === 'in_reparatur'
                          ? 'Qualitätsprüfung erforderlich'
                          : ''
                      }
                    >
                      {st === 'verkaufsbereit' && device.status === 'in_reparatur' ? (
                        <span className="flex items-center justify-center">
                          <span className="text-xs mr-1">🔍</span>
                          {getStatusLabel(st)}
                        </span>
                      ) : (
                        getStatusLabel(st)
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Parts Section */}
          {activeSection === 'parts' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">🔧 Ersatzteile & Reparatur</h3>
              
              {/* Purchase Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Einkaufspreis (€)
                  </label>
                  <input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Schadensbeschreibung
                  </label>
                  <textarea
                    value={damageDescription}
                    onChange={(e) => setDamageDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Beschreiben Sie die Schäden am Gerät..."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2 text-sm">
                    Gewünschter Gewinn (€)
                  </label>
                  <input
                    type="number"
                    value={desiredProfit}
                    onChange={(e) => setDesiredProfit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Selected Parts */}
              <div className="mb-6">
                <h4 className="font-medium mb-2">Ausgewählte Ersatzteile</h4>
                {selectedParts.length === 0 ? (
                  <p className="text-gray-500 text-sm bg-gray-50 p-3 rounded">Keine Ersatzteile ausgewählt</p>
                ) : (
                  <div className="space-y-2">
                    {selectedParts.map((part, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{part.partNumber}</p>
                          <p className="text-xs text-gray-600">Preis: {part.price?.toFixed(2)} €</p>
                        </div>
                        <button
                          onClick={() => handleRemovePart(part.partNumber)}
                          className="text-red-600 hover:text-red-800 p-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-sm font-medium text-blue-900">
                        Gesamtkosten Ersatzteile: {calculateTotalPartsPrice().toFixed(2)} €
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Parts Search */}
              <div className="mb-4">
                <button
                  onClick={() => setShowPartsSection(!showPartsSection)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded mb-3 flex items-center justify-center"
                >
                  {showPartsSection ? 'Teile-Suche ausblenden' : 'Ersatzteile hinzufügen'}
                  <svg className={`w-4 h-4 ml-2 transition-transform ${showPartsSection ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {showPartsSection && (
                  <div className="space-y-4">
                    {/* Filters */}
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        className="px-2 py-2 border border-gray-300 rounded text-sm"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <option value="compatible">Nur kompatible</option>
                        <option value="all">Alle Teile</option>
                      </select>
                      
                      <select 
                        className="px-2 py-2 border border-gray-300 rounded text-sm"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                      >
                        <option value="">Alle Kategorien</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    
                    <input 
                      type="text"
                      placeholder="Teilenummer oder Beschreibung suchen..."
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    
                    {/* Available Parts */}
                    <div>
                      <h5 className="font-medium mb-2">Verfügbare Ersatzteile</h5>
                      {filteredParts.length === 0 ? (
                        <p className="text-gray-500 text-sm bg-gray-50 p-3 rounded">
                          Keine Ersatzteile gefunden.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {filteredParts.slice(0, 20).map(part => {
                            const isSelected = selectedParts.some(p => p.partNumber === part.partNumber);
                            const isInStock = typeof part.stock === 'number' ? part.stock > 0 : true;
                            return (
                              <div key={part._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-sm truncate">{part.partNumber}</p>
                                    {part.category && (
                                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        {part.category}
                                      </span>
                                    )}
                                    <span className={`text-xs ${isInStock ? 'text-green-600' : 'text-red-500'}`}>
                                      {isInStock ? '✓' : '✗'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-600 truncate">{part.description}</p>
                                  <p className="text-xs text-gray-500">Für: {part.forModel}</p>
                                </div>
                                <div className="flex items-center ml-2">
                                  <span className="mr-2 text-sm font-medium">{part.price?.toFixed(2)} €</span>
                                  <button
                                    onClick={() => handleAddPart(part)}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                      isSelected 
                                        ? 'bg-green-100 text-green-600' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                    disabled={isSelected}
                                  >
                                    {isSelected ? '✓' : '+'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Costs Section */}
          {activeSection === 'costs' && (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4">💰 Kostenübersicht</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Einkaufspreis:</span>
                    <span className="font-medium">{parseFloat(purchasePrice).toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ersatzteile:</span>
                    <span className="font-medium">{calculateTotalPartsPrice().toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Gewünschter Gewinn:</span>
                    <span className="font-medium">{parseFloat(desiredProfit).toFixed(2)} €</span>
                  </div>
                  
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-bold">Kalkulierter Verkaufspreis:</span>
                      <span className="font-bold text-blue-700 text-lg">{calculateSellingPrice().toFixed(2)} €</span>
                    </div>
                  </div>
                  
                  {device.status === 'verkauft' && device.actualSellingPrice && (
                    <>
                      <div className="border-t border-blue-200 pt-3">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-700 font-bold">Tatsächlicher Verkaufspreis:</span>
                          <span className="font-bold text-purple-700 text-lg">{parseFloat(device.actualSellingPrice).toFixed(2)} €</span>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-gray-900 mb-3">Gewinnvergleich</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <span className="text-xs text-gray-500">Gewünscht</span>
                            <p className="font-bold text-gray-700">{parseFloat(desiredProfit).toFixed(2)} €</p>
                          </div>
                          
                          <div>
                            {(() => {
                              const diff = calculateActualProfit() - parseFloat(desiredProfit);
                              const isPositive = diff >= 0;
                              return (
                                <div>
                                  <span className="text-xs text-gray-500">Differenz</span>
                                  <p className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                    {isPositive ? '+' : ''}{diff.toFixed(2)} €
                                  </p>
                                  <div className="flex justify-center mt-1">
                                    <span className={`inline-block w-6 h-6 rounded-full ${isPositive ? 'bg-green-100' : 'bg-red-100'} 
                                      flex items-center justify-center`}>
                                      <span className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? '▲' : '▼'}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          <div>
                            <span className="text-xs text-gray-500">Tatsächlich</span>
                            <p className="font-bold text-green-600">{calculateActualProfit().toFixed(2)} €</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save Button - Always visible on mobile */}
          <div className="mt-6">
            <button
              onClick={handleSaveChanges}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium text-lg"
            >
              Änderungen speichern
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetails;