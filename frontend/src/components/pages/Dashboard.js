// frontend/src/components/pages/Dashboard.js - KORRIGIERT
import React, { useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { DeviceContext } from '../../context/DeviceContext';
import Spinner from '../layout/Spinner';
import axios from 'axios';

const Dashboard = () => {
  const { devices, loading, getDevices } = useContext(DeviceContext);
  const [stats, setStats] = useState({
    totalDevices: 0,
    availableDevices: 0,
    soldDevices: 0,
    plannedProfit: 0,
    actualProfit: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to get the correct token
  const getAuthToken = () => {
    const adminToken = localStorage.getItem('adminToken');
    const resellerToken = localStorage.getItem('resellerToken');
    
    if (adminToken) {
      return adminToken;
    } else if (resellerToken) {
      return resellerToken;
    }
    return null;
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Separate function to load statistics
  const getStats = async () => {
    try {
      setStatsLoading(true);
      setError(null);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const response = await axios.get('/api/stats', {
        headers: getAuthHeaders()
      });
      
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      if (error.response?.status === 401) {
        setError('Nicht autorisiert. Bitte loggen Sie sich erneut ein.');
        
        // Token ungültig - weiterleiten zum Login
        const adminToken = localStorage.getItem('adminToken');
        const resellerToken = localStorage.getItem('resellerToken');
        
        if (adminToken) {
          localStorage.removeItem('adminToken');
          window.location.href = '/';
        } else if (resellerToken) {
          localStorage.removeItem('resellerToken');
          window.location.href = '/reseller';
        }
      } else if (error.response?.status === 403) {
        setError('Keine Berechtigung zum Anzeigen von Statistiken.');
      } else {
        setError(error.response?.data?.error || 'Fehler beim Laden der Statistiken');
      }
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    // Geräte laden (nur wenn die Funktion existiert)
    if (typeof getDevices === 'function') {
      getDevices();
    } else {
      console.error('getDevices ist keine Funktion:', getDevices);
    }
    
    // Statistiken laden
    getStats();
    // eslint-disable-next-line
  }, []);

  const getRecentDevices = () => {
    // Sicherstellen, dass devices ein Array ist
    if (!Array.isArray(devices)) {
      console.error('devices ist kein Array:', devices);
      return [];
    }
    return devices.slice(0, 5);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'gekauft':
        return 'bg-blue-100 text-blue-800';
      case 'in_reparatur':
        return 'bg-yellow-100 text-yellow-800';
      case 'verkaufsbereit':
        return 'bg-orange-100 text-orange-800';
      case 'zum_verkauf':
        return 'bg-green-100 text-green-800';
      case 'verkauft':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'gekauft':
        return 'Gekauft';
      case 'in_reparatur':
        return 'In Reparatur';
      case 'verkaufsbereit':
        return 'Verkaufsbereit';
      case 'zum_verkauf':
        return 'Zum Verkauf';
      case 'verkauft':
        return 'Verkauft';
      default:
        return 'Unbekannt';
    }
  };

  // Hilfsfunktion für Status-Label
  const getStatusLabel = (status) => {
    return getStatusText(status);
  };

  // Farbschema für Status
  const statusColorMap = {
    gekauft: 'bg-blue-100 text-blue-800',
    in_reparatur: 'bg-yellow-100 text-yellow-800',
    verkaufsbereit: 'bg-orange-100 text-orange-800',
    zum_verkauf: 'bg-green-100 text-green-800',
    verkauft: 'bg-purple-100 text-purple-800'
  };

  if (loading || statsLoading) {
    return <Spinner />;
  }

  // Wenn Fehler beim Laden der Statistiken
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p><strong>Fehler:</strong> {error}</p>
        <button 
          onClick={getStats}
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-900 mb-6">📊 Dashboard</h2>

      {/* Statistik-Karten */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Gesamte Geräte</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Verfügbare Geräte</p>
              <p className="text-2xl font-bold text-gray-800">{stats.availableDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Verkaufte Geräte</p>
              <p className="text-2xl font-bold text-gray-800">{stats.soldDevices}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-gray-500 text-sm">Gesamtgewinn</p>
              <p className="text-2xl font-bold text-gray-800">
                {(stats.actualProfit || 0).toFixed(2)} €
              </p>
              {stats.plannedProfit !== stats.actualProfit && (
                <p className="text-xs text-gray-500">
                  Geplant: {(stats.plannedProfit || 0).toFixed(2)} €
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Zuletzt hinzugefügte Geräte */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">📱 Zuletzt hinzugefügte Geräte</h3>
          {getRecentDevices().length === 0 ? (
            <p className="text-gray-500">Keine Geräte vorhanden</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Modell</th>
                    <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                    <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="py-2 px-4 text-left text-xs font-medium text-gray-500 uppercase">Aktion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {getRecentDevices().map(device => (
                    <tr key={device._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 whitespace-nowrap">
                        <div className="font-medium">{device.modelDesc || device.model}</div>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap font-mono text-sm">{device.imei}</td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusClass(device.status)}`}>
                          {getStatusLabel(device.status)}
                        </span>
                      </td>
                      <td className="py-2 px-4 whitespace-nowrap">
                        <Link to={`/devices/${device._id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Link to="/devices" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Alle Geräte anzeigen →
            </Link>
          </div>
        </div>

        {/* Status Übersicht */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">📈 Status Übersicht</h3>
          <div className="space-y-4">
            {['gekauft', 'in_reparatur', 'verkaufsbereit', 'zum_verkauf', 'verkauft'].map(status => {
              const count = Array.isArray(devices) ? devices.filter(d => d.status === status).length : 0;
              const percentage = Array.isArray(devices) ? (count / Math.max(devices.length, 1)) * 100 : 0;
              
              return (
                <div key={status} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{getStatusText(status)}</span>
                    <span className={`font-bold ${status === 'gekauft' ? 'text-blue-600' : 
                                                   status === 'in_reparatur' ? 'text-yellow-600' :
                                                   status === 'verkaufsbereit' ? 'text-orange-600' :
                                                   status === 'zum_verkauf' ? 'text-green-600' : 'text-purple-600'}`}>
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${status === 'gekauft' ? 'bg-blue-500' : 
                                                       status === 'in_reparatur' ? 'bg-yellow-500' :
                                                       status === 'verkaufsbereit' ? 'bg-orange-500' :
                                                       status === 'zum_verkauf' ? 'bg-green-500' : 'bg-purple-500'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Schnellzugriff */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">⚡ Schnellzugriff</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/devices/add" className="bg-blue-50 p-4 rounded-lg hover:bg-blue-100 transition-colors flex items-center">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Neues Gerät</h4>
              <p className="text-sm text-gray-500">IMEI abfragen</p>
            </div>
          </Link>
          
          <Link to="/parts/add" className="bg-green-50 p-4 rounded-lg hover:bg-green-100 transition-colors flex items-center">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Neues Ersatzteil</h4>
              <p className="text-sm text-gray-500">Zur Datenbank hinzufügen</p>
            </div>
          </Link>
          
          <Link to="/calculator" className="bg-yellow-50 p-4 rounded-lg hover:bg-yellow-100 transition-colors flex items-center">
            <div className="p-2 bg-yellow-100 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Preisrechner</h4>
              <p className="text-sm text-gray-500">Gewinn kalkulieren</p>
            </div>
          </Link>
          
          <Link to="/devices" className="bg-purple-50 p-4 rounded-lg hover:bg-purple-100 transition-colors flex items-center">
            <div className="p-2 bg-purple-100 rounded-full mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium">Geräteliste</h4>
              <p className="text-sm text-gray-500">Alle Geräte anzeigen</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;