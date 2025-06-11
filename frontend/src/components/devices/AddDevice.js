import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceContext } from '../../context/DeviceContext';
import Spinner from '../layout/Spinner';
import Alert from '../layout/Alert';

const AddDevice = () => {
  const { checkImei, loading, error, clearErrors } = useContext(DeviceContext);
  const navigate = useNavigate();

  const [imei, setImei] = useState('');
  const [alert, setAlert] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    if (imei.trim() === '') {
      setAlert('Bitte geben Sie eine IMEI-Nummer ein');
      return;
    }

    try {
      const device = await checkImei(imei);
      navigate(`/devices/${device._id}`);
    } catch (err) {
      setAlert(err.response?.data?.error || 'Fehler bei der IMEI-Überprüfung');
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {/* Header - Mobile optimized */}
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-blue-900">Neues Gerät hinzufügen</h2>
            <p className="text-sm sm:text-base text-gray-600">Geben Sie die IMEI-Nummer ein, um das Gerät zu identifizieren</p>
          </div>

          {/* Alerts - Mobile optimized */}
          {alert && <Alert message={alert} type="error" onClose={() => setAlert(null)} />}
          {error && <Alert message={error} type="error" onClose={clearErrors} />}

          {/* Form - Mobile optimized */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label htmlFor="imei" className="block text-sm font-medium text-gray-700 mb-2">
                IMEI-Nummer *
              </label>
              <input
                type="text"
                id="imei"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                placeholder="IMEI eingeben..."
                required
              />
              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>IMEI finden:</strong>
                </p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Auf der Geräteverpackung</li>
                  <li>• Unter *#06# auf dem Gerät</li>
                  <li>• In den Einstellungen → Über das Telefon</li>
                  <li>• Auf dem SIM-Kartenschacht</li>
                </ul>
              </div>
            </div>

            {/* IMEI Format Validation - Mobile friendly */}
            {imei && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${
                    imei.length === 15 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></span>
                  <span className="text-sm text-gray-700">
                    IMEI-Länge: {imei.length}/15 Zeichen
                  </span>
                </div>
                {imei.length === 15 && (
                  <p className="text-xs text-green-600 mt-1">✓ IMEI-Format korrekt</p>
                )}
                {imei.length > 0 && imei.length !== 15 && (
                  <p className="text-xs text-yellow-600 mt-1">⚠ IMEI sollte 15 Zeichen haben</p>
                )}
              </div>
            )}

            {/* Action Buttons - Mobile optimized */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/devices')}
                className="w-full sm:w-auto px-4 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 order-2 sm:order-1"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 order-1 sm:order-2"
                disabled={loading || !imei.trim()}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird abgefragt...
                  </div>
                ) : (
                  'IMEI überprüfen'
                )}
              </button>
            </div>
          </form>

          {/* Help Section - Mobile optimized */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">❓ Häufige Fragen</h3>
            <div className="space-y-3">
              <details className="bg-gray-50 rounded-lg">
                <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  Was passiert nach der IMEI-Eingabe?
                </summary>
                <div className="px-3 pb-3">
                  <p className="text-xs text-gray-600">
                    Das System fragt automatisch die Gerätedaten ab und zeigt Ihnen alle verfügbaren Informationen an. 
                    Sie können dann die Reparaturdetails hinzufügen.
                  </p>
                </div>
              </details>
              
              <details className="bg-gray-50 rounded-lg">
                <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  Was wenn die IMEI nicht gefunden wird?
                </summary>
                <div className="px-3 pb-3">
                  <p className="text-xs text-gray-600">
                    Bei unbekannten Geräten können Sie die Grunddaten manuell eingeben. 
                    Das System erstellt dann einen neuen Eintrag für das Gerät.
                  </p>
                </div>
              </details>
              
              <details className="bg-gray-50 rounded-lg">
                <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                  Ist die IMEI-Nummer sicher?
                </summary>
                <div className="px-3 pb-3">
                  <p className="text-xs text-gray-600">
                    Die IMEI wird nur zur Geräteidentifikation verwendet und sicher in Ihrer Datenbank gespeichert. 
                    Keine Weitergabe an Dritte.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDevice;