// frontend/src/components/admin/CreateRoleModal.js - ERWEITERT
import React, { useState } from 'react';
import axios from 'axios';

const CreateRoleModal = ({ onClose, onRoleCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    permissions: {
      devices: { view: false, create: false, edit: false, delete: false },
      parts: { view: false, create: false, edit: false, delete: false },
      resellers: { view: false, create: false, edit: false, delete: false, assign: false },
      system: { userManagement: false, settings: false, statistics: false },
      tools: { priceCalculator: false } // NEU
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quickSetup, setQuickSetup] = useState(''); // NEU

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePermissionChange = (category, permission, value) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [category]: {
          ...formData.permissions[category],
          [permission]: value
        }
      }
    });
  };

  // NEU: Quick Setup Handler
  const handleQuickSetup = (setupType) => {
    let newPermissions = {
      devices: { view: false, create: false, edit: false, delete: false },
      parts: { view: false, create: false, edit: false, delete: false },
      resellers: { view: false, create: false, edit: false, delete: false, assign: false },
      system: { userManagement: false, settings: false, statistics: false },
      tools: { priceCalculator: false }
    };

    switch (setupType) {
      case 'calculator_only':
        newPermissions.tools.priceCalculator = true;
        newPermissions.parts.view = true; // Benötigt für Preisrechner
        setFormData({
          ...formData,
          name: 'calculator_user',
          displayName: 'Preisrechner Benutzer',
          permissions: newPermissions
        });
        break;
      case 'viewer':
        newPermissions.devices.view = true;
        newPermissions.parts.view = true;
        newPermissions.system.statistics = true;
        newPermissions.tools.priceCalculator = true;
        setFormData({
          ...formData,
          name: 'viewer',
          displayName: 'Betrachter',
          permissions: newPermissions
        });
        break;
      case 'manager':
        newPermissions.devices = { view: true, create: true, edit: true, delete: false };
        newPermissions.parts = { view: true, create: true, edit: true, delete: false };
        newPermissions.resellers = { view: true, create: false, edit: false, delete: false, assign: true };
        newPermissions.system.statistics = true;
        newPermissions.tools.priceCalculator = true;
        setFormData({
          ...formData,
          name: 'manager',
          displayName: 'Manager',
          permissions: newPermissions
        });
        break;
      default:
        break;
    }
    setQuickSetup(setupType);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post('/api/user-management/roles', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRoleCreated();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Erstellen der Rolle');
    } finally {
      setLoading(false);
    }
  };

  const PermissionCheckbox = ({ category, permission, label }) => (
    <label className="flex items-center space-x-2 text-sm">
      <input
        type="checkbox"
        checked={formData.permissions[category][permission]}
        onChange={(e) => handlePermissionChange(category, permission, e.target.checked)}
        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      <span>{label}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Neue Rolle erstellen
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* NEU: Quick Setup Buttons */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-900 mb-3">🚀 Schnell-Setup</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleQuickSetup('calculator_only')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  quickSetup === 'calculator_only' 
                    ? 'border-blue-500 bg-blue-100 text-blue-800' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold">🧮 Nur Preisrechner</div>
                <div className="text-sm text-gray-600">Zugriff nur auf den Preisrechner</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSetup('viewer')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  quickSetup === 'viewer' 
                    ? 'border-blue-500 bg-blue-100 text-blue-800' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold">👁️ Betrachter</div>
                <div className="text-sm text-gray-600">Kann alles ansehen, nichts ändern</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSetup('manager')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  quickSetup === 'manager' 
                    ? 'border-blue-500 bg-blue-100 text-blue-800' 
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold">👨‍💼 Manager</div>
                <div className="text-sm text-gray-600">Kann verwalten, aber nicht löschen</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">System-Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="z.B. calculator_user"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Anzeige-Name *</label>
                <input
                  type="text"
                  name="displayName"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="z.B. Preisrechner Benutzer"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">Berechtigungen</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {/* Geräte-Berechtigungen */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">📱 Geräte</h5>
                  <div className="space-y-2">
                    <PermissionCheckbox category="devices" permission="view" label="Ansehen" />
                    <PermissionCheckbox category="devices" permission="create" label="Erstellen" />
                    <PermissionCheckbox category="devices" permission="edit" label="Bearbeiten" />
                    <PermissionCheckbox category="devices" permission="delete" label="Löschen" />
                  </div>
                </div>

                {/* Ersatzteile-Berechtigungen */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">🔧 Ersatzteile</h5>
                  <div className="space-y-2">
                    <PermissionCheckbox category="parts" permission="view" label="Ansehen" />
                    <PermissionCheckbox category="parts" permission="create" label="Erstellen" />
                    <PermissionCheckbox category="parts" permission="edit" label="Bearbeiten" />
                    <PermissionCheckbox category="parts" permission="delete" label="Löschen" />
                  </div>
                </div>

                {/* Reseller-Berechtigungen */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">👥 Reseller</h5>
                  <div className="space-y-2">
                    <PermissionCheckbox category="resellers" permission="view" label="Ansehen" />
                    <PermissionCheckbox category="resellers" permission="create" label="Erstellen" />
                    <PermissionCheckbox category="resellers" permission="edit" label="Bearbeiten" />
                    <PermissionCheckbox category="resellers" permission="delete" label="Löschen" />
                    <PermissionCheckbox category="resellers" permission="assign" label="Geräte zuweisen" />
                  </div>
                </div>

                {/* System-Berechtigungen */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">⚙️ System</h5>
                  <div className="space-y-2">
                    <PermissionCheckbox category="system" permission="userManagement" label="Benutzerverwaltung" />
                    <PermissionCheckbox category="system" permission="settings" label="Einstellungen" />
                    <PermissionCheckbox category="system" permission="statistics" label="Statistiken" />
                  </div>
                </div>

                {/* NEU: Tools-Berechtigungen */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-3">🧮 Tools</h5>
                  <div className="space-y-2">
                    <PermissionCheckbox category="tools" permission="priceCalculator" label="Preisrechner" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Erstelle...' : 'Rolle erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;