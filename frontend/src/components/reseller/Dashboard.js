// frontend/src/components/reseller/Dashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DeviceCard from './DeviceCard';
import Stats from './Stats';
import ChangePasswordModal from './ChangePasswordModal';

const ResellerDashboard = ({ reseller, onLogout }) => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    fetchDevices();
    fetchStats();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('resellerToken');
      const response = await axios.get('/api/reseller/devices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(response.data);
    } catch (error) {
      setError('Fehler beim Laden der Geräte');
      if (error.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('resellerToken');
      const response = await axios.get('/api/reseller/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('resellerToken');
    localStorage.removeItem('resellerData');
    // GEÄNDERT: Bleibt bei Reseller-Login, nicht zur Admin-Seite
    onLogout();
  };

  const handleDeviceUpdate = () => {
    fetchDevices();
    fetchStats();
  };

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
    // Optional: Success message anzeigen
    alert('✅ Passwort erfolgreich geändert!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🔧</span>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Reseller Dashboard</h1>
                  <p className="text-gray-600">Willkommen, {reseller.name}</p>
                  {reseller.company && (
                    <p className="text-sm text-gray-500">{reseller.company}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Benutzer-Info */}
              <div className="hidden md:block text-right mr-3">
                <p className="text-sm font-medium text-gray-900">{reseller.name}</p>
                <p className="text-xs text-gray-500">@{reseller.username}</p>
                {reseller.email && (
                  <p className="text-xs text-gray-500">{reseller.email}</p>
                )}
              </div>

              {/* Passwort ändern Button */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
                title="Passwort ändern"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h2m2 5.09V9a2 2 0 012-2m0 0V5a2 2 0 012-2m-2 4h.01"></path>
                </svg>
                <span className="hidden sm:inline">Passwort ändern</span>
              </button>
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
                title="Abmelden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span className="hidden sm:inline">Abmelden</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Stats */}
        <Stats stats={stats} />

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schnellaktionen</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-600 text-2xl mb-2">📦</div>
              <h4 className="font-medium text-blue-900">Neue Zuweisungen</h4>
              <p className="text-blue-700 text-sm">
                {devices.filter(d => d.status === 'assigned').length} Geräte warten auf Bestätigung
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <div className="text-green-600 text-2xl mb-2">💰</div>
              <h4 className="font-medium text-green-900">Verkaufsbereit</h4>
              <p className="text-green-700 text-sm">
                {devices.filter(d => d.status === 'received').length} Geräte können verkauft werden
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="text-yellow-600 text-2xl mb-2">📊</div>
              <h4 className="font-medium text-yellow-900">Umsatz gesamt</h4>
              <p className="text-yellow-700 text-sm">
                {stats.totalRevenue ? `${stats.totalRevenue.toLocaleString('de-DE')}€` : '0€'} verdient
              </p>
            </div>
          </div>
        </div>

        {/* Device Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Ihre Geräte</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Gesamt: {devices.length}</span>
              <span>•</span>
              <span className="text-yellow-600">Zugewiesen: {devices.filter(d => d.status === 'assigned').length}</span>
              <span>•</span>
              <span className="text-blue-600">Erhalten: {devices.filter(d => d.status === 'received').length}</span>
              <span>•</span>
              <span className="text-green-600">Verkauft: {devices.filter(d => d.status === 'sold').length}</span>
            </div>
          </div>

          {devices.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📱</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Geräte zugewiesen</h3>
                <p className="text-gray-500 mb-6">
                  Sie haben aktuell keine Geräte zugewiesen bekommen.<br />
                  Wenden Sie sich an Ihren Administrator für neue Zuweisungen.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2">So funktioniert es:</h4>
                  <ol className="text-blue-700 text-sm text-left space-y-1">
                    <li>1. Administrator weist Ihnen Geräte zu</li>
                    <li>2. Sie bestätigen den Erhalt</li>
                    <li>3. Sie verkaufen das Gerät</li>
                    <li>4. Sie melden den Verkauf</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devices.map(deviceData => (
                <DeviceCard
                  key={deviceData.assignmentId}
                  deviceData={deviceData}
                  onUpdate={handleDeviceUpdate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Help Section - AKTUALISIERT */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hilfe & Support</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📞 Kontakt</h4>
              <p className="text-gray-600 text-sm mb-2">
                Bei Fragen oder Problemen wenden Sie sich an:
              </p>
              <div className="text-sm text-gray-700">
                <p>📧 Repairhub@mail.de</p>
                <p>📱 017631762175</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🎯 Status-Übersicht</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                  <span className="text-gray-700"><strong>Zugewiesen:</strong> Gerät wurde Ihnen zugewiesen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                  <span className="text-gray-700"><strong>Erhalten:</strong> Sie haben den Erhalt bestätigt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700"><strong>Verkauft:</strong> Verkauf wurde gemeldet</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* NEU: Gewinn-Erklärung */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💰 Gewinn-System</h4>
            <p className="text-blue-800 text-sm">
              <strong>Mindestverkaufspreis:</strong> Geht an Repairhub<br />
              <strong>Alles darüber:</strong> Ist Ihr Gewinn!<br />
              <em>Beispiel: Mindestpreis 300€, Verkauf für 350€ → Ihr Gewinn: 50€</em>
            </p>
          </div>
        </div>
      </main>

      {/* Passwort-Ändern Modal */}
      {showPasswordModal && (
        <ChangePasswordModal
          isFirstLogin={false}
          onPasswordChanged={handlePasswordChanged}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

export default ResellerDashboard;