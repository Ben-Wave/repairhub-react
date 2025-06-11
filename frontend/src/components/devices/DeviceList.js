import React, { useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { DeviceContext } from '../../context/DeviceContext';
import Spinner from '../layout/Spinner';

const DeviceList = () => {
  const { devices, loading, getDevices } = useContext(DeviceContext);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getDevices();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    filterDevices();
    // eslint-disable-next-line
  }, [devices, filter, searchTerm]);

  const filterDevices = () => {
    let filtered = [...devices];

    // Status Filter
    if (filter !== 'all') {
      filtered = filtered.filter(device => device.status === filter);
    }

    // Suchbegriff Filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(device => 
        device.imei?.toLowerCase().includes(term) ||
        device.serial?.toLowerCase().includes(term) ||
        device.model?.toLowerCase().includes(term) ||
        device.modelDesc?.toLowerCase().includes(term)
      );
    }

    setFilteredDevices(filtered);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'gekauft':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Gekauft</span>;
      case 'in_reparatur':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">In Reparatur</span>;
      case 'zum_verkauf':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Zum Verkauf</span>;
      case 'verkauft':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">Verkauft</span>;
      case 'verkaufsbereit':
        return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Verkaufsbereit</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">Unbekannt</span>;
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header - Mobile optimized */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-blue-900">Geräteliste</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredDevices.length} von {devices.length} Geräten
            </p>
          </div>
          <Link
            to="/devices/add"
            className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Neues Gerät hinzufügen
          </Link>
        </div>

        {/* Filters - Mobile optimized */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Suche
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="IMEI, Seriennummer oder Modell suchen..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Status Filter */}
            <div>
              <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle Status</option>
                <option value="gekauft">Gekauft</option>
                <option value="in_reparatur">In Reparatur</option>
                <option value="verkaufsbereit">Verkaufsbereit</option>
                <option value="zum_verkauf">Zum Verkauf</option>
                <option value="verkauft">Verkauft</option>
              </select>
            </div>
          </div>

          {/* Quick Filter Buttons - Mobile optimized */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Schnellfilter:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'Alle', count: devices.length },
                { value: 'gekauft', label: 'Gekauft', count: devices.filter(d => d.status === 'gekauft').length },
                { value: 'in_reparatur', label: 'In Reparatur', count: devices.filter(d => d.status === 'in_reparatur').length },
                { value: 'verkaufsbereit', label: 'Verkaufsbereit', count: devices.filter(d => d.status === 'verkaufsbereit').length },
                { value: 'zum_verkauf', label: 'Zum Verkauf', count: devices.filter(d => d.status === 'zum_verkauf').length },
                { value: 'verkauft', label: 'Verkauft', count: devices.filter(d => d.status === 'verkauft').length }
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition duration-200 ${
                    filter === item.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {item.label} ({item.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Device List */}
        {filteredDevices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Geräte gefunden</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'Versuchen Sie andere Suchbegriffe oder Filter.'
                : 'Fügen Sie Ihr erstes Gerät hinzu, um zu beginnen.'
              }
            </p>
            {(!searchTerm && filter === 'all') && (
              <Link
                to="/devices/add"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Erstes Gerät hinzufügen
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card Layout */}
            <div className="block lg:hidden space-y-4">
              {filteredDevices.map(device => (
                <div key={device._id} className="bg-white rounded-lg shadow-md p-4">
                  {/* Device Header */}
                  <div className="flex items-start space-x-3 mb-3">
                    {device.thumbnail ? (
                      <img 
                        src={device.thumbnail} 
                        alt={device.model} 
                        className="w-12 h-12 object-contain rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 flex items-center justify-center text-gray-500 rounded text-xs">
                        Kein Bild
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {device.modelDesc || device.model}
                          </h3>
                          {device.modelDesc && device.model && device.modelDesc !== device.model && (
                            <p className="text-xs text-gray-500 truncate">{device.model}</p>
                          )}
                        </div>
                        {getStatusBadge(device.status)}
                      </div>
                    </div>
                  </div>

                  {/* Device Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">IMEI:</span>
                      <span className="text-sm font-mono text-gray-900 break-all">{device.imei}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Seriennummer:</span>
                      <span className="text-sm font-mono text-gray-900 break-all">{device.serial}</span>
                    </div>
                    {device.sellingPrice && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Verkaufspreis:</span>
                        <span className="text-sm font-medium text-green-600">
                          {device.sellingPrice.toFixed(2)} €
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/devices/${device._id}`}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition duration-200 block"
                  >
                    Details anzeigen
                  </Link>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Bild</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Modell</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">IMEI</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Seriennummer</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-700">Verkaufspreis</th>
                      <th className="py-3 px-4 text-center font-medium text-gray-700">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredDevices.map(device => (
                      <tr key={device._id} className="hover:bg-gray-50 transition duration-200">
                        <td className="py-3 px-4">
                          {device.thumbnail ? (
                            <img src={device.thumbnail} alt={device.model} className="h-12 w-auto" />
                          ) : (
                            <div className="h-12 w-12 bg-gray-200 flex items-center justify-center text-gray-500 rounded text-xs">
                              Kein Bild
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{device.modelDesc || device.model}</div>
                          {device.modelDesc && device.model && device.modelDesc !== device.model && (
                            <div className="text-xs text-gray-500">{device.model}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">{device.imei}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm">{device.serial}</span>
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(device.status)}</td>
                        <td className="py-3 px-4">
                          {device.sellingPrice ? (
                            <span className="font-medium text-green-600">
                              {device.sellingPrice.toFixed(2)} €
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Link
                            to={`/devices/${device._id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium transition duration-200"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination Info - Mobile optimized */}
        {filteredDevices.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <p>
              {filteredDevices.length} Gerät{filteredDevices.length !== 1 ? 'e' : ''} angezeigt
              {filter !== 'all' && ` (gefiltert nach: ${filter})`}
              {searchTerm && ` (Suche: "${searchTerm}")`}
            </p>
            {(filter !== 'all' || searchTerm) && (
              <button
                onClick={() => {
                  setFilter('all');
                  setSearchTerm('');
                }}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceList;