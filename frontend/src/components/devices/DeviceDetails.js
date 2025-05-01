import React, { useEffect, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DeviceContext } from '../../context/DeviceContext';
import { PartsContext } from '../../context/PartsContext';
import Spinner from '../layout/Spinner';
import Alert from '../layout/Alert';

const DeviceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { device, loading, error, getDevice, updateDevice, deleteDevice } = useContext(DeviceContext);
  const { parts, getParts } = useContext(PartsContext);
  
  const [alert, setAlert] = useState(null);
  const [selectedParts, setSelectedParts] = useState([]);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [damageDescription, setDamageDescription] = useState('');
  const [desiredProfit, setDesiredProfit] = useState(0);
  
  useEffect(() => {
    getDevice(id);
    // eslint-disable-next-line
  }, [id]);
  
  useEffect(() => {
    if (device?.model) {
      // Extrahiere Basis-Modellname (z.B. "iPhone 13" aus "iPhone 13 Pro Max")
      const baseModel = device.model.split(' ').slice(0, 2).join(' ');
      getParts(baseModel);
    }
    // eslint-disable-next-line
  }, [device?.model]);
  
  useEffect(() => {
    if (device) {
      setPurchasePrice(device.purchasePrice || 0);
      setDamageDescription(device.damageDescription || '');
      setDesiredProfit(device.desiredProfit || 0);
      setSelectedParts(device.parts || []);
    }
  }, [device]);
  
  const handleStatusChange = async (newStatus) => {
    try {
      await updateDevice(id, { status: newStatus });
      setAlert({ type: 'success', message: 'Status erfolgreich aktualisiert' });
    } catch (err) {
      setAlert({ type: 'error', message: 'Fehler beim Aktualisieren des Status' });
    }
  };
  
  const handleSaveChanges = async () => {
    try {
      await updateDevice(id, {
        purchasePrice,
        damageDescription,
        desiredProfit,
        parts: selectedParts
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
  
  const calculateTotalPartsPrice = () => {
    return selectedParts.reduce((total, part) => total + (part.price || 0), 0);
  };
  
  const calculateSellingPrice = () => {
    return (parseFloat(purchasePrice) || 0) + 
           calculateTotalPartsPrice() + 
           (parseFloat(desiredProfit) || 0);
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
              <h5 className="font-medium mb-2">Verfügbare Ersatzteile</h5>
              {parts.length === 0 ? (
                <p className="text-gray-500">Keine Ersatzteile für dieses Modell verfügbar</p>
              ) : (
                <div className="bg-gray-50 p-2 rounded max-h-40 overflow-y-auto">
                  {parts.map(part => (
                    <div key={part._id} className="flex justify-between items-center py-1 border-b last:border-0">
                      <div>
                        <p className="font-medium">{part.partNumber}</p>
                        <p className="text-sm text-gray-600">{part.description}</p>
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
              
              <p className="text-gray-600">Gewinn:</p>
              <p className="font-medium text-right">{parseFloat(desiredProfit).toFixed(2)} €</p>
              
              <p className="text-gray-700 font-bold">Verkaufspreis:</p>
              <p className="font-bold text-right text-blue-700">{calculateSellingPrice().toFixed(2)} €</p>
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