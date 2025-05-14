import React, { useEffect, useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { PartsContext } from '../../context/PartsContext';
import Spinner from '../layout/Spinner';
import EditPart from './EditPart';
import Alert from '../layout/Alert';

const PartsList = () => {
  const { parts, loading, getParts, updatePart, deletePart, error, clearErrors } = useContext(PartsContext);
  const [filteredParts, setFilteredParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('iPhone'); // Standardwert auf iPhone
  const [editingPart, setEditingPart] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    getParts();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    filterPartsList();
    // eslint-disable-next-line
  }, [parts, searchTerm, filterModel]);

  const filterPartsList = () => {
    let filtered = [...parts];

    // Modellfilter
    if (filterModel.trim() !== '') {
      filtered = filtered.filter(part => 
        part.forModel.toLowerCase().includes(filterModel.toLowerCase())
      );
    }

    // Suchbegriff
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(part => 
        part.partNumber.toLowerCase().includes(term) ||
        part.description.toLowerCase().includes(term)
      );
    }

    setFilteredParts(filtered);
  };

  const handleEdit = (part) => {
    setEditingPart(part);
  };

  const handleSaveEdit = async (id, partData) => {
    try {
      await updatePart(id, partData);
      setAlert({ type: 'success', message: 'Ersatzteil erfolgreich aktualisiert' });
      setEditingPart(null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Fehler beim Aktualisieren des Ersatzteils' });
    }
  };

  const handleDelete = async (part) => {
    if (window.confirm(`Möchten Sie das Ersatzteil "${part.partNumber}" wirklich löschen?`)) {
      try {
        await deletePart(part._id);
        setAlert({ type: 'success', message: 'Ersatzteil erfolgreich gelöscht' });
      } catch (err) {
        setAlert({ type: 'error', message: 'Fehler beim Löschen des Ersatzteils' });
      }
    }
  };

  if (loading) {
    return <Spinner />;
  }

  // Modelle für Filter extrahieren
  const models = [...new Set(parts.map(part => part.forModel))];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">Ersatzteile</h2>
        <Link
          to="/parts/add"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Neues Ersatzteil hinzufügen
        </Link>
      </div>

      {alert && (
        <Alert 
          message={alert.message} 
          type={alert.type} 
          onClose={() => setAlert(null)} 
        />
      )}

      {error && (
        <Alert 
          message={error} 
          type="error" 
          onClose={clearErrors} 
        />
      )}

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
              placeholder="Teilenummer oder Beschreibung suchen..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="filterModel" className="block text-sm font-medium text-gray-700 mb-1">
              Modell Filter
            </label>
            <select
              id="filterModel"
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Modelle</option>
              {models.map((model, index) => (
                <option key={index} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredParts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Keine Ersatzteile gefunden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left">Teilenummer</th>
                  <th className="py-3 px-4 text-left">Beschreibung</th>
                  <th className="py-3 px-4 text-left">Kategorie</th>
                  <th className="py-3 px-4 text-left">Für Modell</th>
                  <th className="py-3 px-4 text-right">Lager</th> {/* NEU */}
                  <th className="py-3 px-4 text-right">Preis</th>
                  <th className="py-3 px-4 text-center">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredParts.map(part => (
                  <tr 
                    key={part._id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEdit(part)}
                  >
                    <td className="py-3 px-4 font-medium">{part.partNumber}</td>
                    <td className="py-3 px-4">{part.description}</td>
                    <td className="py-3 px-4">{part.category || '-'}</td>
                    <td className="py-3 px-4">{part.forModel}</td>
                    <td className="py-3 px-4 text-right">{part.stock ?? 0}</td> {/* NEU */}
                    <td className="py-3 px-4 text-right">{part.price.toFixed(2)} €</td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(part)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(part)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Löschen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingPart && (
        <EditPart
          part={editingPart}
          onClose={() => setEditingPart(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
};

export default PartsList;