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
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">Unbekannt</span>;
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Geräteliste</h2>
        <Link
          to="/devices/add"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Neues Gerät hinzufügen
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Suche
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="IMEI, Seriennummer oder Modell suchen..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle</option>
              <option value="gekauft">Gekauft</option>
              <option value="in_reparatur">In Reparatur</option>
              <option value="zum_verkauf">Zum Verkauf</option>
              <option value="verkauft">Verkauft</option>
            </select>
          </div>
        </div>

        {filteredDevices.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Keine Geräte gefunden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Bild</th>
                  <th className="py-3 px-4 text-left">Modell</th>
                  <th className="py-3 px-4 text-left">IMEI</th>
                  <th className="py-3 px-4 text-left">Seriennummer</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Verkaufspreis</th>
                  <th className="py-3 px-4 text-center">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDevices.map(device => (
                  <tr key={device._id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {device.thumbnail ? (
                        <img src={device.thumbnail} alt={device.model} className="h-12 w-auto" />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 flex items-center justify-center text-gray-500">
                          Kein Bild
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{device.modelDesc || device.model}</div>
                      {device.modelDesc && device.model && device.modelDesc !== device.model && (
                        <div className="text-xs text-gray-500">{device.model}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">{device.imei}</td>
                    <td className="py-3 px-4">{device.serial}</td>
                    <td className="py-3 px-4">{getStatusBadge(device.status)}</td>
                    <td className="py-3 px-4">
                      {device.sellingPrice ? `${device.sellingPrice.toFixed(2)} €` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/devices/${device._id}`}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceList;