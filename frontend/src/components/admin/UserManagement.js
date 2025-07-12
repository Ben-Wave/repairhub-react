// UserManagement.js - Mobile-optimiert
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import CreateRoleModal from './CreateRoleModal';
import EditRoleModal from './EditRoleModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState(new Set()); // Für mobile Expansion
  const [expandedRoles, setExpandedRoles] = useState(new Set()); // Für mobile Expansion

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/user-management/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/user-management/roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRoles(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Rollen:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/user-management/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      alert('Fehler beim Löschen des Benutzers: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    }
  };

  const deleteRole = async (roleId) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diese Rolle löschen möchten?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/user-management/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchRoles();
      alert('Rolle erfolgreich gelöscht');
    } catch (error) {
      alert('Fehler beim Löschen der Rolle: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    }
  };

  const resetUserPassword = async (userId, username) => {
    if (!window.confirm(`Passwort für Benutzer "${username}" auf Username zurücksetzen?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(`/api/user-management/users/${userId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert(`Passwort zurückgesetzt! Neues temporäres Passwort: ${response.data.temporaryPassword}`);
    } catch (error) {
      alert('Fehler beim Zurücksetzen des Passworts: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/user-management/users/${userId}`, {
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (error) {
      alert('Fehler beim Ändern des Status: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    }
  };

  const toggleUserExpansion = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const toggleRoleExpansion = (roleId) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId);
    } else {
      newExpanded.add(roleId);
    }
    setExpandedRoles(newExpanded);
  };

  const getRoleDisplay = (user) => {
    if (user.roleId) {
      return user.roleId.displayName;
    }
    return user.role === 'super_admin' ? 'Super Administrator' : 
           user.role === 'admin' ? 'Administrator' :
           user.role === 'manager' ? 'Manager' : 'Betrachter';
  };

  const getPermissionIcon = (hasPermission) => {
    return hasPermission ? '✅' : '❌';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">👤 Benutzerverwaltung</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie Benutzerkonten und Berechtigungen</p>
        </div>

        {/* Tab Navigation - Mobile optimiert */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 Benutzer ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'roles'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🏷️ Rollen ({roles.length})
            </button>
          </nav>
        </div>

        {/* Action Buttons - Mobile optimiert */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="w-full sm:w-auto">
            {activeTab === 'users' && (
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span>Neuen Benutzer erstellen</span>
              </button>
            )}
            {activeTab === 'roles' && (
              <button
                onClick={() => setShowCreateRoleModal(true)}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span>Neue Rolle erstellen</span>
              </button>
            )}
          </div>
        </div>

        {/* Users Tab - Mobile optimiert */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* User Header - immer sichtbar */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    {/* User Info */}
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        user.isActive ? 'bg-indigo-500' : 'bg-gray-400'
                      }`}>
                        <span className="text-white font-medium text-sm sm:text-base">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                            {user.name}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'manager' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getRoleDisplay(user)}
                          </span>
                        </div>
                        
                        <div className="mt-1">
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                          <p className="text-xs text-gray-400">@{user.username}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? '🟢 Aktiv' : '🔴 Inaktiv'}
                          </span>
                          
                          {user.mustChangePassword && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              🔒 PW ändern
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Expand Button */}
                    <button
                      onClick={() => toggleUserExpansion(user._id)}
                      className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className={`w-5 h-5 transform transition-transform ${
                        expandedUsers.has(user._id) ? 'rotate-180' : ''
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Desktop Actions - immer sichtbar auf Desktop */}
                  <div className="hidden lg:flex justify-end mt-4 space-x-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      ✏️ Bearbeiten
                    </button>
                    <button
                      onClick={() => resetUserPassword(user._id, user.username)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      🔑 PW Reset
                    </button>
                    <button
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        user.isActive 
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {user.isActive ? '⏸️ Deaktivieren' : '▶️ Aktivieren'}
                    </button>
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>

                {/* Expanded Content - auf Mobile nur wenn erweitert, auf Desktop immer */}
                <div className={`${expandedUsers.has(user._id) ? 'block' : 'hidden'} lg:block border-t border-gray-200`}>
                  {/* Mobile Actions */}
                  <div className="lg:hidden p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1"
                      >
                        <span>✏️</span>
                        <span>Bearbeiten</span>
                      </button>
                      <button
                        onClick={() => resetUserPassword(user._id, user.username)}
                        className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1"
                      >
                        <span>🔑</span>
                        <span>PW Reset</span>
                      </button>
                      <button
                        onClick={() => toggleUserStatus(user._id, user.isActive)}
                        className={`py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 ${
                          user.isActive 
                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <span>{user.isActive ? '⏸️' : '▶️'}</span>
                        <span>{user.isActive ? 'Deaktivieren' : 'Aktivieren'}</span>
                      </button>
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1"
                      >
                        <span>🗑️</span>
                        <span>Löschen</span>
                      </button>
                    </div>
                  </div>

                  {/* Permissions */}
                  {user.roleId && (
                    <div className="p-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-3">🔐 Berechtigungen:</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="font-semibold text-blue-900 mb-2">📱 Geräte</div>
                          <div className="space-y-1">
                            <div>Ansehen: {getPermissionIcon(user.roleId.permissions.devices.view)}</div>
                            <div>Erstellen: {getPermissionIcon(user.roleId.permissions.devices.create)}</div>
                            <div>Bearbeiten: {getPermissionIcon(user.roleId.permissions.devices.edit)}</div>
                            <div>Löschen: {getPermissionIcon(user.roleId.permissions.devices.delete)}</div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="font-semibold text-green-900 mb-2">🔧 Ersatzteile</div>
                          <div className="space-y-1">
                            <div>Ansehen: {getPermissionIcon(user.roleId.permissions.parts.view)}</div>
                            <div>Erstellen: {getPermissionIcon(user.roleId.permissions.parts.create)}</div>
                            <div>Bearbeiten: {getPermissionIcon(user.roleId.permissions.parts.edit)}</div>
                            <div>Löschen: {getPermissionIcon(user.roleId.permissions.parts.delete)}</div>
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="font-semibold text-purple-900 mb-2">👥 Reseller</div>
                          <div className="space-y-1">
                            <div>Ansehen: {getPermissionIcon(user.roleId.permissions.resellers.view)}</div>
                            <div>Erstellen: {getPermissionIcon(user.roleId.permissions.resellers.create)}</div>
                            <div>Zuweisen: {getPermissionIcon(user.roleId.permissions.resellers.assign)}</div>
                          </div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <div className="font-semibold text-orange-900 mb-2">⚙️ System & Tools</div>
                          <div className="space-y-1">
                            <div>Benutzer: {getPermissionIcon(user.roleId.permissions.system.userManagement)}</div>
                            <div>Einstellungen: {getPermissionIcon(user.roleId.permissions.system.settings)}</div>
                            <div>Statistiken: {getPermissionIcon(user.roleId.permissions.system.statistics)}</div>
                            <div>Preisrechner: {getPermissionIcon(user.roleId.permissions.tools.priceCalculator)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="px-4 pb-4">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>Erstellt: {new Date(user.createdAt).toLocaleDateString('de-DE')}</div>
                      {user.lastLogin && (
                        <div>Letzter Login: {new Date(user.lastLogin).toLocaleDateString('de-DE')}</div>
                      )}
                      {user.createdBy && (
                        <div>Erstellt von: {user.createdBy.name}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Roles Tab - Mobile optimiert */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            {roles.map((role) => (
              <div key={role._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Role Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">{role.displayName}</h3>
                      <p className="text-sm text-gray-500">System-Name: {role.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Erstellt: {new Date(role.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>

                    {/* Mobile Expand Button */}
                    <button
                      onClick={() => toggleRoleExpansion(role._id)}
                      className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className={`w-5 h-5 transform transition-transform ${
                        expandedRoles.has(role._id) ? 'rotate-180' : ''
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Desktop Actions */}
                  <div className="hidden lg:flex mt-4 space-x-2">
                    <button 
                      onClick={() => setEditingRole(role)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      ✏️ Bearbeiten
                    </button>
                    <button 
                      onClick={() => deleteRole(role._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      🗑️ Löschen
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                <div className={`${expandedRoles.has(role._id) ? 'block' : 'hidden'} lg:block border-t border-gray-200`}>
                  {/* Mobile Actions */}
                  <div className="lg:hidden p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setEditingRole(role)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1"
                      >
                        <span>✏️</span>
                        <span>Bearbeiten</span>
                      </button>
                      <button 
                        onClick={() => deleteRole(role._id)}
                        className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1"
                      >
                        <span>🗑️</span>
                        <span>Löschen</span>
                      </button>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">🔐 Berechtigungsübersicht:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="font-semibold text-blue-900 mb-2">📱 Geräte</div>
                        <div className="space-y-1 text-xs">
                          <div>Ansehen: {getPermissionIcon(role.permissions.devices.view)}</div>
                          <div>Erstellen: {getPermissionIcon(role.permissions.devices.create)}</div>
                          <div>Bearbeiten: {getPermissionIcon(role.permissions.devices.edit)}</div>
                          <div>Löschen: {getPermissionIcon(role.permissions.devices.delete)}</div>
                        </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="font-semibold text-green-900 mb-2">🔧 Ersatzteile</div>
                        <div className="space-y-1 text-xs">
                          <div>Ansehen: {getPermissionIcon(role.permissions.parts.view)}</div>
                          <div>Erstellen: {getPermissionIcon(role.permissions.parts.create)}</div>
                          <div>Bearbeiten: {getPermissionIcon(role.permissions.parts.edit)}</div>
                          <div>Löschen: {getPermissionIcon(role.permissions.parts.delete)}</div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="font-semibold text-purple-900 mb-2">👥 Reseller</div>
                        <div className="space-y-1 text-xs">
                          <div>Ansehen: {getPermissionIcon(role.permissions.resellers.view)}</div>
                          <div>Erstellen: {getPermissionIcon(role.permissions.resellers.create)}</div>
                          <div>Bearbeiten: {getPermissionIcon(role.permissions.resellers.edit)}</div>
                          <div>Zuweisen: {getPermissionIcon(role.permissions.resellers.assign)}</div>
                        </div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="font-semibold text-orange-900 mb-2">⚙️ System</div>
                        <div className="space-y-1 text-xs">
                          <div>Benutzer: {getPermissionIcon(role.permissions.system.userManagement)}</div>
                          <div>Einstellungen: {getPermissionIcon(role.permissions.system.settings)}</div>
                          <div>Statistiken: {getPermissionIcon(role.permissions.system.statistics)}</div>
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="font-semibold text-yellow-900 mb-2">🛠️ Tools</div>
                        <div className="space-y-1 text-xs">
                          <div>Preisrechner: {getPermissionIcon(role.permissions.tools.priceCalculator)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'users' && users.length === 0) || (activeTab === 'roles' && roles.length === 0)) && (
          <div className="text-center py-12">
            <div className="text-4xl sm:text-6xl mb-4">
              {activeTab === 'users' ? '👥' : '🏷️'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine {activeTab === 'users' ? 'Benutzer' : 'Rollen'} gefunden
            </h3>
            <p className="text-gray-500 mb-6">
              Erstellen Sie {activeTab === 'users' ? 'einen neuen Benutzer' : 'eine neue Rolle'}, um zu beginnen.
            </p>
            <button
              onClick={() => activeTab === 'users' ? setShowCreateUserModal(true) : setShowCreateRoleModal(true)}
              className={`inline-flex items-center px-4 py-2 rounded-md font-medium text-white transition-colors ${
                activeTab === 'users' 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {activeTab === 'users' ? 'Benutzer erstellen' : 'Rolle erstellen'}
            </button>
          </div>
        )}

        {/* Modals */}
        {showCreateUserModal && (
          <CreateUserModal
            onClose={() => setShowCreateUserModal(false)}
            onUserCreated={() => {
              fetchUsers();
              setShowCreateUserModal(false);
            }}
            roles={roles}
          />
        )}

        {showCreateRoleModal && (
          <CreateRoleModal
            onClose={() => setShowCreateRoleModal(false)}
            onRoleCreated={() => {
              fetchRoles();
              setShowCreateRoleModal(false);
            }}
          />
        )}

        {editingUser && (
          <EditUserModal
            user={editingUser}
            roles={roles}
            onClose={() => setEditingUser(null)}
            onUserUpdated={() => {
              fetchUsers();
              setEditingUser(null);
            }}
          />
        )}

        {editingRole && (
          <EditRoleModal
            role={editingRole}
            onClose={() => setEditingRole(null)}
            onRoleUpdated={() => {
              fetchRoles();
              setEditingRole(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default UserManagement;