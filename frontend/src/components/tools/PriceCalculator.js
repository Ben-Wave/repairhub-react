import React, { useState, useEffect, useContext } from 'react';
import { PartsContext } from '../../context/PartsContext';
import { DeviceContext } from '../../context/DeviceContext';
import Spinner from '../layout/Spinner';
import Alert from '../layout/Alert';

const PriceCalculator = () => {
  const { parts, getParts, loading: partsLoading } = useContext(PartsContext);
  const { devices, getDevices, loading: devicesLoading } = useContext(DeviceContext);

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
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    getParts();
    getDevices();
    // eslint-disable-next-line
  }, []);

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

  if (partsLoading || devicesLoading) {
    return <Spinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">Einkaufspreisrechner</h2>

      {alert && (
        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Gerätekonfiguration</h3>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Hersteller auswählen
            </label>
            <select
              value={selectedManufacturer}
              onChange={e => {
                setSelectedManufacturer(e.target.value);
                setSelectedModel('');
                setSelectedPartsByCategory({});
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle</option>
              {availableManufacturers.map(manufacturer => (
                <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
              Modell auswählen
            </label>
            <select
              value={selectedModel}
              onChange={handleModelChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen...</option>
              {filteredModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>

          {selectedModel && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Defekte Teile auswählen
                </label>
                <div className="border rounded p-4 max-h-60 overflow-y-auto">
                  {availableCategories.length === 0 ? (
                    <p className="text-gray-500">Keine Ersatzteile für dieses Modell verfügbar</p>
                  ) : (
                    availableCategories.map(category => (
                      <div key={category} className="mb-3">
                        <div className="font-semibold mb-1">{category}</div>
                        {partsByCategory[category].map(part => (
                          <label key={part._id} className="flex items-center mb-1 ml-2">
                            <input
                              type="checkbox"
                              checked={(selectedPartsByCategory[category] || []).includes(part._id)}
                              onChange={() => handlePartToggle(category, part._id)}
                              className="mr-2"
                            />
                            <span>
                              {part.description} ({part.price.toFixed(2)} €)
                            </span>
                          </label>
                        ))}
                      </div>
                    ))
                  )}
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
                />
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Kalkulation</h3>

          <div className="bg-gray-100 p-4 rounded mb-4">
            <h4 className="font-semibold mb-2">Ersatzteilkosten</h4>
            {selectedModel && Object.values(selectedPartsByCategory).flat().length > 0 ? (
              <div>
                {Object.entries(selectedPartsByCategory).map(([category, ids]) =>
                  ids.map(id => {
                    const part = parts.find(p => p._id === id);
                    if (!part) return null;
                    return (
                      <div key={id} className="flex justify-between mb-1">
                        <span>{category}: {part.description}</span>
                        <span>{part.price.toFixed(2)} €</span>
                      </div>
                    );
                  })
                )}
                <div className="border-t mt-2 pt-2 font-bold flex justify-between">
                  <span>Gesamt:</span>
                  <span>
                    {calculatePartsCost().toFixed(2)} €
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Wählen Sie ein Modell und Ersatzteile aus</p>
            )}
          </div>

          <div className="bg-blue-100 p-4 rounded mb-4">
            <h4 className="font-semibold mb-2">Maximaler Einkaufspreis</h4>
            <p className="text-3xl font-bold text-blue-700">
              {calculateMaxPurchasePrice().toFixed(2)} €
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Basierend auf: Marktpreis ({marketPrice.toFixed(2)} €) - Ersatzteile - Gewinn ({desiredProfit.toFixed(2)} €)
            </p>
          </div>

          <div className="bg-green-100 p-4 rounded">
            <h4 className="font-semibold mb-2">Gewinnkalkulation</h4>
            <div className="grid grid-cols-2 gap-4">
              {[100, 150, 200, 250].map(price => (
                <div key={price}>
                  <p className="text-sm text-gray-600">Bei Einkauf für:</p>
                  <p className="font-semibold">{price} €</p>
                  <p className="text-green-600">Gewinn: {calculatePotentialProfit(price).toFixed(2)} €</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;