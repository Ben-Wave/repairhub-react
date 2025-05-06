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
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Foneday Katalog-Synchronisation</h2>
      
      {status.error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{status.error}</p>
        </div>
      )}
      
      {status.successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4" role="alert">
          <p>{status.successMessage}</p>
        </div>
      )}
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Synchronisationsstatus</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500 mb-1">Letzte Synchronisation</p>
            <p className="font-medium">{formatDate(status.lastSync)}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500 mb-1">Nächste Synchronisation</p>
            <p className="font-medium">{formatDate(status.nextSync)}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="font-medium">
              {config.syncEnabled ? (
                <span className="text-green-600">Aktiviert</span>
              ) : (
                <span className="text-red-600">Deaktiviert</span>
              )}
            </p>
          </div>
        </div>
        
        <button
          onClick={startSync}
          disabled={status.isSyncing}
          className={`w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
            status.isSyncing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {status.isSyncing ? 'Synchronisierung läuft...' : 'Jetzt synchronisieren'}
        </button>
      </div>
      
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Einstellungen</h3>
        
        {status.isLoading ? (
          <div className="text-center py-6">
            <div className="spinner-border" role="status">
              <span className="sr-only">Lädt...</span>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); saveConfig(); }}>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="syncEnabled"
                  checked={config.syncEnabled}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Automatische Synchronisation aktivieren</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Synchronisationsintervall (Cron-Ausdruck)
              </label>
              <input
                type="text"
                name="syncInterval"
                value={config.syncInterval}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="0 0 * * *"
              />
              <p className="text-sm text-gray-500 mt-1">
                Standard: 0 0 * * * (Täglich um Mitternacht)
              </p>
              <p className="text-sm text-gray-500">
                Weitere Beispiele: <br/>
                0 */6 * * * = Alle 6 Stunden <br/>
                0 8 * * 1-5 = Wochentags um 8 Uhr <br/>
                0 20 * * 0 = Sonntags um 20 Uhr
              </p>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="autoUpdatePrices"
                  checked={config.autoUpdatePrices}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Preise automatisch aktualisieren</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="addNewParts"
                  checked={config.addNewParts}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span>Neue Ersatzteile hinzufügen</span>
              </label>
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium mb-2">Nach Kategorien filtern</h4>
              <p className="text-sm text-gray-500 mb-2">
                Wähle die Kategorien aus, die synchronisiert werden sollen (leer = alle)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {availableCategories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      value={category}
                      checked={config.categories.includes(category)}
                      onChange={handleCategoryChange}
                      className="mr-2"
                    />
                    <span className="text-sm">{category}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium mb-2">Nach Modellen filtern</h4>
              <p className="text-sm text-gray-500 mb-2">
                Wähle die Modelle aus, die synchronisiert werden sollen (leer = alle)
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                {availableModels.map(model => (
                  <label key={model} className="flex items-center">
                    <input
                      type="checkbox"
                      value={model}
                      checked={config.models.includes(model)}
                      onChange={handleModelChange}
                      className="mr-2"
                    />
                    <span className="text-sm">{model}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              disabled={status.isSaving}
              className={`w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 ${
                status.isSaving ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {status.isSaving ? 'Speichern...' : 'Einstellungen speichern'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SyncSettings;