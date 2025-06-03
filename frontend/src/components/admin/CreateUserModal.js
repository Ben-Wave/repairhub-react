// CreateUserModal.js - frontend/src/components/admin/CreateUserModal.js - OHNE PASSWORT
import React, { useState } from 'react';
import axios from 'axios';

const CreateUserModal = ({ onClose, onUserCreated, roles }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    role: 'admin',
    roleId: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdUser, setCreatedUser] = useState(null);

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

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post('/api/user-management/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Zeige das temporäre Passwort an
      setCreatedUser({
        ...response.data,
        temporaryPassword: formData.username
      });
      
      onUserCreated();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Erstellen des Benutzers');
    } finally {
      setLoading(false);
    }
  };

  // Success View mit temporärem Passwort
  if (createdUser) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="text-center">
              <div className="text-green-600 text-5xl mb-4">✓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Benutzer erfolgreich erstellt
              </h3>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <h4 className="font-medium text-yellow-800 mb-2">📋 Wichtige Information:</h4>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>Benutzername:</strong> {createdUser.username}</p>
                <p><strong>Temporäres Passwort:</strong> 
                  <span className="font-mono bg-yellow-100 px-2 py-1 rounded ml-2">
                    {createdUser.temporaryPassword}
                  </span>
                </p>
                <div className="border-t border-yellow-200 pt-2 mt-3">
                  <p className="text-xs">
                    ⚠️ <strong>Hinweis:</strong> Der Benutzer muss beim ersten Login ein neues Passwort festlegen.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Benutzerdetails:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {createdUser.name}</p>
                <p><strong>E-Mail:</strong> {createdUser.email}</p>
                <p><strong>Rolle:</strong> {createdUser.role}</p>
                {createdUser.roleId && (
                  <p><strong>Detaillierte Rolle:</strong> Zugewiesen</p>
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
            Neuen Benutzer erstellen
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Info-Box über automatisches Passwort */}
          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-start">
              <div className="text-blue-400 text-lg mr-2">ℹ️</div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Automatisches Passwort-System</p>
                <p>Das temporäre Passwort wird automatisch auf den Benutzernamen gesetzt. Der Benutzer muss beim ersten Login ein neues Passwort wählen.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Benutzername *</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="z.B. max.mustermann"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird auch als temporäres Passwort verwendet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail *</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="max.mustermann@firma.de"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Vollständiger Name *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Max Mustermann"
              />
            </div>

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
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Erstelle...' : 'Benutzer erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUserModal;