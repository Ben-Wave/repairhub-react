import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { PartsContext } from '../../context/PartsContext';

const SyncSettings = () => {
  const [config, setConfig] = useState({
    syncEnabled: true,
    syncInterval: '0 0 * * *',
    autoUpdatePrices: true,
    addNewParts: true,
    categories: [],
    models: []
  });
  
  const [status, setStatus] = useState({
    lastSync: null,
    nextSync: null,
    isLoading: true,
    isSaving: false,
    isSyncing: false,
    error: null,
    successMessage: null
  });
  
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  const { getParts } = useContext(PartsContext);
  
  // Hole die aktuelle Konfiguration
  const fetchConfig = async () => {
    setStatus(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await axios.get('/api/sync/config');
      setConfig(response.data);
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: 'Fehler beim Laden der Synchronisationseinstellungen: ' + error.message 
      }));
    } finally {
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  // Hole den aktuellen Status
  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/sync/status');
      
      setStatus(prev => ({ 
        ...prev, 
        lastSync: response.data.lastSync ? new Date(response.data.lastSync) : null,
        nextSync: response.data.nextSync ? new Date(response.data.nextSync) : null
      }));
    } catch (error) {
      console.error('Fehler beim Abrufen des Synchronisationsstatus:', error);
    }
  };
  
  // Lade verfügbare Kategorien und Modelle
  const fetchCategoriesAndModels = async () => {
    try {
      const response = await axios.get('/api/foneday/products');
      
      const products = response.data.products || [];
      
      // Extrahiere einzigartige Kategorien
      const categories = [...new Set(products.map(product => product.category).filter(Boolean))];
      setAvailableCategories(categories.sort());
      
      // Extrahiere einzigartige Modellreihen (vereinfacht)
      const modelNames = [...new Set(products
        .map(product => {
          if (!product.suitable_for) return null;
          
          // Extrahiere die Modellreihe aus dem "suitable_for" Feld
          // z.B. "For Apple iPhone 12" -> "iPhone 12"
          const match = product.suitable_for.match(/(?:For\s+)?(?:\w+\s+)?(iPhone|Galaxy|Pixel|Xperia|Redmi|Mi|Note|Tab|P\d+|Mate|Nova)\s+\w+/i);
          return match ? match[0] : null;
        })
        .filter(Boolean))];
      
      setAvailableModels(modelNames.sort());
    } catch (error) {
      console.error('Fehler beim Abrufen der Kategorien und Modelle:', error);
    }
  };
  
  // Speichert die Konfiguration
  const saveConfig = async () => {
    setStatus(prev => ({ ...prev, isSaving: true, error: null, successMessage: null }));
    
    try {
      await axios.put('/api/sync/config', config);
      
      setStatus(prev => ({ 
        ...prev, 
        successMessage: 'Einstellungen erfolgreich gespeichert' 
      }));
      
      // Aktualisiere den Status nach dem Speichern
      fetchStatus();
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: 'Fehler beim Speichern der Einstellungen: ' + error.message 
      }));
    } finally {
      setStatus(prev => ({ ...prev, isSaving: false }));
      
      // Erfolgsbenachrichtigung nach 3 Sekunden ausblenden
      if (status.successMessage) {
        setTimeout(() => {
          setStatus(prev => ({ ...prev, successMessage: null }));
        }, 3000);
      }
    }
  };
  
  // Manuelle Synchronisation starten
  const startSync = async () => {
    setStatus(prev => ({ ...prev, isSyncing: true, error: null, successMessage: null }));
    
    try {
      await axios.post('/api/sync/run');
      
      setStatus(prev => ({ 
        ...prev, 
        successMessage: 'Synchronisation wurde gestartet' 
      }));
      
      // Aktualisiere die Teile nach erfolgreicher Synchronisation
      setTimeout(() => {
        getParts();
        fetchStatus();
      }, 5000); // Warte 5 Sekunden, damit die Synchronisation Zeit hat zu beginnen
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        error: 'Fehler beim Starten der Synchronisation: ' + error.message 
      }));
    } finally {
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };
  
  // Behandlung von Formularänderungen
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setConfig(prev => ({ ...prev, [name]: checked }));
    } else {
      setConfig(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Behandlung von Kategorie-Änderungen
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setConfig(prev => ({
        ...prev,
        categories: [...prev.categories, value]
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        categories: prev.categories.filter(category => category !== value)
      }));
    }
  };
  
  // Behandlung von Modell-Änderungen
  const handleModelChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setConfig(prev => ({
        ...prev,
        models: [...prev.models, value]
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        models: prev.models.filter(model => model !== value)
      }));
    }
  };
  
  // Lade Daten beim ersten Rendern
  useEffect(() => {
    fetchConfig();
    fetchStatus();
    fetchCategoriesAndModels();
  }, []);
  
  // Formatiere Datum für die Anzeige
  const formatDate = (date) => {
    if (!date) return 'Nie';
    
    return new Date(date).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header - Mobile optimized */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-2">🔄 Foneday Katalog-Synchronisation</h2>
          <p className="text-sm sm:text-base text-gray-600">Automatische Synchronisation mit dem Foneday Katalog verwalten</p>
        </div>
        
        {/* Alerts - Mobile optimized */}
        {status.error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg" role="alert">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <p className="text-sm sm:text-base">{status.error}</p>
            </div>
          </div>
        )}
        
        {status.successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-lg" role="alert">
            <div className="flex items-center">
              <span className="text-lg mr-2">✅</span>
              <p className="text-sm sm:text-base">{status.successMessage}</p>
            </div>
          </div>
        )}
        
        {/* Status Card - Mobile optimized */}
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            📊 Synchronisationsstatus
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">🕐</span>
                <p className="text-sm text-gray-500">Letzte Synchronisation</p>
              </div>
              <p className="font-medium text-sm sm:text-base">{formatDate(status.lastSync)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">⏰</span>
                <p className="text-sm text-gray-500">Nächste Synchronisation</p>
              </div>
              <p className="font-medium text-sm sm:text-base">{formatDate(status.nextSync)}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-lg mr-2">🚦</span>
                <p className="text-sm text-gray-500">Status</p>
              </div>
              <p className="font-medium">
                {config.syncEnabled ? (
                  <span className="text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Aktiviert
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                    Deaktiviert
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={startSync}
            disabled={status.isSyncing}
            className={`w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors font-medium ${
              status.isSyncing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {status.isSyncing ? (
              <span className="flex items-center justify-center">
                <span className="mr-2">⏳</span>
                Synchronisierung läuft...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span className="mr-2">🔄</span>
                Jetzt synchronisieren
              </span>
            )}
          </button>
        </div>
        
        {/* Settings Card - Mobile optimized */}
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            ⚙️ Einstellungen
          </h3>
          
          {status.isLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">⏳</div>
              <p className="text-gray-500">Einstellungen werden geladen...</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }} className="space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  🔧 Grundeinstellungen
                </h4>
                
                <div className="space-y-4">
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="syncEnabled"
                      checked={config.syncEnabled}
                      onChange={handleChange}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm sm:text-base font-medium">Automatische Synchronisation aktivieren</span>
                      <p className="text-xs sm:text-sm text-gray-500">Automatische Aktualisierung nach festgelegtem Zeitplan</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="autoUpdatePrices"
                      checked={config.autoUpdatePrices}
                      onChange={handleChange}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm sm:text-base font-medium">Preise automatisch aktualisieren</span>
                      <p className="text-xs sm:text-sm text-gray-500">Übernimmt neue Preise aus dem Foneday Katalog</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      name="addNewParts"
                      checked={config.addNewParts}
                      onChange={handleChange}
                      className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm sm:text-base font-medium">Neue Ersatzteile hinzufügen</span>
                      <p className="text-xs sm:text-sm text-gray-500">Fügt automatisch neue Artikel aus dem Katalog hinzu</p>
                    </div>
                  </label>
                </div>
              </div>
              
              {/* Sync Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ⏰ Synchronisationsintervall (Cron-Ausdruck)
                </label>
                <input
                  type="text"
                  name="syncInterval"
                  value={config.syncInterval}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0 0 * * *"
                />
                <div className="mt-2 text-xs sm:text-sm text-gray-500 space-y-1">
                  <p><strong>Standard:</strong> 0 0 * * * (Täglich um Mitternacht)</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      Weitere Beispiele anzeigen
                    </summary>
                    <div className="mt-2 pl-4 space-y-1">
                      <p>• 0 */6 * * * = Alle 6 Stunden</p>
                      <p>• 0 8 * * 1-5 = Wochentags um 8 Uhr</p>
                      <p>• 0 20 * * 0 = Sonntags um 20 Uhr</p>
                    </div>
                  </details>
                </div>
              </div>
              
              {/* Advanced Settings Toggle */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="flex items-center text-sm sm:text-base font-medium">
                    🔍 Erweiterte Filter-Einstellungen
                  </span>
                  <span className="text-gray-400">
                    {showAdvancedSettings ? '🔺' : '🔻'}
                  </span>
                </button>
                
                {showAdvancedSettings && (
                  <div className="mt-4 space-y-6">
                    {/* Categories Filter */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        🏷️ Nach Kategorien filtern
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 mb-3">
                        Wähle die Kategorien aus, die synchronisiert werden sollen (leer = alle)
                      </p>
                      
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {availableCategories.map(category => (
                            <label key={category} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={category}
                                checked={config.categories.includes(category)}
                                onChange={handleCategoryChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm truncate" title={category}>
                                {category}
                              </span>
                            </label>
                          ))}
                        </div>
                        {availableCategories.length === 0 && (
                          <p className="text-gray-400 text-center py-4">
                            Keine Kategorien verfügbar
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Models Filter */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center">
                        📱 Nach Modellen filtern
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 mb-3">
                        Wähle die Modelle aus, die synchronisiert werden sollen (leer = alle)
                      </p>
                      
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {availableModels.map(model => (
                            <label key={model} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={model}
                                checked={config.models.includes(model)}
                                onChange={handleModelChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm truncate" title={model}>
                                {model}
                              </span>
                            </label>
                          ))}
                        </div>
                        {availableModels.length === 0 && (
                          <p className="text-gray-400 text-center py-4">
                            Keine Modelle verfügbar
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Save Button */}
              <div className="border-t border-gray-200 pt-6">
                <button
                  type="submit"
                  disabled={status.isSaving}
                  className={`w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors font-medium ${
                    status.isSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {status.isSaving ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">⏳</span>
                      Speichern...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">💾</span>
                      Einstellungen speichern
                    </span>
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

export default SyncSettings;