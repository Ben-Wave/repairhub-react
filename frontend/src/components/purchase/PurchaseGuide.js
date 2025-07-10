// frontend/src/components/purchase/PurchaseGuide.js - VOLLSTÄNDIG KORRIGIERT mit checkImeiOnly
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceContext } from '../../context/DeviceContext';

const PurchaseGuide = () => {
  const navigate = useNavigate();
  const { addDevice, checkImeiOnly } = useContext(DeviceContext); // NEU: checkImeiOnly verwenden
  
  // Haupt-State
  const [currentStep, setCurrentStep] = useState(1);
  const [deviceData, setDeviceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Step 1: IMEI Eingabe
  const [imei, setImei] = useState('');
  
  // Step 2: Physische Bewertung
  const [physicalCondition, setPhysicalCondition] = useState({
    displayCondition: '', // excellent, good, fair, poor
    displayDamage: [],
    bodyCondition: '', 
    bodyDamage: [],
    buttonsFunctional: true,
    portsCondition: '', // clean, dusty, damaged
    overallGrade: '' // A+, A, B, C, D
  });
  
  // Step 3: Funktionstest
  const [functionalTest, setFunctionalTest] = useState({
    // Grundfunktionen
    powersOn: false,
    touchscreen: false,
    allButtons: false,
    speakers: false,
    microphone: false,
    cameras: false,
    faceid_touchid: false,
    wifi: false,
    cellular: false,
    bluetooth: false,
    
    // Detaillierte Tests
    batteryHealth: 0, // Prozent
    batteryMaxCapacity: 0, // mAh
    chargingWorks: false,
    fastCharging: false,
    displayBrightness: 0, // 1-10
    touchSensitivity: 0, // 1-10
    cameraQuality: '', // excellent, good, fair, poor
    audioQuality: '', // excellent, good, fair, poor
    
    // Software
    iosVersion: '',
    storageSpace: 0, // GB verfügbar
    icloudLocked: false,
    carrierLocked: false,
    
    // Besonderheiten
    waterDamage: false,
    previousRepairs: false,
    repairHistory: '',
    functionalIssues: []
  });
  
  // Step 4: Preisbewertung
  const [pricing, setPricing] = useState({
    marketValue: 0,
    conditionMultiplier: 1.0,
    repairCosts: 0,
    finalOffer: 0,
    profitMargin: 0
  });
  
  // Step 5: Zusätzliche Informationen
  const [additionalInfo, setAdditionalInfo] = useState({
    seller: '',
    purchaseLocation: '',
    notes: '',
    photos: [],
    desiredProfit: 50
  });

  const steps = [
    { id: 1, title: 'IMEI Check', icon: '📱', description: 'Gerät identifizieren' },
    { id: 2, title: 'Physischer Zustand', icon: '🔍', description: 'Äußere Bewertung' },
    { id: 3, title: 'Funktionstest', icon: '⚡', description: 'Alle Funktionen prüfen' },
    { id: 4, title: 'Preisbewertung', icon: '💰', description: 'Wert bestimmen' },
    { id: 5, title: 'Abschluss', icon: '✅', description: 'Ankauf dokumentieren' }
  ];

  // KORRIGIERT: IMEI Check mit checkImeiOnly (erstellt KEIN Gerät)
  const handleImeiCheck = async () => {
    if (!imei || imei.length < 15) {
      setError('Bitte geben Sie eine gültige IMEI ein (15-17 Ziffern)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // NEU: Verwende checkImeiOnly - erstellt KEIN Gerät
      const deviceInfo = await checkImeiOnly(imei);
      
      // Prüfe ob Gerät bereits existiert
      if (deviceInfo._isExisting) {
        setError(`Gerät mit IMEI ${imei} ist bereits in der Datenbank vorhanden. Möchten Sie es aktualisieren?`);
        
        // Trotzdem weitermachen, aber Warnung anzeigen
        setDeviceData(deviceInfo);
        setTimeout(() => {
          setCurrentStep(2);
          setError(null);
        }, 3000);
      } else {
        // Neues Gerät - Daten sind verfügbar, aber noch nicht gespeichert
        setDeviceData(deviceInfo);
        setCurrentStep(2);
      }
    } catch (err) {
      console.error('IMEI Check Fehler:', err);
      
      let errorMessage = 'Fehler beim IMEI Check';
      
      if (err.response?.status === 401) {
        errorMessage = 'Nicht autorisiert. Bitte loggen Sie sich erneut ein.';
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else if (err.response?.status === 403) {
        errorMessage = 'Keine Berechtigung zum Hinzufügen von Geräten.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Physischen Zustand bewerten
  const assessPhysicalCondition = () => {
    let grade = 'A+';
    let multiplier = 1.0;
    
    // Display Bewertung
    if (physicalCondition.displayCondition === 'poor' || physicalCondition.displayDamage.includes('cracked')) {
      grade = 'C';
      multiplier = 0.7;
    } else if (physicalCondition.displayCondition === 'fair') {
      grade = 'B';
      multiplier = 0.85;
    } else if (physicalCondition.displayCondition === 'good') {
      grade = 'A';
      multiplier = 0.95;
    }

    // Gehäuse Bewertung
    if (physicalCondition.bodyCondition === 'poor') {
      grade = Math.min(grade, 'C');
      multiplier *= 0.9;
    }

    return { grade, multiplier };
  };

  // Marktpreis schätzen (vereinfacht)
  const estimateMarketValue = () => {
    if (!deviceData) return 0;
    
    // Basis-Preise nach Modell (vereinfacht)
    const basePrices = {
      'iPhone 15': 800,
      'iPhone 14': 650,
      'iPhone 13': 500,
      'iPhone 12': 350,
      'iPhone 11': 250
    };
    
    const modelKey = Object.keys(basePrices).find(key => 
      deviceData.model.includes(key)
    );
    
    let basePrice = modelKey ? basePrices[modelKey] : 200;
    
    // Speicher-Adjustierung
    if (deviceData.model.includes('256GB')) basePrice *= 1.15;
    if (deviceData.model.includes('512GB')) basePrice *= 1.3;
    if (deviceData.model.includes('1TB')) basePrice *= 1.5;
    
    return basePrice;
  };

  // Reparaturkosten schätzen
  const estimateRepairCosts = () => {
    let costs = 0;
    
    if (physicalCondition.displayDamage.includes('cracked')) costs += 80;
    if (physicalCondition.displayDamage.includes('deadPixels')) costs += 120;
    if (physicalCondition.bodyDamage.includes('backGlass')) costs += 40;
    if (functionalTest.batteryHealth < 80) costs += 35;
    if (!functionalTest.cameras) costs += 60;
    if (!functionalTest.speakers) costs += 25;
    
    return costs;
  };

  // Finales Angebot berechnen
  const calculateFinalOffer = () => {
    const marketValue = estimateMarketValue();
    const { multiplier } = assessPhysicalCondition();
    const repairCosts = estimateRepairCosts();
    const batteryAdjustment = functionalTest.batteryHealth < 85 ? -20 : 0;
    
    const adjustedValue = marketValue * multiplier;
    const finalOffer = Math.max(50, adjustedValue - repairCosts + batteryAdjustment);
    
    setPricing({
      marketValue,
      conditionMultiplier: multiplier,
      repairCosts,
      finalOffer: Math.round(finalOffer),
      profitMargin: Math.round(adjustedValue - finalOffer)
    });
  };

  // KORRIGIERT: Ankauf abschließen - jetzt wird das Gerät erstellt/aktualisiert
const completePurchase = async () => {
  if (!deviceData) return;

  setLoading(true);

  try {
    const damageReport = createDamageReport();

    // Hilfsfunktion für leere Strings
    const emptyToUndefined = (value) => value === '' ? undefined : value;

    // Bereinigtes und API-kompatibles Objekt
    const cleanDevice = {
      imei: deviceData.imei,
      imei2: emptyToUndefined(deviceData.imei2),
      meid: emptyToUndefined(deviceData.meid),
      serial: emptyToUndefined(deviceData.serial),
      model: deviceData.model,
      modelDesc: deviceData.modelDesc,
      thumbnail: deviceData.thumbnail,
      region: deviceData.region,
      status: 'gekauft',

      purchasePrice: pricing.finalOffer,
      desiredProfit: additionalInfo.desiredProfit,
      damageDescription: damageReport,

      purchaseInfo: {
        method: 'guided',
        seller: emptyToUndefined(additionalInfo.seller),
        location: emptyToUndefined(additionalInfo.purchaseLocation),
        notes: emptyToUndefined(additionalInfo.notes),
        date: new Date().toISOString()
      },

      softwareInfo: {
        iosVersion: functionalTest.iosVersion,
        availableStorage: Number(functionalTest.storageSpace) || undefined,
        icloudStatus: functionalTest.icloudLocked ? 'locked' : 'clean',
        carrierStatus: functionalTest.carrierLocked ? 'locked' : 'unlocked',
        resetToFactory: false,
        jailbroken: false
      },

      batteryInfo: {
        health: functionalTest.batteryHealth,
        maxCapacity: functionalTest.batteryMaxCapacity || undefined,
        needsReplacement: functionalTest.batteryHealth < 80,
        chargingSpeed: functionalTest.chargingWorks && functionalTest.fastCharging ? 'fast' : 'normal'
      },

      functionalStatus: {
        allButtonsWork: functionalTest.allButtons,
        touchscreenFunctional: functionalTest.touchscreen,
        camerasWork: functionalTest.cameras,
        speakersWork: functionalTest.speakers,
        microphoneWorks: functionalTest.microphone,
        wifiWorks: functionalTest.wifi,
        cellularWorks: functionalTest.cellular,
        bluetoothWorks: functionalTest.bluetooth,
        authenticationWorks: functionalTest.faceid_touchid,
        chargingWorks: functionalTest.chargingWorks,
        fastCharging: functionalTest.fastCharging,
        overallFunctional: functionalTest.powersOn && functionalTest.touchscreen
      },

      physicalCondition: {
        overallGrade: physicalCondition.overallGrade,
        displayCondition: physicalCondition.displayCondition,
        displayDamage: physicalCondition.displayDamage,
        bodyCondition: physicalCondition.bodyCondition,
        bodyDamage: physicalCondition.bodyDamage,
        hasWaterDamage: functionalTest.waterDamage,
        previousRepairs: functionalTest.previousRepairs,
        repairHistory: emptyToUndefined(functionalTest.repairHistory),
        portsCondition: physicalCondition.portsCondition
      },

      marketValuation: {
        estimatedMarketValue: pricing.marketValue,
        conditionMultiplier: pricing.conditionMultiplier,
        estimatedRepairCosts: pricing.repairCosts,
        profitMarginExpected: pricing.profitMargin,
        valuationDate: new Date().toISOString(),
        marketSource: 'internal_assessment'
      },

      qualityAssessment: {
        displayBrightness: functionalTest.displayBrightness,
        touchSensitivity: functionalTest.touchSensitivity,
        cameraQuality: functionalTest.cameraQuality,
        audioQuality: functionalTest.audioQuality,
        overallPerformance: Math.round((functionalTest.displayBrightness + functionalTest.touchSensitivity) / 2),
        functionalIssues: functionalTest.functionalIssues,
        testDate: new Date().toISOString()
      }
    };

    console.log('Clean Device:', cleanDevice); // Optional: Debug

    const savedDevice = await addDevice(cleanDevice);

    navigate('/devices', {
      state: {
        message: savedDevice._wasUpdated
          ? `Gerät erfolgreich aktualisiert für ${pricing.finalOffer}€`
          : `Gerät erfolgreich angekauft für ${pricing.finalOffer}€`,
        type: 'success'
      }
    });

  } catch (err) {
    console.error('Fehler beim Speichern:', err.response?.data || err);
    setError('Fehler beim Speichern des Geräts: ' +
      (err.response?.data?.error || JSON.stringify(err.response?.data) || err.message)
    );
  } finally {
    setLoading(false);
  }
};


  // Detaillierten Schadensbericht erstellen
  const createDamageReport = () => {
    let report = `ANKAUFSBEWERTUNG - ${new Date().toLocaleDateString('de-DE')}\n\n`;
    
    report += `PHYSISCHER ZUSTAND:\n`;
    report += `- Gesamtnote: ${physicalCondition.overallGrade}\n`;
    report += `- Display: ${physicalCondition.displayCondition}\n`;
    if (physicalCondition.displayDamage.length > 0) {
      report += `  Schäden: ${physicalCondition.displayDamage.join(', ')}\n`;
    }
    report += `- Gehäuse: ${physicalCondition.bodyCondition}\n`;
    if (physicalCondition.bodyDamage.length > 0) {
      report += `  Schäden: ${physicalCondition.bodyDamage.join(', ')}\n`;
    }
    
    report += `\nFUNKTIONSTEST:\n`;
    report += `- Akkugesundheit: ${functionalTest.batteryHealth}%\n`;
    report += `- iOS Version: ${functionalTest.iosVersion}\n`;
    report += `- Freier Speicher: ${functionalTest.storageSpace}GB\n`;
    report += `- Wasserschaden: ${functionalTest.waterDamage ? 'Ja' : 'Nein'}\n`;
    report += `- Vorherige Reparaturen: ${functionalTest.previousRepairs ? 'Ja' : 'Nein'}\n`;
    
    if (functionalTest.functionalIssues.length > 0) {
      report += `- Funktionsprobleme: ${functionalTest.functionalIssues.join(', ')}\n`;
    }
    
    report += `\nPREISBEWERTUNG:\n`;
    report += `- Marktwert: ${pricing.marketValue}€\n`;
    report += `- Zustandsfaktor: ${(pricing.conditionMultiplier * 100)}%\n`;
    report += `- Geschätzte Reparaturkosten: ${pricing.repairCosts}€\n`;
    report += `- Ankaufspreis: ${pricing.finalOffer}€\n`;
    
    if (additionalInfo.notes) {
      report += `\nZUSÄTZLICHE NOTIZEN:\n${additionalInfo.notes}\n`;
    }
    
    return report;
  };

  // Navigation zwischen Steps
  const nextStep = () => {
    if (currentStep === 3) {
      calculateFinalOffer();
    }
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-blue-900">
              📱 Smartphone Ankauf-Prozess
            </h1>
            <button
              onClick={() => navigate('/devices')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition duration-200"
            >
              ← Zurück
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex flex-wrap justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.id ? '✓' : step.icon}
                  </div>
                  <div className="text-xs text-center max-w-20">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-gray-500">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <span className="text-red-600 mr-2">⚠️</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          
          {/* Step 1: IMEI Check */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">📱 Schritt 1: Gerät identifizieren</h2>
              <p className="text-gray-600 mb-6">
                Geben Sie die IMEI des Geräts ein, um es zu identifizieren und grundlegende Informationen zu erhalten.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMEI Nummer (15-17 Ziffern)
                  </label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))}
                    placeholder="z.B. 354329705526163"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength="17"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Eingabe: {imei.length}/15 Zeichen
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">💡 IMEI finden:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Einstellungen → Allgemein → Info</li>
                    <li>• Wählen Sie *#06# auf dem Gerät</li>
                    <li>• SIM-Karten-Fach (bei älteren Modellen)</li>
                    <li>• Rückseite des Geräts (kleine Schrift)</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleImeiCheck}
                  disabled={imei.length < 15 || loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Prüfe IMEI...
                    </>
                  ) : (
                    <>
                      🔍 IMEI prüfen
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Physische Bewertung */}
          {currentStep === 2 && deviceData && (
            <div>
              <h2 className="text-xl font-semibold mb-4">🔍 Schritt 2: Physischer Zustand</h2>
              
              {/* Geräteinformationen */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-4">
                  {deviceData.thumbnail && (
                    <img src={deviceData.thumbnail} alt="Device" className="w-16 h-16 object-contain" />
                  )}
                  <div>
                    <h3 className="font-semibold">{deviceData.model}</h3>
                    <p className="text-sm text-gray-600">IMEI: {deviceData.imei}</p>
                    <p className="text-sm text-gray-600">Status: {deviceData.usaBlockStatus}</p>
                    {deviceData._isExisting && (
                      <p className="text-sm text-orange-600 font-medium">⚠️ Gerät bereits in Datenbank</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Display Zustand */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">📱 Display Zustand</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {[
                    { value: 'excellent', label: 'Ausgezeichnet', color: 'green' },
                    { value: 'good', label: 'Gut', color: 'blue' },
                    { value: 'fair', label: 'Akzeptabel', color: 'yellow' },
                    { value: 'poor', label: 'Schlecht', color: 'red' }
                  ].map(condition => (
                    <button
                      key={condition.value}
                      onClick={() => setPhysicalCondition({
                        ...physicalCondition,
                        displayCondition: condition.value
                      })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        physicalCondition.displayCondition === condition.value
                          ? `border-${condition.color}-500 bg-${condition.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{condition.label}</div>
                    </button>
                  ))}
                </div>
                
                {/* Display Schäden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Schäden (mehrere auswählbar)
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      'cracked', 'deadPixels', 'screenBurn', 'scratches', 'yellowTint', 'touchIssues'
                    ].map(damage => (
                      <label key={damage} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={physicalCondition.displayDamage.includes(damage)}
                          onChange={(e) => {
                            const newDamage = e.target.checked
                              ? [...physicalCondition.displayDamage, damage]
                              : physicalCondition.displayDamage.filter(d => d !== damage);
                            setPhysicalCondition({
                              ...physicalCondition,
                              displayDamage: newDamage
                            });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {{
                            cracked: 'Risse',
                            deadPixels: 'Tote Pixel',
                            screenBurn: 'Einbrennen',
                            scratches: 'Kratzer',
                            yellowTint: 'Gelbstich',
                            touchIssues: 'Touch-Probleme'
                          }[damage]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Gehäuse Zustand */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">📱 Gehäuse Zustand</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  {[
                    { value: 'excellent', label: 'Wie neu', color: 'green' },
                    { value: 'good', label: 'Leichte Spuren', color: 'blue' },
                    { value: 'fair', label: 'Sichtbare Abnutzung', color: 'yellow' },
                    { value: 'poor', label: 'Starke Schäden', color: 'red' }
                  ].map(condition => (
                    <button
                      key={condition.value}
                      onClick={() => setPhysicalCondition({
                        ...physicalCondition,
                        bodyCondition: condition.value
                      })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        physicalCondition.bodyCondition === condition.value
                          ? `border-${condition.color}-500 bg-${condition.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{condition.label}</div>
                    </button>
                  ))}
                </div>
                
                {/* Gehäuse Schäden */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gehäuse Schäden
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      'dents', 'scratches', 'backGlass', 'cameraBump', 'buttons', 'ports'
                    ].map(damage => (
                      <label key={damage} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={physicalCondition.bodyDamage.includes(damage)}
                          onChange={(e) => {
                            const newDamage = e.target.checked
                              ? [...physicalCondition.bodyDamage, damage]
                              : physicalCondition.bodyDamage.filter(d => d !== damage);
                            setPhysicalCondition({
                              ...physicalCondition,
                              bodyDamage: newDamage
                            });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          {{
                            dents: 'Dellen',
                            scratches: 'Kratzer',
                            backGlass: 'Rückseite gebrochen',
                            cameraBump: 'Kamera beschädigt',
                            buttons: 'Tasten defekt',
                            ports: 'Anschlüsse beschädigt'
                          }[damage]}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Gesamtnote */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">📊 Gesamtnote</h3>
                <div className="grid grid-cols-5 gap-3">
                  {['A+', 'A', 'B', 'C', 'D'].map(grade => (
                    <button
                      key={grade}
                      onClick={() => setPhysicalCondition({
                        ...physicalCondition,
                        overallGrade: grade
                      })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        physicalCondition.overallGrade === grade
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-bold text-lg">{grade}</div>
                      <div className="text-xs">
                        {{
                          'A+': 'Neuwertig',
                          'A': 'Sehr gut',
                          'B': 'Gut',
                          'C': 'Akzeptabel',
                          'D': 'Schlecht'
                        }[grade]}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  ← Zurück
                </button>
                <button
                  onClick={nextStep}
                  disabled={!physicalCondition.displayCondition || !physicalCondition.bodyCondition || !physicalCondition.overallGrade}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  Weiter →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Funktionstest */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">⚡ Schritt 3: Funktionstest</h2>
              <p className="text-gray-600 mb-6">
                Testen Sie alle wichtigen Funktionen des Geräts systematisch.
              </p>
              
              {/* Grundfunktionen */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">🔋 Grundfunktionen</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[
                    { key: 'powersOn', label: 'Gerät startet', icon: '🔌' },
                    { key: 'touchscreen', label: 'Touchscreen reagiert', icon: '👆' },
                    { key: 'allButtons', label: 'Alle Tasten funktionieren', icon: '🔘' },
                    { key: 'speakers', label: 'Lautsprecher funktionieren', icon: '🔊' },
                    { key: 'microphone', label: 'Mikrofon funktioniert', icon: '🎤' },
                    { key: 'cameras', label: 'Kameras funktionieren', icon: '📷' },
                    { key: 'faceid_touchid', label: 'Face ID/Touch ID funktioniert', icon: '🔐' },
                    { key: 'wifi', label: 'WLAN funktioniert', icon: '📶' },
                    { key: 'cellular', label: 'Mobilfunk funktioniert', icon: '📡' },
                    { key: 'bluetooth', label: 'Bluetooth funktioniert', icon: '🔵' },
                    { key: 'chargingWorks', label: 'Laden funktioniert', icon: '⚡' }
                  ].map(test => (
                    <label key={test.key} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={functionalTest[test.key]}
                        onChange={(e) => setFunctionalTest({
                          ...functionalTest,
                          [test.key]: e.target.checked
                        })}
                        className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span className="mr-2">{test.icon}</span>
                      <span className="font-medium">{test.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Akkuinformationen */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">🔋 Akku & Leistung</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Akkugesundheit (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={functionalTest.batteryHealth}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        batteryHealth: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. 85"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Einstellungen → Batterie → Batteriezustand
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximale Kapazität (mAh)
                    </label>
                    <select
                      value={functionalTest.batteryMaxCapacity}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        batteryMaxCapacity: parseInt(e.target.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="0">Automatisch erkennen</option>
                      <option value="2227">iPhone 13 mini (2227 mAh)</option>
                      <option value="3095">iPhone 13 (3095 mAh)</option>
                      <option value="3095">iPhone 13 Pro (3095 mAh)</option>
                      <option value="4325">iPhone 13 Pro Max (4325 mAh)</option>
                      <option value="3279">iPhone 14 (3279 mAh)</option>
                      <option value="3200">iPhone 14 Pro (3200 mAh)</option>
                      <option value="4323">iPhone 14 Pro Max (4323 mAh)</option>
                      <option value="3349">iPhone 15 (3349 mAh)</option>
                      <option value="3274">iPhone 15 Pro (3274 mAh)</option>
                      <option value="4441">iPhone 15 Pro Max (4441 mAh)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display-Helligkeit (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={functionalTest.displayBrightness}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        displayBrightness: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Schwach</span>
                      <span>{functionalTest.displayBrightness}/10</span>
                      <span>Sehr hell</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Touch-Empfindlichkeit (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={functionalTest.touchSensitivity}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        touchSensitivity: parseInt(e.target.value)
                      })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Träge</span>
                      <span>{functionalTest.touchSensitivity}/10</span>
                      <span>Sehr reaktiv</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Software-Informationen */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">📱 Software & Speicher</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      iOS Version
                    </label>
                    <input
                      type="text"
                      value={functionalTest.iosVersion}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        iosVersion: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. 17.5.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verfügbarer Speicher (GB)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={functionalTest.storageSpace}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        storageSpace: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. 45"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={functionalTest.icloudLocked}
                        onChange={(e) => setFunctionalTest({
                          ...functionalTest,
                          icloudLocked: e.target.checked
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">iCloud gesperrt</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={functionalTest.carrierLocked}
                        onChange={(e) => setFunctionalTest({
                          ...functionalTest,
                          carrierLocked: e.target.checked
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm">Provider-Lock</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Qualitätsbewertungen */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">🎯 Qualitätsbewertung</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kamera-Qualität
                    </label>
                    <select
                      value={functionalTest.cameraQuality}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        cameraQuality: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bewertung auswählen</option>
                      <option value="excellent">Ausgezeichnet</option>
                      <option value="good">Gut</option>
                      <option value="fair">Akzeptabel</option>
                      <option value="poor">Schlecht</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Audio-Qualität
                    </label>
                    <select
                      value={functionalTest.audioQuality}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        audioQuality: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bewertung auswählen</option>
                      <option value="excellent">Ausgezeichnet</option>
                      <option value="good">Gut</option>
                      <option value="fair">Akzeptabel</option>
                      <option value="poor">Schlecht</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Besondere Probleme */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">⚠️ Besondere Umstände</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={functionalTest.waterDamage}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        waterDamage: e.target.checked
                      })}
                      className="mr-3"
                    />
                    <span>💧 Wasserschaden erkennbar</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={functionalTest.previousRepairs}
                      onChange={(e) => setFunctionalTest({
                        ...functionalTest,
                        previousRepairs: e.target.checked
                      })}
                      className="mr-3"
                    />
                    <span>🔧 Vorherige Reparaturen sichtbar</span>
                  </label>
                  
                  {functionalTest.previousRepairs && (
                    <div className="ml-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reparatur-Historie
                      </label>
                      <textarea
                        value={functionalTest.repairHistory}
                        onChange={(e) => setFunctionalTest({
                          ...functionalTest,
                          repairHistory: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="z.B. Display getauscht, Non-Original Akku erkennbar..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Funktionsprobleme */}
              <div className="mb-6">
                <h3 className="font-medium mb-4">🚨 Funktionsprobleme</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {[
                    'Überhitzung', 'Zufällige Neustarts', 'Langsame Performance', 
                    'App-Abstürze', 'Konnektivitätsprobleme', 'Sensor-Probleme',
                    'GPS nicht funktional', 'NFC nicht funktional'
                  ].map(issue => (
                    <label key={issue} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={functionalTest.functionalIssues.includes(issue)}
                        onChange={(e) => {
                          const newIssues = e.target.checked
                            ? [...functionalTest.functionalIssues, issue]
                            : functionalTest.functionalIssues.filter(i => i !== issue);
                          setFunctionalTest({
                            ...functionalTest,
                            functionalIssues: newIssues
                          });
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{issue}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  ← Zurück
                </button>
                <button
                  onClick={nextStep}
                  disabled={!functionalTest.batteryHealth || !functionalTest.iosVersion}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                >
                  Preis berechnen →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Preisbewertung */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">💰 Schritt 4: Preisbewertung</h2>
              
              {/* Bewertungsübersicht */}
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-4">📊 Automatische Bewertung</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Geschätzter Marktwert:</span>
                      <span className="font-medium">{pricing.marketValue}€</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-700">Zustandsfaktor:</span>
                      <span className="font-medium">{(pricing.conditionMultiplier * 100).toFixed(0)}%</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-700">Geschätzte Reparaturkosten:</span>
                      <span className="font-medium text-red-600">-{pricing.repairCosts}€</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-700">Akkuabschlag:</span>
                      <span className="font-medium text-red-600">
                        {functionalTest.batteryHealth < 85 ? '-20€' : '0€'}
                      </span>
                    </div>
                    
                    <div className="border-t border-blue-200 pt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-blue-900">Empfohlener Ankaufspreis:</span>
                        <span className="font-bold text-blue-900">{pricing.finalOffer}€</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Bewertungsdetails:</h4>
                    <div className="text-sm space-y-2">
                      <div>• Gerät: {deviceData.model}</div>
                      <div>• Zustandsnote: {physicalCondition.overallGrade}</div>
                      <div>• Akkugesundheit: {functionalTest.batteryHealth}%</div>
                      <div>• Display: {physicalCondition.displayCondition}</div>
                      <div>• Gehäuse: {physicalCondition.bodyCondition}</div>
                      {functionalTest.waterDamage && <div className="text-red-600">• ⚠️ Wasserschaden</div>}
                      {functionalTest.previousRepairs && <div className="text-orange-600">• ⚠️ Vorherige Reparaturen</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manuelle Anpassung */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-4">✏️ Manuelle Anpassung</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Finaler Ankaufspreis (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pricing.finalOffer}
                      onChange={(e) => setPricing({
                        ...pricing,
                        finalOffer: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Erwarteter Profit-Margin (€)
                    </label>
                    <input
                      type="number"
                      value={pricing.profitMargin}
                      onChange={(e) => setPricing({
                        ...pricing,
                        profitMargin: parseInt(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Automatisch berechnet basierend auf Marktwert - Ankaufspreis
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  ← Zurück
                </button>
                <button
                  onClick={nextStep}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Weiter →
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Abschluss */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">✅ Schritt 5: Ankauf abschließen</h2>
              
              {/* Zusammenfassung */}
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-green-900 mb-4">📋 Ankauf-Zusammenfassung</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Geräteinformationen:</h4>
                    <div className="text-sm space-y-1">
                      <div>• Modell: {deviceData.model}</div>
                      <div>• IMEI: {deviceData.imei}</div>
                      <div>• iOS: {functionalTest.iosVersion}</div>
                      <div>• Akkugesundheit: {functionalTest.batteryHealth}%</div>
                      <div>• Zustandsnote: {physicalCondition.overallGrade}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Finanzen:</h4>
                    <div className="text-sm space-y-1">
                      <div>• Ankaufspreis: <span className="font-bold">{pricing.finalOffer}€</span></div>
                      <div>• Reparaturkosten: {pricing.repairCosts}€</div>
                      <div>• Erwarteter Profit: {pricing.profitMargin}€</div>
                      <div>• Gewünschter Gewinn: {additionalInfo.desiredProfit}€</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zusätzliche Informationen */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Verkäufer / Quelle
                    </label>
                    <input
                      type="text"
                      value={additionalInfo.seller}
                      onChange={(e) => setAdditionalInfo({
                        ...additionalInfo,
                        seller: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Max Mustermann, eBay, Lokalmarkt..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ankaufsort
                    </label>
                    <input
                      type="text"
                      value={additionalInfo.purchaseLocation}
                      onChange={(e) => setAdditionalInfo({
                        ...additionalInfo,
                        purchaseLocation: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="z.B. Hamburg, Online, Geschäft..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gewünschter Gewinn (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={additionalInfo.desiredProfit}
                    onChange={(e) => setAdditionalInfo({
                      ...additionalInfo,
                      desiredProfit: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zusätzliche Notizen
                  </label>
                  <textarea
                    value={additionalInfo.notes}
                    onChange={(e) => setAdditionalInfo({
                      ...additionalInfo,
                      notes: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Besondere Umstände, Verhandlungsdetails, Garantie-Informationen..."
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition duration-200"
                >
                  ← Zurück
                </button>
                <button
                  onClick={completePurchase}
                  disabled={loading}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Speichere...
                    </>
                  ) : (
                    <>
                      ✅ Ankauf abschließen für {pricing.finalOffer}€
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseGuide;