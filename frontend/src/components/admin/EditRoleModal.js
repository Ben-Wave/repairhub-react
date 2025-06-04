// EditRoleModal.js - frontend/src/components/admin/EditRoleModal.js
import React, { useState } from 'react';
import axios from 'axios';

const EditRoleModal = ({ role, onClose, onRoleUpdated }) => {
  const [formData, setFormData] = useState({
    displayName: role.displayName || '',
    permissions: {
      devices: {
        view: role.permissions.devices.view || false,
        create: role.permissions.devices.create || false,
        edit: role.permissions.devices.edit || false,
        delete: role.permissions.devices.delete || false
      },
      parts: {
        view: role.permissions.parts.view || false,
        create: role.permissions.parts.create || false,
        edit: role.permissions.parts.edit || false,
        delete: role.permissions.parts.delete || false
      },
      resellers: {
        view: role.permissions.resellers.view || false,
        create: role.permissions.resellers.create || false,
        edit: role.permissions.resellers.edit || false,
        delete: role.permissions.resellers.delete || false,
        assign: role.permissions.resellers.assign || false
      },
      system: {
        userManagement: role.permissions.system.userManagement || false,
        settings: role.permissions.system.settings || false,
        statistics: role.permissions.system.statistics || false
      },
      tools: {
        priceCalculator: role.permissions.tools.priceCalculator || false
      }
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePermissionChange = (category, permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [category]: {
          ...formData.permissions[category],
          [permission]: !formData.permissions[category][permission]
        }
      }
    });
  };

  const handleCategoryToggle = (category) => {
    const currentCategoryPermissions = formData.permissions[category];
    const allEnabled = Object.values(currentCategoryPermissions).every(val => val === true);
    
    const newCategoryPermissions = {};
    Object.keys(currentCategoryPermissions).forEach(permission => {
      newCategoryPermissions[permission] = !allEnabled;
    });

    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [category]: newCategoryPermissions
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/user-management/roles/${role._id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRoleUpdated();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Aktualisieren der Rolle');
    } finally {
      setLoading(false);
    }
  };

  const PermissionSection = ({ title, category, permissions }) => {
    const categoryPermissions = formData.permissions[category];
    const allEnabled = Object.values(categoryPermissions).every(val => val === true);
    const someEnabled = Object.values(categoryPermissions).some(val => val === true);

    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-semibold text-gray-900 flex items-center">
            {title}
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              allEnabled ? 'bg-green-100 text-green-800' :
              someEnabled ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {allEnabled ? 'Alle' : someEnabled ? 'Teilweise' : 'Keine'}
            </span>
          </h4>
          <button
            type="button"
            onClick={() => handleCategoryToggle(category)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              allEnabled 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {allEnabled ? 'Alle deaktivieren' : 'Alle aktivieren'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {Object.keys(permissions).map(permission => (
            <label key={permission} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={categoryPermissions[permission]}
                onChange={() => handlePermissionChange(category, permission)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                {getPermissionLabel(permission)}
              </span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const getPermissionLabel = (permission) => {
    const labels = {
      view: 'Ansehen',
      create: 'Erstellen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      assign: 'Zuweisen',
      userManagement: 'Benutzerverwaltung',
      settings: 'Einstellungen',
      statistics: 'Statistiken',
      priceCalculator: 'Preisrechner'
    };
    return labels[permission] || permission;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      devices: '📱',
      parts: '🔧',
      resellers: '👥',
      system: '⚙️',
      tools: '🧮'
    };
    return icons[category] || '📋';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-medium text-gray-900">
                Rolle bearbeiten: {role.displayName}
              </h3>
              <p className="text-sm text-gray-500">System-Name: {role.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grundeinstellungen */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Grundeinstellungen</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700">Anzeigename *</label>
                <input
                  type="text"
                  name="displayName"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="z.B. Ersatzteil Manager"
                />
                <p className="text-xs text-gray-500 mt-1">
                  System-Name "{role.name}" kann nicht geändert werden
                </p>
              </div>
            </div>

            {/* Berechtigungen */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">🔐 Berechtigungen</h4>
              <div className="space-y-4">
                <PermissionSection
                  title={`${getCategoryIcon('devices')} Geräte-Verwaltung`}
                  category="devices"
                  permissions={formData.permissions.devices}
                />
                
                <PermissionSection
                  title={`${getCategoryIcon('parts')} Ersatzteile-Verwaltung`}
                  category="parts"
                  permissions={formData.permissions.parts}
                />
                
                <PermissionSection
                  title={`${getCategoryIcon('resellers')} Reseller-Verwaltung`}
                  category="resellers"
                  permissions={formData.permissions.resellers}
                />
                
                <PermissionSection
                  title={`${getCategoryIcon('system')} System-Verwaltung`}
                  category="system"
                  permissions={formData.permissions.system}
                />
                
                <PermissionSection
                  title={`${getCategoryIcon('tools')} Tools & Hilfsmittel`}
                  category="tools"
                  permissions={formData.permissions.tools}
                />
              </div>
            </div>

            {/* Berechtigungen Zusammenfassung */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-blue-900 mb-3">📊 Berechtigungen Zusammenfassung</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                {Object.entries(formData.permissions).map(([category, permissions]) => {
                  const enabledCount = Object.values(permissions).filter(p => p).length;
                  const totalCount = Object.keys(permissions).length;
                  return (
                    <div key={category} className="bg-white p-3 rounded border">
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">
                          {getCategoryIcon(category)} {category === 'devices' ? 'Geräte' :
                           category === 'parts' ? 'Ersatzteile' :
                           category === 'resellers' ? 'Reseller' :
                           category === 'system' ? 'System' : 'Tools'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          enabledCount === totalCount ? 'bg-green-100 text-green-800' :
                          enabledCount > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {enabledCount}/{totalCount}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        {Object.entries(permissions)
                          .filter(([, enabled]) => enabled)
                          .map(([perm]) => getPermissionLabel(perm))
                          .join(', ') || 'Keine Berechtigungen'
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Aktions-Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
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
                {loading ? 'Speichere...' : 'Rolle aktualisieren'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditRoleModal;