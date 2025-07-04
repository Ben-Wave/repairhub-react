// CreateUserModal.js - frontend/src/components/admin/CreateUserModal.js - MIT E-MAIL-EINLADUNGEN
import React, { useState } from 'react';
import axios from 'axios';

const CreateUserModal = ({ onClose, onUserCreated, roles }) => {
  const [useEmailInvite, setUseEmailInvite] = useState(true); // Standard: E-Mail-Einladungen
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'admin',
    roleId: '',
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
        const response = await axios.post('/api/user-management/invite-user', {
          email: formData.email,
          name: formData.name,
          role: formData.role,
          roleId: formData.roleId || null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSuccess({
          type: 'invite',
          message: 'Einladung erfolgreich gesendet!',
          details: response.data
        });
      } else {
        // ALT: Direktes Erstellen mit temporärem Passwort
        const response = await axios.post('/api/user-management/users', {
          username: formData.username,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          roleId: formData.roleId || null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setSuccess({
          type: 'created',
          message: 'Benutzer erfolgreich erstellt!',
          details: response.data
        });
      }
      
      onUserCreated();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Verarbeiten der Anfrage');
    } finally {
      setLoading(false);
    }
  };

  // Success View
  if (success) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="text-center">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {success.message}
              </h3>
            </div>
            
            {success.type === 'invite' ? (
              // E-Mail-Einladung erfolgreich
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <h4 className="font-medium text-blue-800 mb-2">📧 E-Mail-Einladung versendet</h4>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>An:</strong> {formData.email}</p>
                  <p><strong>Name:</strong> {formData.name || 'Wird bei Registrierung festgelegt'}</p>
                  <p><strong>Rolle:</strong> {formData.role}</p>
                  <div className="border-t border-blue-200 pt-2 mt-3">
                    <p className="text-xs">
                      📨 Der Benutzer erhält eine E-Mail mit einem Registrierungslink.<br/>
                      ⏰ <strong>Gültigkeit:</strong> 48 Stunden
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Direktes Erstellen (alte Methode)
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <h4 className="font-medium text-yellow-800 mb-2">📋 Temporäre Anmeldedaten</h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p><strong>Benutzername:</strong> {success.details.username}</p>
                  <p><strong>Temporäres Passwort:</strong> 
                    <span className="font-mono bg-yellow-100 px-2 py-1 rounded ml-2">
                      {success.details.temporaryPassword}
                    </span>
                  </p>
                  <div className="border-t border-yellow-200 pt-2 mt-3">
                    <p className="text-xs">
                      ⚠️ Der Benutzer muss beim ersten Login ein neues Passwort festlegen.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>E-Mail:</strong> {formData.email}</p>
                <p><strong>Rolle:</strong> {formData.role}</p>
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
    );
  }

  // Create Form
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Neuen Benutzer hinzufügen
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
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
                  <div className="font-medium text-green-700">📧 E-Mail-Einladung (Empfohlen)</div>
                  <div className="text-sm text-gray-600">Benutzer erhält E-Mail mit Registrierungslink</div>
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
              <label className="block text-sm font-medium text-gray-700">E-Mail-Adresse *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="benutzer@firma.de"
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
                <label className="block text-sm font-medium text-gray-700">Benutzername *</label>
                <input
                  type="text"
                  name="username"
                  required={!useEmailInvite}
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="z.B. max.mustermann"
                />
                <p className="text-xs text-gray-500 mt-1">
                  🔑 Wird auch als temporäres Passwort verwendet
                </p>
              </div>
            )}

            {/* Name (optional bei E-Mail-Einladung) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vollständiger Name {useEmailInvite ? '(Optional)' : '*'}
              </label>
              <input
                type="text"
                name="name"
                required={!useEmailInvite}
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Max Mustermann"
              />
              {useEmailInvite && (
                <p className="text-xs text-gray-500 mt-1">
                  Kann auch bei der Registrierung festgelegt werden
                </p>
              )}
            </div>

            {/* Rolle */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Basis-Rolle *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="viewer">Betrachter</option>
              </select>
            </div>

            {/* Detaillierte Rolle */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Detaillierte Rolle (Optional)</label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">-- Standard-Berechtigungen verwenden --</option>
                {roles.map(role => (
                  <option key={role._id} value={role._id}>{role.displayName}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Überschreibt die Standard-Berechtigungen der Basis-Rolle
              </p>
            </div>

            {/* Info-Box basierend auf gewählter Methode */}
            {useEmailInvite ? (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <div className="text-blue-400 text-lg mr-2">📧</div>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">E-Mail-Einladung</p>
                    <ul className="text-xs space-y-1">
                      <li>• Benutzer erhält E-Mail mit sicherem Registrierungslink</li>
                      <li>• Kann eigenen Benutzernamen und Passwort wählen</li>
                      <li>• Link ist 48 Stunden gültig</li>
                      <li>• Moderne und sichere Methode</li>
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
                      <li>• Benutzer muss beim ersten Login Passwort ändern</li>
                      <li>• Weniger sicher als E-Mail-Einladung</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md disabled:opacity-50 ${
                  useEmailInvite 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {loading 
                  ? (useEmailInvite ? 'Sende Einladung...' : 'Erstelle Benutzer...') 
                  : (useEmailInvite ? '📧 Einladung senden' : '🔑 Benutzer erstellen')
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;