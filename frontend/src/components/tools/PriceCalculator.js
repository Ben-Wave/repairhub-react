import React, { useState, useEffect, useContext } from 'react';
import { PartsContext } from '../../context/PartsContext';
import { DeviceContext } from '../../context/DeviceContext';
import Spinner from '../layout/Spinner';
import Alert from '../layout/Alert';

const PriceCalculator = () => {
  const { parts, getParts, loading: partsLoading } = useContext(PartsContext);
  const { devices, getDevices, loading: devicesLoading } = useContext(DeviceContext);
  
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedParts, setSelectedParts] = useState([]);
  const [desiredProfit, setDesiredProfit] = useState(50); // Standard Gewinnmarge
  const [marketPrice, setMarketPrice] = useState(0);
  const [alert, setAlert] = useState(null);
  
  useEffect(() => {
    getParts();
    getDevices();
    // eslint-disable-next-line
  }, []);
  
  // Extrahiere eindeutige Modelle aus den Ersatzteilen
  const availableModels = [...new Set(parts.map(part => part.forModel))].sort();
  
  // Extrahiere Kategorien für das ausgewählte Modell
  const availableCategories = parts
    .filter(part => part.forModel === selectedModel)
    .map(part => part.category)
    .filter((category, index, self) => self.indexOf(category) === index)
    .sort();
  
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    setSelectedParts([]);
  };
  
  const handlePartToggle = (category) => {
    if (selectedParts.includes(category)) {
      setSelectedParts(selectedParts.filter(p => p !== category));
    } else {
      setSelectedParts([...selectedParts, category]);
    }
  };
  
  const calculateMaxPurchasePrice = () => {
    if (!selectedModel || selectedParts.length === 0) return 0;
    
    // Berechne Gesamtkosten der Ersatzteile
    const partsCost = parts
      .filter(part => part.forModel === selectedModel && selectedParts.includes(part.category))
      .reduce((total, part) => total + part.price, 0);
    
    // Maximaler Einkaufspreis = Marktpreis - Ersatzteilekosten - gewünschter Gewinn
    const maxPurchasePrice = marketPrice - partsCost - desiredProfit;
    
    return Math.max(0, maxPurchasePrice); // Nicht unter 0
  };
  
  const calculatePotentialProfit = (purchasePrice) => {
    if (!selectedModel || selectedParts.length === 0) return 0;
    
    const partsCost = parts
      .filter(part => part.forModel === selectedModel && selectedParts.includes(part.category))
      .reduce((total, part) => total + part.price, 0);
    
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
              Modell auswählen
            </label>
            <select
              value={selectedModel}
              onChange={handleModelChange}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen...</option>
              {availableModels.map(model => (
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
                      <label key={category} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={selectedParts.includes(category)}
                          onChange={() => handlePartToggle(category)}
                          className="mr-2"
                        />
                        <span>{category}</span>
                      </label>
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
            {selectedModel && selectedParts.length > 0 ? (
              <div>
                {parts
                  .filter(part => part.forModel === selectedModel && selectedParts.includes(part.category))
                  .map(part => (
                    <div key={part._id} className="flex justify-between mb-1">
                      <span>{part.category}</span>
                      <span>{part.price.toFixed(2)} €</span>
                    </div>
                  ))}
                <div className="border-t mt-2 pt-2 font-bold flex justify-between">
                  <span>Gesamt:</span>
                  <span>
                    {parts
                      .filter(part => part.forModel === selectedModel && selectedParts.includes(part.category))
                      .reduce((total, part) => total + part.price, 0)
                      .toFixed(2)} €
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Wählen Sie ein Modell und defekte Teile aus</p>
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
              <div>
                <p className="text-sm text-gray-600">Bei Einkauf für:</p>
                <p className="font-semibold">100 €</p>
                <p className="text-green-600">Gewinn: {calculatePotentialProfit(100).toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bei Einkauf für:</p>
                <p className="font-semibold">150 €</p>
                <p className="text-green-600">Gewinn: {calculatePotentialProfit(150).toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bei Einkauf für:</p>
                <p className="font-semibold">200 €</p>
                <p className="text-green-600">Gewinn: {calculatePotentialProfit(200).toFixed(2)} €</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bei Einkauf für:</p>
                <p className="font-semibold">250 €</p>
                <p className="text-green-600">Gewinn: {calculatePotentialProfit(250).toFixed(2)} €</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceCalculator;