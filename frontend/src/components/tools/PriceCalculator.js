// frontend/src/components/tools/PriceCalculator.js - MOBILE OPTIMIERT + EU FILTER
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PriceCalculator = () => {
  const [parts, setParts] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Standardwert für Hersteller: "iPhone"
  const [selectedManufacturer, setSelectedManufacturer] = useState('iPhone');
  const [selectedModel, setSelectedModel] = useState('');
  // Map: { [category]: [part._id, ...] }
  const [selectedPartsByCategory, setSelectedPartsByCategory] = useState({});
  const [desiredProfit, setDesiredProfit] = useState(50);
  const [marketPrice, setMarketPrice] = useState(0);
  
  // NEU: Mobile UI State
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // EU-Filter für Backcover (immer aktiv)
  const onlyEuParts = true;

  // KORRIGIERT: getBaseModel Funktion AN DEN ANFANG verschoben
  const getBaseModel = (modelString) => {
    if (!modelString) return '';
    
    // Erweiterte Regex für bessere iPhone-Erkennung
    const modelRegex = /^(iPhone \d+(?:\s+(?:mini|Mini|Pro|Pro Max))?)/i;
    const modelMatch = modelString.match(modelRegex);
    
    if (modelMatch) {
      // Normalisiere das Ergebnis (einheitliche Schreibweise)
      return modelMatch[1]
        .replace(/\s+mini$/i, ' Mini')
        .replace(/\s+pro max$/i, ' Pro Max')
        .replace(/\s+pro$/i, ' Pro');
    }
    
    return '';
  };

  // NEU: Erweiterte Qualitäts-Extraktion (für Battery und Back Cover)
  const extractQuality = (description) => {
    if (!description) return 'Standard';
    
    const desc = description.toLowerCase();
    
    // Service Pack Varianten
    if (desc.includes('service pack (used message)')) return 'Service Pack (Used Message)';
    if (desc.includes('service pack')) return 'Service Pack';
    
    // Pulled Varianten
    if (desc.includes('pulled b')) return 'Pulled B';
    if (desc.includes('pulled')) return 'Pulled';
    
    // Refurbished
    if (desc.includes('refurbished')) return 'Refurbished';
    
    // OEM Varianten
    if (desc.includes('oem-equivalent (diagnosable)')) return 'OEM-Equivalent (Diagnosable)';
    if (desc.includes('oem-equivalent')) return 'OEM-Equivalent';
    if (desc.includes('oem')) return 'OEM';
    
    // High Capacity
    if (desc.includes('high capacity')) return 'High Capacity';
    
    // New
    if (desc.includes('new')) return 'New';
    
    // Without BMS/IC
    if (desc.includes('without bms/ic')) return 'Without BMS/IC';
    
    return 'Standard';
  };

  // NEU: Farb-Extraktion für Back Cover (wieder hinzugefügt)
  const extractColor = (description) => {
    if (!description) return 'Unknown';
    
    const desc = description.toLowerCase();
    if (desc.includes(' black')) return 'Black';
    if (desc.includes(' white')) return 'White';
    if (desc.includes(' red')) return 'Red';
    if (desc.includes(' blue')) return 'Blue';
    if (desc.includes(' green')) return 'Green';
    if (desc.includes(' purple')) return 'Purple';
    if (desc.includes(' yellow')) return 'Yellow';
    if (desc.includes(' pink')) return 'Pink';
    
    return 'Unknown';
  };

  // NEU: Erweiterte Beschreibungs-Extraktion für Battery
  const extractBatteryInfo = (description) => {
    if (!description) return 'Unknown';
    
    const desc = description.toLowerCase();
    
    // Spezielle Battery-Infos extrahieren
    if (desc.includes('high capacity')) {
      const capacityMatch = desc.match(/(\d+mah)/);
      return capacityMatch ? `High Capacity (${capacityMatch[1]})` : 'High Capacity';
    }
    
    if (desc.includes('without bms/ic')) return 'Without BMS/IC';
    if (desc.includes('diagnosable')) return 'Diagnosable';
    if (desc.includes('used message')) return 'Used Message';
    
    // Für Back Cover: Farbe extrahieren
    if (desc.includes(' black')) return 'Black';
    if (desc.includes(' white')) return 'White';
    if (desc.includes(' red')) return 'Red';
    if (desc.includes(' blue')) return 'Blue';
    if (desc.includes(' green')) return 'Green';
    if (desc.includes(' purple')) return 'Purple';
    if (desc.includes(' yellow')) return 'Yellow';
    if (desc.includes(' pink')) return 'Pink';
    
    return 'Standard';
  };

  // ERWEITERT: Verbesserte Modell-Kompatibilität (KORRIGIERT)
  const isModelCompatible = (part, selectedModel) => {
    if (!selectedModel || !part.forModel) return false;
    
    // Direkte Übereinstimmung zuerst
    if (part.forModel === selectedModel) return true;
    
    // Spezielle Behandlung für iPhone 12/12 Pro Kompatibilität
    const isDisplayPart = part.category?.toLowerCase().includes('display') || 
                          part.category?.toLowerCase().includes('screen') ||
                          part.description?.toLowerCase().includes('display');
    
    const isBatteryPart = part.category?.toLowerCase().includes('battery') ||
                          part.description?.toLowerCase().includes('battery');
    
    if (isDisplayPart || isBatteryPart) {
      if (selectedModel.includes('iPhone 12') && !selectedModel.includes('Pro')) {
        // iPhone 12 (nicht Pro) kann auch iPhone 12/12 Pro Displays UND Batterien verwenden
        if (part.forModel.includes('iPhone 12/12 Pro') || 
            part.forModel.includes('iPhone 12 Pro') ||
            part.description?.includes('iPhone 12/12 Pro')) {
          return true;
        }
      }
      
      if (selectedModel.includes('iPhone 12 Pro') && !selectedModel.includes('Pro Max')) {
        // iPhone 12 Pro kann auch iPhone 12/12 Pro Displays UND Batterien verwenden
        if (part.forModel.includes('iPhone 12/12 Pro') ||
            part.description?.includes('iPhone 12/12 Pro')) {
          return true;
        }
      }
    }
    
    // Für Back Cover: EXAKTE Modell-Übereinstimmung
    const isBackCover = part.category?.toLowerCase().includes('back cover') || 
                       part.category?.toLowerCase().includes('housing') ||
                       part.category?.toLowerCase().includes('rear housing');
    
    if (isBackCover) {
      // Für Back Cover: NUR exakte Übereinstimmung
      return part.forModel === selectedModel;
    }
    
    // Für ALLE anderen Teile: Basis-Modell Vergleich (wie vorher)
    const selectedBaseModel = getBaseModel(selectedModel);
    const partBaseModel = getBaseModel(part.forModel);
    
    return selectedBaseModel && partBaseModel && 
           selectedBaseModel.toLowerCase() === partBaseModel.toLowerCase();
  };
  // NEU: Kategorie-Filter für relevante Teile (KORRIGIERT - Battery erlaubt)
  const isRelevantCategory = (category) => {
    if (!category) return false;
    
    // Ausgeschlossene Kategorien (nicht relevant für Reparaturen)
    const excludedCategories = [
      'adapter',
      'airpods',
      'battery reader', // NUR "battery reader", NICHT "battery"!
      'booktypes case',
      'case friendly',
      'desk setups',
      'earphones',
      'edge to edge',
      'face id reader',
      'fan',
      'glass installation frame',
      'hardcase',
      'hdd sata cable',
      'headphone/mic',
      'heating pad',
      'integrated circuit (ic)',
      'keyboards',
      'lightning',
      'micro-usb',
      'privacy glass',
      'return key',
      'softcase',
      'soldering stencil/reballing',
      'stylus pen',
      'touchbar',
      'true tone reader',
      'usb-c',
      'uv glass'
    ];
    
    const categoryLower = category.toLowerCase();
    
    // SPEZIAL-BEHANDLUNG: "Battery Reader" ausschließen, aber "Battery" erlauben
    if (categoryLower === 'battery reader') return false;
    if (categoryLower === 'battery' || categoryLower.includes('battery (')) return true;
    
    return !excludedCategories.some(excluded => 
      categoryLower.includes(excluded) || excluded.includes(categoryLower)
    );
  };

  // NEU: Kategorie-Normalisierung (FIXIERT - Battery nicht normalisieren)
  const normalizeCategory = (category) => {
    if (!category) return category;
    
    const categoryLower = category.toLowerCase();
    
    // NUR für echte Duplikate normalisieren
    // Back Cover Varianten
    if (categoryLower.includes('rear housing (refurbished)')) {
      return 'Back Cover';
    }
    
    // Display Varianten (nur für echte Screen-Duplikate)
    if (categoryLower.includes('screen (refurbished)')) {
      return 'Display';
    }
    
    // Main/Display flex zu Display
    if (categoryLower === 'main/display flex') {
      return 'Display';
    }
    
    // WICHTIG: Battery-Kategorien NICHT normalisieren!
    // "Battery" und "Battery (Service Pack)" bleiben getrennt
    
    return category; // Original beibehalten für alles andere
  };
  // NEU: EU-Filter Funktion (ERWEITERT für Display Sensor Flex)
  const isEuPart = (part) => {
    // Prüfe ob es sich um ein Backcover/Housing handelt
    const isBackcover = part.category?.toLowerCase().includes('gehäuse') || 
                       part.category?.toLowerCase().includes('housing') ||
                       part.description?.toLowerCase().includes('housing') ||
                       part.description?.toLowerCase().includes('rear housing') ||
                       part.description?.toLowerCase().includes('back cover');
    
    if (isBackcover) {
      // Für Backcover: Nur EU-Versionen zulassen
      const description = part.description?.toLowerCase() || '';
      const partNumber = part.partNumber?.toLowerCase() || '';
      
      // Ausschließen wenn explizit US Version
      if (description.includes('us version') || 
          description.includes('(us version)') ||
          partNumber.includes('us')) {
        return false;
      }
    }
    
    // WICHTIG: Display-Filter für Pulled und Refurbished
    const isDisplay = part.category?.toLowerCase().includes('display') || 
                     part.category?.toLowerCase().includes('screen') ||
                     part.description?.toLowerCase().includes('display');
    
    if (isDisplay) {
      const description = part.description?.toLowerCase() || '';
      
      // Prüfe ob es Pulled oder Refurbished ist
      const isPulled = description.includes('pulled');
      const isRefurbished = description.includes('refurbished');
      
      if (isPulled || isRefurbished) {
        // Für Pulled und Refurbished: MUSS "with Sensor Flex" enthalten
        const hasSensorFlex = description.includes('with sensor flex') || 
                             description.includes('sensor flex');
        
        if (!hasSensorFlex) {
          return false; // Ausschließen wenn kein Sensor Flex
        }
      }
      
      // Andere Display-Typen (OEM, Service Pack, etc.) sind OK
    }
    
    return true; // Alles andere ist OK
  };

  // NEU: Mobile Detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Hersteller extrahieren
  const availableManufacturers = [...new Set(parts.map(part => {
    const match = part.forModel.match(/^[A-Za-z]+/);
    return match ? match[0] : 'Sonstige';
  }))].sort();

  // Modelle extrahieren - KORRIGIERT mit Bereinigung
  const availableModels = [...new Set(parts
    .map(part => part.forModel)
    .filter(model => model && model.length < 50 && !model.includes(',')) // Filtere komische Modell-Namen
  )].sort();

  // Modelle für gewählten Hersteller - KORRIGIERT
  const filteredModels = selectedManufacturer
    ? [...new Set(parts
        .filter(part => part.forModel.startsWith(selectedManufacturer))
        .map(part => part.forModel)
        .filter(model => model && model.length < 50 && !model.includes(',')) // Bereinigung
      )].sort()
    : availableModels;

  // Kategorien für das gewählte Modell - KORRIGIERT mit Normalisierung
  const availableCategories = parts
    .filter(part => {
      if (!selectedModel) return false;
      
      // Kategorie-Filter anwenden (relevante Kategorien)
      if (!isRelevantCategory(part.category)) return false;
      
      // EU-Filter anwenden
      if (!isEuPart(part)) return false;
      
      // Verbesserte Modell-Kompatibilität
      return isModelCompatible(part, selectedModel);
    })
    .map(part => normalizeCategory(part.category)) // Normalisiere Kategorien
    .filter((category, idx, arr) => arr.indexOf(category) === idx)
    .sort();

  // Teile pro Kategorie für das gewählte Modell - KORRIGIERT mit Normalisierung
  const partsByCategory = {};
  availableCategories.forEach(normalizedCategory => {
    partsByCategory[normalizedCategory] = parts.filter(part => {
      // Kategorie-Filter anwenden
      if (!isRelevantCategory(part.category)) return false;
      
      // EU-Filter anwenden
      if (!isEuPart(part)) return false;
      
      // Verbesserte Modell-Kompatibilität
      if (!isModelCompatible(part, selectedModel)) return false;
      
      // Prüfe ob die normalisierte Kategorie übereinstimmt
      return normalizeCategory(part.category) === normalizedCategory;
    });
  });

  // Handler für Modellwechsel
  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    setSelectedPartsByCategory({});
    setExpandedCategory(null); // Reset mobile expansion
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

  // NEU: Mobile Category Toggle
  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
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
    <div className="bg-white rounded-lg shadow-md p-3 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-blue-900 mb-4 md:mb-6">🧮 Einkaufspreisrechner</h2>

      {alert && (
        <div className={`p-3 md:p-4 rounded-md mb-4 md:mb-6 ${alert.type === 'error' ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`}>
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

      {/* Entfernt: EU-Filter Toggle - ist jetzt immer aktiv */}

      <div className={`grid gap-6 md:gap-8 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
        <div>
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">📱 Gerätekonfiguration</h3>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
              Hersteller auswählen
            </label>
            <div className="relative">
              <select
                value={selectedManufacturer}
                onChange={e => {
                  setSelectedManufacturer(e.target.value);
                  setSelectedModel('');
                  setSelectedPartsByCategory({});
                  setExpandedCategory(null);
                }}
                className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base relative z-10"
              >
                <option value="">Alle</option>
                {availableManufacturers.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>{manufacturer}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
              Modell auswählen
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base relative z-10"
              >
                <option value="">Bitte wählen...</option>
                {filteredModels
                  .filter(model => model.length < 50)
                  .slice(0, 100)
                  .map(model => (
                  <option key={model} value={model} title={model}>
                    {isMobile && model.length > 25 ? model.substring(0, 25) + '...' : 
                     !isMobile && model.length > 40 ? model.substring(0, 40) + '...' : model}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredModels.length} Modelle verfügbar
            </p>
          </div>

          {selectedModel && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                  Defekte Teile auswählen
                </label>
                
                {/* MOBILE: Accordion Style */}
                {isMobile ? (
                  <div className="border rounded bg-gray-50">
                    {availableCategories.length === 0 ? (
                      <p className="text-gray-500 p-4 text-sm">Keine Ersatzteile für dieses Modell verfügbar</p>
                    ) : (
                      availableCategories.map(category => (
                        <div key={category} className="border-b last:border-b-0">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full p-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center"
                          >
                            <div>
                              <span className="font-semibold text-blue-800">{category}</span>
                              <span className="ml-2 text-sm text-gray-600">
                                ({partsByCategory[category]?.length || 0} Teile)
                              </span>
                              {selectedPartsByCategory[category]?.length > 0 && (
                                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                  {selectedPartsByCategory[category].length} gewählt
                                </span>
                              )}
                            </div>
                            <span className="text-gray-400">
                              {expandedCategory === category ? '▼' : '▶'}
                            </span>
                          </button>
                          
                          {expandedCategory === category && (
                            <div className="p-3 bg-gray-50 space-y-2">
                              {/* SPEZIELLE BEHANDLUNG FÜR BACK COVER, DISPLAY UND BATTERY */}
                              {(category.toLowerCase().includes('back cover') || 
                                category.toLowerCase().includes('gehäuse') || 
                                category.toLowerCase().includes('housing') ||
                                category.toLowerCase().includes('display') ||
                                category.toLowerCase().includes('screen') ||
                                category.toLowerCase().includes('battery')) ? (
                                // Gruppierung nach Qualität für Back Cover
                                (() => {
                                  const qualityGroups = {};
                                  partsByCategory[category]?.forEach(part => {
                                    const quality = extractQuality(part.description);
                                    if (!qualityGroups[quality]) qualityGroups[quality] = [];
                                    qualityGroups[quality].push(part);
                                  });
                                  
                                  // Sortierung: Refurbished > Pulled B > Pulled > Standard
                                  const qualityOrder = ['Refurbished', 'Pulled B', 'Pulled', 'New', 'OEM', 'Standard'];
                                  const sortedQualities = Object.keys(qualityGroups).sort((a, b) => {
                                    return qualityOrder.indexOf(a) - qualityOrder.indexOf(b);
                                  });
                                  
                                  return sortedQualities.map(quality => (
                                    <div key={quality} className="mb-4">
                                      <div className="text-sm font-semibold text-gray-700 mb-2 px-2 py-1 bg-gray-200 rounded">
                                        {quality} ({qualityGroups[quality].length} Farben)
                                      </div>
                                      <div className="grid grid-cols-1 gap-2">
                                        {qualityGroups[quality].map(part => (
                                          <label key={part._id} className="flex items-start p-2 hover:bg-white rounded cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                                            <input
                                              type="checkbox"
                                              checked={(selectedPartsByCategory[category] || []).includes(part._id)}
                                              onChange={() => handlePartToggle(category, part._id)}
                                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-900">
                                                  {extractColor(part.description)}
                                                </span>
                                                <span className="text-sm font-bold text-green-600 ml-2">
                                                  {part.price.toFixed(2)} €
                                                </span>
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1">
                                                {part.partNumber}
                                              </div>
                                            </div>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  ));
                                })()
                              ) : (
                                // Standard-Darstellung für andere Kategorien
                                partsByCategory[category]?.map(part => (
                                  <label key={part._id} className="flex items-start p-3 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                                    <input
                                      type="checkbox"
                                      checked={(selectedPartsByCategory[category] || []).includes(part._id)}
                                      onChange={() => handlePartToggle(category, part._id)}
                                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1 flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 text-sm leading-5">{part.description}</div>
                                      <div className="text-xs text-gray-500 mt-1">Teil-Nr: {part.partNumber}</div>
                                      <div className="text-base font-bold text-green-600 mt-1">{part.price.toFixed(2)} €</div>
                                    </div>
                                  </label>
                                )) || []
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* DESKTOP: Original Style */
                  <div className="border rounded p-4 bg-gray-50 relative">
                    <div className="max-h-80 overflow-y-auto">
                      {availableCategories.length === 0 ? (
                        <p className="text-gray-500">Keine Ersatzteile für dieses Modell verfügbar</p>
                      ) : (
                        availableCategories.map(category => (
                          <div key={category} className="mb-4 last:mb-0">
                            <div className="font-semibold mb-3 text-blue-800 border-b border-blue-200 pb-1">
                              {category}
                              <span className="ml-2 text-sm font-normal text-gray-600">
                                ({partsByCategory[category]?.length || 0} Teile)
                              </span>
                            </div>
                            <div className="space-y-2">
                              {/* SPEZIELLE BEHANDLUNG FÜR BACK COVER */}
                              {category.toLowerCase().includes('back cover') || category.toLowerCase().includes('gehäuse') || category.toLowerCase().includes('housing') ? (
                                // Gruppierung nach Qualität für Back Cover
                                (() => {
                                  const qualityGroups = {};
                                  partsByCategory[category]?.forEach(part => {
                                    const quality = extractQuality(part.description);
                                    if (!qualityGroups[quality]) qualityGroups[quality] = [];
                                    qualityGroups[quality].push(part);
                                  });
                                  
                                  // Sortierung: Refurbished > Pulled B > Pulled > Standard
                                  const qualityOrder = ['Refurbished', 'Pulled B', 'Pulled', 'New', 'OEM', 'Standard'];
                                  const sortedQualities = Object.keys(qualityGroups).sort((a, b) => {
                                    return qualityOrder.indexOf(a) - qualityOrder.indexOf(b);
                                  });
                                  
                                  return sortedQualities.map(quality => (
                                    <div key={quality} className="mb-4">
                                      <div className="text-sm font-semibold text-gray-700 mb-2 px-3 py-2 bg-gray-200 rounded">
                                        {quality} ({qualityGroups[quality].length} Farben)
                                      </div>
                                      <div className="space-y-1">
                                        {qualityGroups[quality].map(part => (
                                          <label key={part._id} className="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-gray-200 transition-all">
                                            <input
                                              type="checkbox"
                                              checked={(selectedPartsByCategory[category] || []).includes(part._id)}
                                              onChange={() => handlePartToggle(category, part._id)}
                                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900">
                                                  {extractColor(part.description)}
                                                </span>
                                                <span className="text-lg font-bold text-green-600">
                                                  {part.price.toFixed(2)} €
                                                </span>
                                              </div>
                                              <div className="text-sm text-gray-500">
                                                {part.partNumber}
                                              </div>
                                            </div>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                  ));
                                })()
                              ) : (
                                // Standard-Darstellung für andere Kategorien
                                partsByCategory[category]?.map(part => (
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
                                )) || []
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                  Erwarteter Marktpreis (€)
                </label>
                <input
                  type="number"
                  value={marketPrice}
                  onChange={(e) => setMarketPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  min="0"
                  step="10"
                  placeholder="z.B. 350"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 text-sm md:text-base">
                  Gewünschter Gewinn (€)
                </label>
                <input
                  type="number"
                  value={desiredProfit}
                  onChange={(e) => setDesiredProfit(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 md:py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
                  min="0"
                  step="10"
                  placeholder="z.B. 50"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">💰 Kalkulation</h3>

          <div className="bg-gray-100 p-3 md:p-4 rounded mb-4">
            <h4 className="font-semibold mb-2 text-sm md:text-base">🔧 Ersatzteilkosten</h4>
            {selectedModel && Object.values(selectedPartsByCategory).flat().length > 0 ? (
              <div>
                {Object.entries(selectedPartsByCategory).map(([category, ids]) =>
                  ids.map(id => {
                    const part = parts.find(p => p._id === id);
                    if (!part) return null;
                    return (
                      <div key={id} className="flex justify-between mb-1 py-1">
                        <span className="text-xs md:text-sm flex-1 pr-2">
                          <span className="font-medium">{category}:</span> 
                          <span className="block md:inline md:ml-1">{part.description}</span>
                        </span>
                        <span className="font-bold text-sm md:text-base">{part.price.toFixed(2)} €</span>
                      </div>
                    );
                  })
                )}
                <div className="border-t mt-2 pt-2 font-bold flex justify-between text-base md:text-lg">
                  <span>Gesamt:</span>
                  <span className="text-blue-600">
                    {calculatePartsCost().toFixed(2)} €
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Wählen Sie ein Modell und Ersatzteile aus</p>
            )}
          </div>

          <div className="bg-blue-100 p-3 md:p-4 rounded mb-4">
            <h4 className="font-semibold mb-2 text-sm md:text-base">🎯 Maximaler Einkaufspreis</h4>
            <p className="text-2xl md:text-4xl font-bold text-blue-700 mb-2">
              {calculateMaxPurchasePrice().toFixed(2)} €
            </p>
            <p className="text-xs md:text-sm text-blue-600">
              {marketPrice.toFixed(2)} € (Markt) - {calculatePartsCost().toFixed(2)} € (Teile) - {desiredProfit.toFixed(2)} € (Gewinn)
            </p>
          </div>

          <div className="bg-green-100 p-3 md:p-4 rounded mb-4">
            <h4 className="font-semibold mb-2 text-sm md:text-base">📊 Gewinnkalkulation</h4>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {[100, 150, 200, 250].map(price => (
                <div key={price} className="bg-white p-2 md:p-3 rounded">
                  <p className="text-xs text-gray-600">Einkauf für:</p>
                  <p className="font-semibold text-sm md:text-lg">{price} €</p>
                  <p className={`text-xs md:text-sm font-bold ${calculatePotentialProfit(price) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Gewinn: {calculatePotentialProfit(price).toFixed(2)} €
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Marktdaten falls verfügbar */}
          {similarDevices.length > 0 && (
            <div className="bg-yellow-100 p-3 md:p-4 rounded">
              <h4 className="font-semibold mb-2 text-sm md:text-base">📈 Ähnliche verkaufte Geräte</h4>
              <div className="text-xs md:text-sm space-y-1">
                {similarDevices.slice(0, 3).map((device, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="flex-1 pr-2">{device.model}</span>
                    <span className="font-bold whitespace-nowrap">{device.sellingPrice}€ (Gewinn: {device.profit.toFixed(0)}€)</span>
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