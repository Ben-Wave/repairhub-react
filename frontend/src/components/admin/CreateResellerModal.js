// frontend/src/components/admin/CreateResellerModal.js - MIT E-MAIL-EINLADUNGEN
import React, { useState } from 'react';
import axios from 'axios';

const CreateResellerModal = ({ onClose, onResellerCreated }) => {
  const [useEmailInvite, setUseEmailInvite] = useState(true); // Standard: E-Mail-Einladungen
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    company: '',
    phone: '',
    // Für alte Methode:
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      
      if (useEmailInvite) {
        // NEU: E-Mail-Einladung senden
        const response = await axios.post('/api/admin/invite-reseller', {
          email: formData.email,
          name: formData.name,
          company: formData.company,
          phone: formData.phone
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSuccess({
          type: 'invite',
          message: 'Reseller-Einladung erfolgreich gesendet!',
          details: response.data
        });
      } else {
        // ALT: Direktes Erstellen mit temporärem Passwort
        const response = await axios.post('/api/admin/resellers', {
          username: formData.username,
          email: formData.email,
          name: formData.name,
          company: formData.company,
          phone: formData.phone
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSuccess({
          type: 'created',
          message: 'Reseller erfolgreich erstellt!',
          details: response.data
        });
      }
      
      onResellerCreated();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Verarbeiten der Anfrage');
    } finally {
      setLoading(false);
    }
  };

  // Success View
  if (success) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
        <div className="relative min-h-screen flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="text-center">
                <div className="text-green-600 text-5xl mb-4">✓</div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {success.message}
                </h3>
              </div>
              
              {success.type === 'invite' ? (
                // E-Mail-Einladung erfolgreich
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <h4 className="font-medium text-green-800 mb-2">🏪 Reseller-Einladung versendet</h4>
                  <div className="text-sm text-green-700 space-y-2">
                    <p><strong>An:</strong> {formData.email}</p>
                    <p><strong>Name:</strong> {formData.name || 'Wird bei Registrierung festgelegt'}</p>
                    {formData.company && <p><strong>Firma:</strong> {formData.company}</p>}
                    {formData.phone && <p><strong>Telefon:</strong> {formData.phone}</p>}
                    <div className="border-t border-green-200 pt-2 mt-3">
                      <p className="text-xs">
                        📨 Der Reseller erhält eine E-Mail mit einem Registrierungslink.<br/>
                        ⏰ <strong>Gültigkeit:</strong> 48 Stunden
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                // Direktes Erstellen (alte Methode)
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                  <h4 className="font-medium text-yellow-800 mb-2">🔑 Temporäre Anmeldedaten</h4>
                  <div className="text-sm text-yellow-700 space-y-2">
                    <p><strong>Benutzername:</strong> {success.details.username}</p>
                    <p><strong>Temporäres Passwort:</strong> 
                      <span className="font-mono bg-yellow-100 px-2 py-1 rounded ml-2">
                        {success.details.temporaryPassword}
                      </span>
                    </p>
                    <div className="border-t border-yellow-200 pt-2 mt-3">
                      <p className="text-xs">
                        ⚠️ Der Reseller muss beim ersten Login ein neues Passwort festlegen.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-md mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Details:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>E-Mail:</strong> {formData.email}</p>
                  {formData.company && <p><strong>Firma:</strong> {formData.company}</p>}
                  {success.details.messageId && (
                    <p><strong>E-Mail-ID:</strong> <span className="font-mono text-xs">{success.details.messageId}</span></p>
                  )}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Form
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 leading-tight">
                  🏪 Neuen Reseller hinzufügen
                </h3>
              </div>
              <button
                onClick={onClose}
                className="ml-3 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Methoden-Auswahl */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-3">Hinzufügemethode:</label>
              <div className="space-y-2">
                <label className="flex items-start">
                  <input
                    type="radio"
                    checked={useEmailInvite}
                    onChange={() => setUseEmailInvite(true)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-green-700">🏪 E-Mail-Einladung (Empfohlen)</div>
                    <div className="text-sm text-gray-600">Reseller erhält E-Mail mit Registrierungslink</div>
                  </div>
                </label>
                <label className="flex items-start">
                  <input
                    type="radio"
                    checked={!useEmailInvite}
                    onChange={() => setUseEmailInvite(false)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <div className="font-medium text-orange-600">🔑 Direkt erstellen (Veraltet)</div>
                    <div className="text-sm text-gray-600">Account sofort mit temporärem Passwort erstellen</div>
                  </div>
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* E-Mail (immer erforderlich) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Adresse *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="reseller@firma.de"
                />
                {useEmailInvite && (
                  <p className="text-xs text-gray-500 mt-1">
                    📨 Registrierungslink wird an diese Adresse gesendet
                  </p>
                )}
              </div>

              {/* Benutzername (nur für direkte Erstellung) */}
              {!useEmailInvite && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Benutzername *
                  </label>
                  <input
                    type="text"
                    name="username"
                    required={!useEmailInvite}
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    placeholder="z.B. mueller_reseller"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    🔑 Wird auch als temporäres Passwort verwendet
                  </p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name {useEmailInvite ? '(Optional)' : '*'}
                </label>
                <input
                  type="text"
                  name="name"
                  required={!useEmailInvite}
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Max Mustermann"
                />
                {useEmailInvite && (
                  <p className="text-xs text-gray-500 mt-1">
                    Kann auch bei der Registrierung festgelegt werden
                  </p>
                )}
              </div>

              {/* Firma */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firma (optional)
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Mustermann GmbH"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon (optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="+49 123 456 789"
                />
              </div>

              {/* Info-Box basierend auf gewählter Methode */}
              {useEmailInvite ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-start">
                    <div className="text-green-400 text-lg mr-2">🏪</div>
                    <div className="text-sm text-green-700">
                      <p className="font-medium mb-1">Reseller-Einladung</p>
                      <ul className="text-xs space-y-1">
                        <li>• Reseller erhält professionelle Einladungs-E-Mail</li>
                        <li>• Kann eigenen Benutzernamen und Passwort wählen</li>
                        <li>• Link ist 48 Stunden gültig</li>
                        <li>• Moderne und sichere Methode</li>
                        <li>• Integrierte Reseller-Vorteile werden erklärt</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                  <div className="flex items-start">
                    <div className="text-orange-400 text-lg mr-2">⚠️</div>
                    <div className="text-sm text-orange-700">
                      <p className="font-medium mb-1">Direktes Erstellen (Veraltet)</p>
                      <ul className="text-xs space-y-1">
                        <li>• Account wird sofort erstellt</li>
                        <li>• Temporäres Passwort = Benutzername</li>
                        <li>• Reseller muss beim ersten Login Passwort ändern</li>
                        <li>• Weniger professionell als E-Mail-Einladung</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview für alte Methode */}
              {!useEmailInvite && formData.username && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Vorschau der Login-Daten:</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Benutzername:</strong> {formData.username}</p>
                    <p><strong>Initiales Passwort:</strong> {formData.username}</p>
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ Der Reseller muss das Passwort beim ersten Login ändern
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 order-2 sm:order-1"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.email || (!useEmailInvite && (!formData.username || !formData.name))}
                  className={`w-full sm:w-auto px-4 py-3 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 order-1 sm:order-2 ${
                    useEmailInvite 
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                      : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {useEmailInvite ? 'Sende Einladung...' : 'Erstelle Reseller...'}
                    </div>
                  ) : (
                    useEmailInvite ? '🏪 Einladung senden' : '🔑 Reseller erstellen'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateResellerModal;