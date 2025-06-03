// frontend/src/components/tools/PriceCalculator.js - DROPDOWN PROBLEM BEHOBEN
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PriceCalculator = () => {
  const [parts, setParts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Hersteller extrahieren
  const availableManufacturers = [...new Set(parts.map(part => {
    const match = part.forModel.match(/^[A-Za-z]+/);
    return match ? match[0] : 'Sonstige';
  }))].sort();

  // Standardwert für Hersteller: "iPhone"
  const [selectedManufacturer, setSelectedManufacturer] = useState('iPhone');
  const [selectedModel, setSelectedModel] = useState('');
  // Map: { [category]: [part._id, ...] }
  const [selectedPartsByCategory, setSelectedPartsByCategory] = useState({});
  const [desiredProfit, setDesiredProfit] = useState(50);
  const [marketPrice, setMarketPrice] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      // Verwende spezielle Calculator-API für Parts
      const partsResponse = await axios.get('/api/calculator/parts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setParts(partsResponse.data);

      // Versuche Geräte zu laden, aber fange Fehler ab falls keine Berechtigung
      try {
        const devicesResponse = await axios.get('/api/devices', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDevices(devicesResponse.data);
      } catch (deviceError) {
        // Ignoriere Fehler - Calculator-Only User haben keine Geräteberechtigung
        console.log('Keine Geräte-Berechtigung für Calculator-Only User');
        setDevices([]);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      setAlert({
        type: 'error',
        message: 'Fehler beim Laden der Daten'
      });
    } finally {
      setLoading(false);
    }
  };

  // Modelle extrahieren
  const availableModels = [...new Set(parts.map(part => part.forModel))].sort();

  // Modelle für gewählten Hersteller
  const filteredModels = selectedManufacturer
    ? [...new Set(parts.filter(part => part.forModel.startsWith(selectedManufacturer)).map(part => part.forModel))].sort()
    : availableModels;

  // Kategorien für das gewählte Modell
  const availableCategories = parts
    .filter(part => part.forModel === selectedModel)
    .map(part => part.category)
    .filter((category, idx, arr) => arr.indexOf(category) === idx)
    .sort();

  // Teile pro Kategorie für das gewählte Modell
  const partsByCategory = {};
  availableCategories.forEach(category => {
    partsByCategory[category] = parts.filter(
      part => part.forModel === selectedModel && part.category === category
    );
  });

  // Handler für Modellwechsel
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    setSelectedPartsByCategory({});
  };

  // Handler für Auswahl eines Teils in einer Kategorie
  const handlePartToggle = (category, partId) => {
    setSelectedPartsByCategory(prev => {
      const prevSelected = prev[category] || [];
      if (prevSelected.includes(partId)) {
        // Entfernen
        return { ...prev, [category]: prevSelected.filter(id => id !== partId) };
      } else {
        // Hinzufügen
        return { ...prev, [category]: [...prevSelected, partId] };
      }
    });
  };

  // Gesamtkosten der gewählten Teile berechnen
  const calculatePartsCost = () => {
    let total = 0;
    Object.entries(selectedPartsByCategory).forEach(([category, ids]) => {
      ids.forEach(id => {
        const part = parts.find(p => p._id === id);
        if (part) total += part.price;
      });
    });
    return total;
  };

  // Maximaler Einkaufspreis
  const calculateMaxPurchasePrice = () => {
    if (!selectedModel || Object.values(selectedPartsByCategory).flat().length === 0) return 0;
    const partsCost = calculatePartsCost();
    const maxPurchasePrice = marketPrice - partsCost - desiredProfit;
    return Math.max(0, maxPurchasePrice);
  };

  // Gewinnkalkulation für Beispiel-Einkaufspreise
  const calculatePotentialProfit = (purchasePrice) => {
    if (!selectedModel || Object.values(selectedPartsByCategory).flat().length === 0) return 0;
    const partsCost = calculatePartsCost();
    return marketPrice - purchasePrice - partsCost;
  };

  // Erweiterte Preisanalyse basierend auf ähnlichen Geräten (falls verfügbar)
  const getSimilarDevicePrices = () => {
    if (!devices.length || !selectedModel) return [];
    
    const similarDevices = devices.filter(device => 
      device.model && device.model.includes(selectedModel.split(' ')[0]) &&
      device.status === 'verkauft' &&
      device.actualSellingPrice
    );

    return similarDevices.map(device => ({
      model: device.model,
      sellingPrice: device.actualSellingPrice,
      purchasePrice: device.purchasePrice,
      profit: device.actualSellingPrice - device.purchasePrice - (device.parts?.reduce((sum, part) => sum + part.price, 0) || 0)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const similarDevices = getSimilarDevicePrices();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">🧮 Einkaufspreisrechner</h2>

      {alert && (
        <div className={`p-4 rounded-md mb-6 ${alert.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`}>
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm">{alert.message}</p>
            </div>
            <div className="ml-auto pl-3">
              <button onClick={() => setAlert(null)} className="text-lg font-bold">&times;</button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">📱 Gerätekonfiguration</h3>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Hersteller auswählen
            </label>
            <div className="relative">
              <select
                value={selectedManufacturer}
                onChange={e => {
                  setSelectedManufacturer(e.target.value);
                  setSelectedModel('');
                  setSelectedPartsByCategory({});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-10"
              >
                <option value="">Alle</option>
                {availableManufacturers.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Modell auswählen
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-10"
              >
                <option value="">Bitte wählen...</option>
                {filteredModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedModel && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Defekte Teile auswählen
                </label>
                {/* DROPDOWN-FIX: Container ohne max-height für bessere Darstellung */}
                <div className="border rounded p-4 bg-gray-50 relative">
                  <div className="max-h-80 overflow-y-auto">
                    {availableCategories.length === 0 ? (
                      <p className="text-gray-500">Keine Ersatzteile für dieses Modell verfügbar</p>
                    ) : (
                      availableCategories.map(category => (
                        <div key={category} className="mb-4 last:mb-0">
                          <div className="font-semibold mb-3 text-blue-800 border-b border-blue-200 pb-1">
                            {category}
                          </div>
                          <div className="space-y-2">
                            {partsByCategory[category].map(part => (
                              <label key={part._id} className="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                                <input
                                  type="checkbox"
                                  checked={(selectedPartsByCategory[category] || []).includes(part._id)}
                                  onChange={() => handlePartToggle(category, part._id)}
                                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">{part.description}</div>
                                  <div className="text-sm text-gray-500">Teil-Nr: {part.partNumber}</div>
                                  <div className="text-lg font-bold text-green-600">{part.price.toFixed(2)} €</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Erwarteter Marktpreis (€)
                </label>
                <input
                  type="number"
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="10"
                  placeholder="z.B. 350"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Gewünschter Gewinn (€)
                </label>
                <input
                  type="number"
                  value={desiredProfit}
                  onChange={(e) => setDesiredProfit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="10"
                  placeholder="z.B. 50"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">💰 Kalkulation</h3>

          <div className="bg-gray-100 p-4 rounded mb-4">
            <h4 className="font-semibold mb-2">🔧 Ersatzteilkosten</h4>
            {selectedModel && Object.values(selectedPartsByCategory).flat().length > 0 ? (
              <div>
                {Object.entries(selectedPartsByCategory).map(([category, ids]) =>
                  ids.map(id => {
                    const part = parts.find(p => p._id === id);
                    if (!part) return null;
                    return (
                      <div key={id} className="flex justify-between mb-1 py-1">
                        <span className="text-sm">
                          <span className="font-medium">{category}:</span> {part.description}
                        </span>
                        <span className="font-bold">{part.price.toFixed(2)} €</span>
                      </div>
                    );
                  })
                )}
                <div className="border-t mt-2 pt-2 font-bold flex justify-between text-lg">
                  <span>Gesamt:</span>
                  <span className="text-blue-600">
                    {calculatePartsCost().toFixed(2)} €
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Wählen Sie ein Modell und Ersatzteile aus</p>
            )}
          </div>

          <div className="bg-blue-100 p-4 rounded mb-4">
            <h4 className="font-semibold mb-2">🎯 Maximaler Einkaufspreis</h4>
            <p className="text-4xl font-bold text-blue-700 mb-2">
              {calculateMaxPurchasePrice().toFixed(2)} €
            </p>
            <p className="text-sm text-blue-600">
              Berechnung: {marketPrice.toFixed(2)} € (Marktpreis) - {calculatePartsCost().toFixed(2)} € (Teile) - {desiredProfit.toFixed(2)} € (Gewinn)
            </p>
          </div>

          <div className="bg-green-100 p-4 rounded mb-4">
            <h4 className="font-semibold mb-2">📊 Gewinnkalkulation</h4>
            <div className="grid grid-cols-2 gap-3">
              {[100, 150, 200, 250].map(price => (
                <div key={price} className="bg-white p-3 rounded">
                  <p className="text-xs text-gray-600">Einkauf für:</p>
                  <p className="font-semibold text-lg">{price} €</p>
                  <p className={`text-sm font-bold ${calculatePotentialProfit(price) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Gewinn: {calculatePotentialProfit(price).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Marktdaten falls verfügbar */}
          {similarDevices.length > 0 && (
            <div className="bg-yellow-100 p-4 rounded">
              <h4 className="font-semibold mb-2">📈 Ähnliche verkaufte Geräte</h4>
              <div className="text-sm space-y-1">
                {similarDevices.slice(0, 3).map((device, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{device.model}</span>
                    <span className="font-bold">{device.sellingPrice}€ (Gewinn: {device.profit.toFixed(0)}€)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;