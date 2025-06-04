import React, { useEffect, useContext, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PartsContext } from '../../context/PartsContext';
import Spinner from '../layout/Spinner';
import EditPart from './EditPart';
import Alert from '../layout/Alert';

const PartsList = () => {
  const { parts, loading, getParts, updatePart, deletePart, error, clearErrors } = useContext(PartsContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModel, setFilterModel] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('partNumber');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table');
  const [editingPart, setEditingPart] = useState(null);
  const [alert, setAlert] = useState(null);
  
  // PAGINATION STATE für bessere Performance
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    getParts();
    // eslint-disable-next-line
  }, []);

  // OPTIMIERT: Memoized iPhone Modelle mit intelligenter Extraktion
  const processedModels = useMemo(() => {
    if (!parts.length) return [];

    console.time('🔄 iPhone Modelle Verarbeitung');
    
    const allModelsSet = new Set();
    
    // Batch-Verarbeitung für bessere Performance
    const batchSize = 1000;
    for (let i = 0; i < parts.length; i += batchSize) {
      const batch = parts.slice(i, i + batchSize);
      
      batch.forEach(part => {
        if (part.forModel) {
          // Optimierte Regex für iPhone-Extraktion
          const iPhoneModels = part.forModel.match(/iPhone[^,]*/gi);
          if (iPhoneModels) {
            iPhoneModels.forEach(model => {
              const cleanModel = model.trim();
              if (cleanModel.length < 100) { // Nur vernünftige Längen
                allModelsSet.add(cleanModel);
              }
            });
          }
        }
      });
    }

    const uniqueModels = Array.from(allModelsSet)
      .sort((a, b) => {
        const getNumber = (str) => {
          const match = str.match(/iPhone\s*(\d+)/i);
          return match ? parseInt(match[1]) : 0;
        };
        
        const aNum = getNumber(a);
        const bNum = getNumber(b);
        
        if (aNum !== bNum) return aNum - bNum;
        return a.localeCompare(b);
      })
      .slice(0, 100); // Maximal 100 Optionen für Performance

    console.timeEnd('🔄 iPhone Modelle Verarbeitung');
    console.log(`✅ ${uniqueModels.length} eindeutige iPhone Modelle gefunden`);
    return uniqueModels;
  }, [parts]);

  // OPTIMIERT: Memoized Kategorien
  const processedCategories = useMemo(() => {
    const categories = [...new Set(parts.map(part => part.category).filter(Boolean))]
      .sort()
      .slice(0, 50); // Maximal 50 Kategorien
    console.log(`✅ ${categories.length} Kategorien verarbeitet`);
    return categories;
  }, [parts]);

  // HOCHOPTIMIERT: Memoized Filterung und Sortierung mit Debouncing-Effect
  const filteredParts = useMemo(() => {
    console.time('🔄 Filterung und Sortierung');
    let filtered = parts;

    // Frühzeitiger Exit wenn keine Filter
    const hasFilters = searchTerm.trim() || filterModel.trim() || filterCategory.trim();
    
    if (hasFilters) {
      filtered = parts.filter(part => {
        // Textsuche - optimiert
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const searchableText = [
            part.partNumber,
            part.description,
            part.forModel,
            part.category
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(term)) return false;
        }

        // Modellfilter - optimiert
        if (filterModel.trim()) {
          const filterModelLower = filterModel.toLowerCase();
          if (!part.forModel?.toLowerCase().includes(filterModelLower)) return false;
        }

        // Kategoriefilter
        if (filterCategory.trim()) {
          if (!part.category?.toLowerCase().includes(filterCategory.toLowerCase())) return false;
        }

        return true;
      });
    }

    // Sortierung - nur wenn nötig
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[sortBy] ?? '';
        let bVal = b[sortBy] ?? '';
        
        if (sortBy === 'price') {
          aVal = parseFloat(aVal) || 0;
          bVal = parseFloat(bVal) || 0;
        } else if (sortBy === 'stock') {
          aVal = parseInt(aVal) || 0;
          bVal = parseInt(bVal) || 0;
        } else {
          aVal = aVal.toString().toLowerCase();
          bVal = bVal.toString().toLowerCase();
        }

        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    console.timeEnd('🔄 Filterung und Sortierung');
    console.log(`✅ ${filtered.length} Teile nach Filterung`);
    return filtered;
  }, [parts, searchTerm, filterModel, filterCategory, sortBy, sortOrder]);

  // PAGINATION: Aktuelle Seite berechnen
  const paginatedParts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredParts.slice(startIndex, endIndex);
  }, [filteredParts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterModel, filterCategory]);

  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy, sortOrder]);

  const handleEdit = useCallback((part) => {
    setEditingPart(part);
  }, []);

  const handleSaveEdit = useCallback(async (id, partData) => {
    try {
      await updatePart(id, partData);
      setAlert({ type: 'success', message: 'Ersatzteil erfolgreich aktualisiert' });
      setEditingPart(null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Fehler beim Aktualisieren des Ersatzteils' });
    }
  }, [updatePart]);

  const handleDelete = useCallback(async (part) => {
    if (window.confirm(`Möchten Sie das Ersatzteil "${part.partNumber}" wirklich löschen?`)) {
      try {
        await deletePart(part._id);
        setAlert({ type: 'success', message: 'Ersatzteil erfolgreich gelöscht' });
      } catch (err) {
        setAlert({ type: 'error', message: 'Fehler beim Löschen des Ersatzteils' });
      }
    }
  }, [deletePart]);

  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setFilterModel('');
    setFilterCategory('');
    setSortBy('partNumber');
    setSortOrder('asc');
    setCurrentPage(1);
  }, []);

  const getStockBadge = useCallback((stock) => {
    if (stock === undefined || stock === null) return null;
    if (stock <= 0) return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Kein Bestand</span>;
    if (stock <= 5) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">{stock}</span>;
    if (stock <= 20) return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">{stock}</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{stock}+</span>;
  }, []);

  const getSortIcon = useCallback((field) => {
    if (sortBy !== field) return '⇅';
    return sortOrder === 'asc' ? '↑' : '↓';
  }, [sortBy, sortOrder]);

  if (loading) {
    return <Spinner />;
  }

  const activeFiltersCount = [searchTerm, filterModel, filterCategory].filter(f => f.trim() !== '').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Ersatzteile</h2>
          <p className="text-gray-600 mt-1">
            {filteredParts.length.toLocaleString()} von {parts.length.toLocaleString()} Teilen
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-blue-600">
                ({activeFiltersCount} Filter aktiv)
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Items per page selector */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
          >
            <option value={25}>25 pro Seite</option>
            <option value={50}>50 pro Seite</option>
            <option value={100}>100 pro Seite</option>
            <option value={200}>200 pro Seite</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Tabelle
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🎴 Karten
            </button>
          </div>

          <Link
            to="/parts/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <span className="mr-2">+</span>
            Neues Teil
          </Link>
        </div>
      </div>

      {/* Alerts */}
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

      {/* Enhanced Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Universelle Suche
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Teilenummer, Beschreibung, Modell oder Kategorie..."
                className="w-full pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* OPTIMIERTES Model Filter */}
          <div className="lg:w-64">
            <label htmlFor="filterModel" className="block text-sm font-medium text-gray-700 mb-2">
              📱 iPhone Modell ({processedModels.length})
            </label>
            <select
              id="filterModel"
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">Alle iPhone Modelle</option>
              {processedModels.map((model, index) => (
                <option key={index} value={model}>
                  {model.length > 35 ? `${model.substring(0, 35)}...` : model}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="lg:w-64">
            <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ Kategorie ({processedCategories.length})
            </label>
            <select
              id="filterCategory"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="">Alle Kategorien</option>
              {processedCategories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {activeFiltersCount > 0 && (
            <div className="flex items-end">
              <button
                onClick={clearAllFilters}
                className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                🗑️ Filter löschen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PAGINATION Controls Top */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white px-6 py-3 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-700">
            Seite {currentPage} von {totalPages} 
            <span className="ml-2 text-gray-500">
              (Zeige {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredParts.length)} von {filteredParts.length.toLocaleString()})
            </span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Zurück
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNum 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter →
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {filteredParts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Ersatzteile gefunden</h3>
          <p className="text-gray-500 mb-6">
            {activeFiltersCount > 0 
              ? 'Versuchen Sie andere Suchbegriffe oder entfernen Sie Filter.'
              : 'Beginnen Sie mit dem Hinzufügen von Ersatzteilen.'
            }
          </p>
          {activeFiltersCount > 0 ? (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Filter zurücksetzen
            </button>
          ) : (
            <Link
              to="/parts/add"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-2">+</span>
              Erstes Teil hinzufügen
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {viewMode === 'table' ? (
            /* OPTIMIZED Table View - nur aktuell sichtbare Zeilen */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'partNumber', label: 'Teilenummer' },
                      { key: 'description', label: 'Beschreibung' },
                      { key: 'category', label: 'Kategorie' },
                      { key: 'forModel', label: 'Modell' },
                      { key: 'stock', label: 'Lager', align: 'center' },
                      { key: 'price', label: 'Preis', align: 'right' }
                    ].map(column => (
                      <th
                        key={column.key}
                        onClick={() => handleSort(column.key)}
                        className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                          column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{column.label}</span>
                          <span className="ml-2 text-gray-400">{getSortIcon(column.key)}</span>
                        </div>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedParts.map(part => (
                    <tr 
                      key={part._id} 
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {part.partNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={part.description}>
                          {part.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {part.category || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={part.forModel}>
                          {part.forModel ? (
                            part.forModel.length > 50 ? `${part.forModel.substring(0, 50)}...` : part.forModel
                          ) : (
                            <span className="text-gray-400 italic">Kein Modell</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStockBadge(part.stock)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {part.price?.toFixed(2)} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(part)}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            title="Bearbeiten"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(part)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                            title="Löschen"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* OPTIMIZED Cards View - nur aktuell sichtbare Karten */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedParts.map(part => (
                  <div 
                    key={part._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleEdit(part)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {part.category || 'Kategorie'}
                      </span>
                      <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(part)}
                          className="text-gray-400 hover:text-blue-600 text-sm"
                          title="Bearbeiten"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(part)}
                          className="text-gray-400 hover:text-red-600 text-sm"
                          title="Löschen"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-mono text-sm font-medium text-gray-900 mb-2">
                      {part.partNumber}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {part.description}
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">Modell:</span>
                        <span className="font-medium text-gray-900 truncate ml-2" title={part.forModel}>
                          {part.forModel ? (
                            part.forModel.length > 25 ? `${part.forModel.substring(0, 25)}...` : part.forModel
                          ) : (
                            'Kein Modell'
                          )}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Lager:</span>
                          {getStockBadge(part.stock)}
                        </div>
                        <span className="text-lg font-bold text-gray-900">
                          {part.price?.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PAGINATION Controls Bottom */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Erste
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              ← Zurück
            </button>
            <span className="px-3 py-2 bg-blue-600 text-white rounded">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Weiter →
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Letzte
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
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