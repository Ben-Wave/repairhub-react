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
  
  const { device, loading, error, getDevice, updateDevice, deleteDevice, getStats } = useContext(DeviceContext);
  const { parts, getParts } = useContext(PartsContext);
  
  const [alert, setAlert] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [damageDescription, setDamageDescription] = useState('');
  const [desiredProfit, setDesiredProfit] = useState(0);
  const [filterType, setFilterType] = useState('compatible'); // 'compatible', 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  
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
  
  useEffect(() => {
    if (typeof getDevice === 'function') {
      getDevice(id);
    }
    // eslint-disable-next-line
  }, [id]);
  
  useEffect(() => {
    if (typeof getParts === 'function') {
      getParts(); // Lade alle Ersatzteile
    }
    // eslint-disable-next-line
  }, []);
  
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
      } else {
        await updateDevice(id, { status: newStatus });
        if (typeof getStats === 'function') {
          getStats(); // Aktualisiere die Statistiken
        }
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
      
      // Statistiken aktualisieren
      if (typeof getStats === 'function') {
        getStats();
      }
      
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
  
  if (loading || !device) {
    return <Spinner />;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
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
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">
          Gerät: {device.modelDesc || device.model}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => navigate('/devices')}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Zurück
          </button>
          <button
            onClick={handleDeleteDevice}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Löschen
          </button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-3">Geräteinformationen</h3>
          
          {device.thumbnail && (
            <div className="mb-4">
              <img 
                src={device.thumbnail} 
                alt={device.model} 
                className="max-w-xs mx-auto"
              />
            </div>
          )}
          
          <div className="bg-gray-100 p-4 rounded mb-4">
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-600">IMEI:</p>
              <p className="font-medium">{device.imei}</p>
              
              {device.imei2 && (
                <>
                  <p className="text-gray-600">IMEI2:</p>
                  <p className="font-medium">{device.imei2}</p>
                </>
              )}
              
              <p className="text-gray-600">Seriennummer:</p>
              <p className="font-medium">{device.serial}</p>
              
              <p className="text-gray-600">Modell:</p>
              <p className="font-medium">{device.model}</p>
              
              <p className="text-gray-600">Status:</p>
              <div>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium 
                  ${device.status === 'gekauft' ? 'bg-blue-100 text-blue-800' : 
                    device.status === 'in_reparatur' ? 'bg-yellow-100 text-yellow-800' :
                    device.status === 'zum_verkauf' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'}`}>
                  {device.status === 'gekauft' ? 'Gekauft' :
                   device.status === 'in_reparatur' ? 'In Reparatur' :
                   device.status === 'zum_verkauf' ? 'Zum Verkauf' :
                   'Verkauft'}
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
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Status ändern</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusChange('gekauft')}
                className={`px-3 py-1 rounded ${device.status === 'gekauft' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800'}`}
              >
                Gekauft
              </button>
              <button
                onClick={() => handleStatusChange('in_reparatur')}
                className={`px-3 py-1 rounded ${device.status === 'in_reparatur' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'}`}
              >
                In Reparatur
              </button>
              <button
                onClick={() => handleStatusChange('zum_verkauf')}
                className={`px-3 py-1 rounded ${device.status === 'zum_verkauf' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800'}`}
              >
                Zum Verkauf
              </button>
              <button
                onClick={() => handleStatusChange('verkauft')}
                className={`px-3 py-1 rounded ${device.status === 'verkauft' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-800'}`}
              >
                Verkauft
              </button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-3">Kaufdetails & Reparatur</h3>
          
          <div className="bg-gray-100 p-4 rounded mb-4">
            <div className="mb-4">
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
            
            <div className="mb-4">
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
            
            <div className="mb-4">
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
          
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Ersatzteile</h4>
            
            <div className="mb-4">
              <h5 className="font-medium mb-2">Ausgewählte Ersatzteile</h5>
              {selectedParts.length === 0 ? (
                <p className="text-gray-500">Keine Ersatzteile ausgewählt</p>
              ) : (
                <ul className="bg-gray-50 p-2 rounded">
                  {selectedParts.map((part, index) => (
                    <li key={index} className="flex justify-between items-center py-1 border-b last:border-0">
                      <span>{part.partNumber}</span>
                      <div className="flex items-center">
                        <span className="mr-2">{part.price?.toFixed(2)} €</span>
                        <button
                          onClick={() => handleRemovePart(part.partNumber)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="mb-4">
              <div className="bg-gray-100 p-3 rounded mb-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Filter-Typen */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Teile anzeigen</label>
                    <select 
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="compatible">Nur kompatible Teile</option>
                      <option value="all">Alle Teile</option>
                    </select>
                  </div>
                  
                  {/* Kategoriefilter */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Kategorie</label>
                    <select 
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="">Alle Kategorien</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Suchfeld */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Suche</label>
                    <input 
                      type="text"
                      placeholder="Teilenummer oder Beschreibung..."
                      className="w-full px-2 py-1 border border-gray-300 rounded"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <h5 className="font-medium mb-2">Verfügbare Ersatzteile</h5>
              {filteredParts.length === 0 ? (
                <p className="text-gray-500">
                  Keine Ersatzteile gefunden, die den Filterkriterien entsprechen.
                </p>
              ) : (
                <div className="bg-gray-50 p-2 rounded max-h-60 overflow-y-auto">
                  {filteredParts.map(part => (
                    <div key={part._id} className="flex justify-between items-center py-1 border-b last:border-0">
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium">{part.partNumber}</p>
                          {part.category && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {part.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{part.description}</p>
                        <p className="text-xs text-gray-500">Für: {part.forModel}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">{part.price?.toFixed(2)} €</span>
                        <button
                          onClick={() => handleAddPart(part)}
                          className="text-blue-600 hover:text-blue-800"
                          disabled={selectedParts.some(p => p.partNumber === part.partNumber)}
                        >
                          {selectedParts.some(p => p.partNumber === part.partNumber) ? '✓' : '+'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded mb-4">
            <h4 className="font-semibold mb-2">Kostenübersicht</h4>
            <div className="grid grid-cols-2 gap-2">
              <p className="text-gray-600">Einkaufspreis:</p>
              <p className="font-medium text-right">{parseFloat(purchasePrice).toFixed(2)} €</p>
              
              <p className="text-gray-600">Ersatzteile:</p>
              <p className="font-medium text-right">{calculateTotalPartsPrice().toFixed(2)} €</p>
              
              <p className="text-gray-600">Gewünschter Gewinn:</p>
              <p className="font-medium text-right">{parseFloat(desiredProfit).toFixed(2)} €</p>
              
              <p className="text-gray-700 font-bold">Kalkulierter Verkaufspreis:</p>
              <p className="font-bold text-right text-blue-700">{calculateSellingPrice().toFixed(2)} €</p>
              
              {device.status === 'verkauft' && device.actualSellingPrice && (
                <>
                  <p className="text-gray-700 font-bold">Tatsächlicher Verkaufspreis:</p>
                  <p className="font-bold text-right text-purple-700">{parseFloat(device.actualSellingPrice).toFixed(2)} €</p>
                  
                  <p className="text-gray-700 font-bold">Gewinnvergleich:</p>
                  <p className="text-right">-</p>
                  
                  {/* Visuelle Gegenüberstellung des Gewinns */}
                  <div className="col-span-2 bg-gray-100 p-3 rounded mt-2">
                    <div className="flex justify-between items-center mb-2">
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
          
          <div className="flex justify-end">
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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