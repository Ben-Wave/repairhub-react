// 3. Frontend Komponente - frontend/src/components/admin/UserManagement.js (NEUE DATEI)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import CreateRoleModal from './CreateRoleModal';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
        <p className="text-gray-600">Verwalten Sie Benutzerkonten und Berechtigungen</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Benutzer ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Rollen ({roles.length})
          </button>
        </nav>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-3">
          {activeTab === 'users' && (
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2"
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
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span>Neue Rolle erstellen</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'users' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          user.isActive ? 'bg-indigo-500' : 'bg-gray-400'
                        }`}>
                          <span className="text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'manager' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getRoleDisplay(user)}
                          </span>
                        </div>
                        <div className="flex items-center mt-1">
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <span className="mx-2 text-gray-300">•</span>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                        {user.lastLogin && (
                          <p className="text-xs text-gray-400">
                            Letzter Login: {new Date(user.lastLogin).toLocaleDateString('de-DE')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Aktiv' : 'Inaktiv'}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          Erstellt: {new Date(user.createdAt).toLocaleDateString('de-DE')}
                        </p>
                        {user.createdBy && (
                          <p className="text-xs text-gray-400">
                            von {user.createdBy.name}
                          </p>
                        )}
                      </div>

                      {/* Aktions-Buttons */}
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user._id, user.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            user.isActive 
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {user.isActive ? 'Deaktivieren' : 'Aktivieren'}
                        </button>
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          Löschen
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Berechtigungen anzeigen */}
                  {user.roleId && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Berechtigungen:</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <strong>Geräte:</strong>
                          <div>Ansehen: {getPermissionIcon(user.roleId.permissions.devices.view)}</div>
                          <div>Erstellen: {getPermissionIcon(user.roleId.permissions.devices.create)}</div>
                          <div>Bearbeiten: {getPermissionIcon(user.roleId.permissions.devices.edit)}</div>
                          <div>Löschen: {getPermissionIcon(user.roleId.permissions.devices.delete)}</div>
                        </div>
                        <div>
                          <strong>Ersatzteile:</strong>
                          <div>Ansehen: {getPermissionIcon(user.roleId.permissions.parts.view)}</div>
                          <div>Erstellen: {getPermissionIcon(user.roleId.permissions.parts.create)}</div>
                          <div>Bearbeiten: {getPermissionIcon(user.roleId.permissions.parts.edit)}</div>
                          <div>Löschen: {getPermissionIcon(user.roleId.permissions.parts.delete)}</div>
                        </div>
                        <div>
                          <strong>Reseller:</strong>
                          <div>Ansehen: {getPermissionIcon(user.roleId.permissions.resellers.view)}</div>
                          <div>Erstellen: {getPermissionIcon(user.roleId.permissions.resellers.create)}</div>
                          <div>Zuweisen: {getPermissionIcon(user.roleId.permissions.resellers.assign)}</div>
                        </div>
                        <div>
                          <strong>System:</strong>
                          <div>Benutzer: {getPermissionIcon(user.roleId.permissions.system.userManagement)}</div>
                          <div>Einstellungen: {getPermissionIcon(user.roleId.permissions.system.settings)}</div>
                          <div>Statistiken: {getPermissionIcon(user.roleId.permissions.system.statistics)}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {roles.map((role) => (
              <li key={role._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{role.displayName}</h3>
                      <p className="text-sm text-gray-500">System-Name: {role.name}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                        Bearbeiten
                      </button>
                    </div>
                  </div>
                  
                  {/* Berechtigungsübersicht */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <strong>Geräte:</strong>
                        <div>Ansehen: {getPermissionIcon(role.permissions.devices.view)}</div>
                        <div>Erstellen: {getPermissionIcon(role.permissions.devices.create)}</div>
                        <div>Bearbeiten: {getPermissionIcon(role.permissions.devices.edit)}</div>
                        <div>Löschen: {getPermissionIcon(role.permissions.devices.delete)}</div>
                      </div>
                      <div>
                        <strong>Ersatzteile:</strong>
                        <div>Ansehen: {getPermissionIcon(role.permissions.parts.view)}</div>
                        <div>Erstellen: {getPermissionIcon(role.permissions.parts.create)}</div>
                        <div>Bearbeiten: {getPermissionIcon(role.permissions.parts.edit)}</div>
                        <div>Löschen: {getPermissionIcon(role.permissions.parts.delete)}</div>
                      </div>
                      <div>
                        <strong>Reseller:</strong>
                        <div>Ansehen: {getPermissionIcon(role.permissions.resellers.view)}</div>
                        <div>Erstellen: {getPermissionIcon(role.permissions.resellers.create)}</div>
                        <div>Bearbeiten: {getPermissionIcon(role.permissions.resellers.edit)}</div>
                        <div>Zuweisen: {getPermissionIcon(role.permissions.resellers.assign)}</div>
                      </div>
                      <div>
                        <strong>System:</strong>
                        <div>Benutzer: {getPermissionIcon(role.permissions.system.userManagement)}</div>
                        <div>Einstellungen: {getPermissionIcon(role.permissions.system.settings)}</div>
                        <div>Statistiken: {getPermissionIcon(role.permissions.system.statistics)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
    </div>
  );
};

export default UserManagement;