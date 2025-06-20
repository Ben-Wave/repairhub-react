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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    onLogout();
  };

  const handleDeviceUpdate = () => {
    fetchDevices();
    fetchStats();
  };

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
    alert('✅ Passwort erfolgreich geändert!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-24 sm:w-24 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            {/* Logo and Title - Mobile optimized */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <span className="text-2xl sm:text-3xl">🔧</span>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  <span className="hidden sm:inline">Reseller Dashboard</span>
                  <span className="sm:hidden">Dashboard</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Willkommen, {reseller.name}
                </p>
                {reseller.company && (
                  <p className="text-xs text-gray-500 truncate hidden sm:block">
                    {reseller.company}
                  </p>
                )}
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right mr-3">
                <p className="text-sm font-medium text-gray-900">{reseller.name}</p>
                <p className="text-xs text-gray-500">@{reseller.username}</p>
                {reseller.email && (
                  <p className="text-xs text-gray-500">{reseller.email}</p>
                )}
              </div>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
                title="Passwort ändern"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h2m2 5.09V9a2 2 0 012-2m0 0V5a2 2 0 012-2m-2 4h.01"></path>
                </svg>
                <span>Passwort ändern</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition duration-200"
                title="Abmelden"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Abmelden</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showMobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden border-t border-gray-200 py-3 space-y-3">
              <div className="px-3 py-2 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{reseller.name}</p>
                <p className="text-xs text-gray-500">@{reseller.username}</p>
                {reseller.email && (
                  <p className="text-xs text-gray-500">{reseller.email}</p>
                )}
                {reseller.company && (
                  <p className="text-xs text-gray-500">{reseller.company}</p>
                )}
              </div>
              
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setShowMobileMenu(false);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m0 0a2 2 0 012 2m-2-2h-6m6 0v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9a2 2 0 012-2h2m2 5.09V9a2 2 0 012-2m0 0V5a2 2 0 012-2m-2 4h.01"></path>
                </svg>
                <span>Passwort ändern</span>
              </button>
              
              <button
                onClick={() => {
                  handleLogout();
                  setShowMobileMenu(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span>Abmelden</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Stats - Already mobile-optimized */}
        <Stats stats={stats} />

        {/* Quick Actions - Mobile optimized */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Schnellaktionen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-blue-600 text-xl sm:text-2xl mb-2">📦</div>
              <h4 className="font-medium text-blue-900 text-sm sm:text-base">Neue Zuweisungen</h4>
              <p className="text-blue-700 text-xs sm:text-sm">
                {devices.filter(d => d.status === 'assigned').length} Geräte warten auf Bestätigung
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-green-600 text-xl sm:text-2xl mb-2">💰</div>
              <h4 className="font-medium text-green-900 text-sm sm:text-base">Verkaufsbereit</h4>
              <p className="text-green-700 text-xs sm:text-sm">
                {devices.filter(d => d.status === 'received').length} Geräte können verkauft werden
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 text-center sm:col-span-2 lg:col-span-1">
              <div className="text-yellow-600 text-xl sm:text-2xl mb-2">📊</div>
              <h4 className="font-medium text-yellow-900 text-sm sm:text-base">Umsatz gesamt</h4>
              <p className="text-yellow-700 text-xs sm:text-sm">
                {stats.totalRevenue ? `${stats.totalRevenue.toLocaleString('de-DE')}€` : '0€'} verdient
              </p>
            </div>
          </div>
        </div>

        {/* Device Section - Mobile optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ihre Geräte</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
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
              <div className="text-center py-8 sm:py-12 px-4">
                <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📱</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Keine Geräte zugewiesen</h3>
                <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">
                  Sie haben aktuell keine Geräte zugewiesen bekommen.<br />
                  Wenden Sie sich an Ihren Administrator für neue Zuweisungen.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 max-w-md mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">So funktioniert es:</h4>
                  <ol className="text-blue-700 text-xs sm:text-sm text-left space-y-1">
                    <li>1. Administrator weist Ihnen Geräte zu</li>
                    <li>2. Sie bestätigen den Erhalt</li>
                    <li>3. Sie verkaufen das Gerät</li>
                    <li>4. Sie melden den Verkauf</li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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

        {/* Help Section - Mobile optimized */}
        <div className="bg-white shadow rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Hilfe & Support</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">📞 Kontakt</h4>
              <p className="text-gray-600 text-xs sm:text-sm mb-2">
                Bei Fragen oder Problemen wenden Sie sich an:
              </p>
              <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                <p>📧 Repairhub@mail.de</p>
                <p>📱 017631762175</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">🎯 Status-Übersicht</h4>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700"><strong>Zugewiesen:</strong> Gerät wurde Ihnen zugewiesen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700"><strong>Erhalten:</strong> Sie haben den Erhalt bestätigt</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></span>
                  <span className="text-gray-700"><strong>Verkauft:</strong> Verkauf wurde gemeldet</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Profit Explanation - Mobile optimized */}
          <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">💰 Gewinn-System</h4>
            <p className="text-blue-800 text-xs sm:text-sm">
              <strong>Mindestverkaufspreis:</strong> Geht an Repairhub<br />
              <strong>Alles darüber:</strong> Ist Ihr Gewinn!<br />
              <em>Beispiel: Mindestpreis 300€, Verkauf für 350€ → Ihr Gewinn: 50€</em>
            </p>
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
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