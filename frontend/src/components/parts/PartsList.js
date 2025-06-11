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
  const [showFilters, setShowFilters] = useState(false);
  
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
    if (stock <= 0) return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full whitespace-nowrap">0</span>;
    if (stock <= 5) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full whitespace-nowrap">⚠️ {stock}</span>;
    if (stock <= 20) return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full whitespace-nowrap">📦 {stock}</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">✅ {stock}+</span>;
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header - Mobile optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-3xl font-bold text-blue-900">🔧 Ersatzteile</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {filteredParts.length.toLocaleString()} von {parts.length.toLocaleString()} Teilen
                {activeFiltersCount > 0 && (
                  <span className="ml-2 text-blue-600">
                    ({activeFiltersCount} Filter aktiv)
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              {/* Items per page selector */}
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 Tabelle
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    viewMode === 'cards' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🎴 Karten
                </button>
              </div>

              <Link
                to="/parts/add"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <span className="mr-2">+</span>
                Neues Teil
              </Link>
            </div>
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

        {/* Enhanced Filter Section - Mobile optimized */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="space-y-4">
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

            {/* Filter Toggle Button */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showFilters ? '🔺 Erweiterte Filter ausblenden' : '🔻 Erweiterte Filter anzeigen'}
              </button>
              
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  🗑️ Filter löschen
                </button>
              )}
            </div>

            {/* Advanced Filters - Collapsible */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                {/* OPTIMIERTES Model Filter */}
                <div>
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
                <div>
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
              </div>
            )}
          </div>
        </div>

        {/* PAGINATION Controls Top */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-4 sm:px-6 py-3 rounded-lg border border-gray-200 mb-4 gap-3 sm:gap-0">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Seite {currentPage} von {totalPages} 
              <span className="block sm:inline sm:ml-2 text-gray-500">
                (Zeige {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredParts.length)} von {filteredParts.length.toLocaleString()})
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                ← Zurück
              </button>
              
              {/* Page numbers - mobile optimized */}
              <div className="hidden sm:flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm ${
                        currentPage === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Weiter →
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {filteredParts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📦</div>
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
              /* Desktop Table View - Optimiert für bessere Spaltenbreiten */
              <div className="hidden lg:block">
                <div className="overflow-hidden">
                  <table className="w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        {[
                          { key: 'partNumber', label: 'Teilenummer', width: 'w-32' },
                          { key: 'description', label: 'Beschreibung', width: 'w-64' },
                          { key: 'category', label: 'Kategorie', width: 'w-28' },
                          { key: 'forModel', label: 'Modell', width: 'w-40' },
                          { key: 'stock', label: 'Lager', align: 'center', width: 'w-20' },
                          { key: 'price', label: 'Preis', align: 'right', width: 'w-24' }
                        ].map(column => (
                          <th
                            key={column.key}
                            onClick={() => handleSort(column.key)}
                            className={`${column.width} px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                              column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{column.label}</span>
                              <span className="ml-1 text-gray-400 flex-shrink-0">{getSortIcon(column.key)}</span>
                            </div>
                          </th>
                        ))}
                        <th className="w-24 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <td className="w-32 px-3 py-4">
                            <span className="font-mono text-xs font-medium text-gray-900 block truncate" title={part.partNumber}>
                              {part.partNumber}
                            </span>
                          </td>
                          <td className="w-64 px-3 py-4">
                            <div className="text-sm text-gray-900 truncate" title={part.description}>
                              {part.description}
                            </div>
                          </td>
                          <td className="w-28 px-3 py-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate">
                              {part.category || '-'}
                            </span>
                          </td>
                          <td className="w-40 px-3 py-4">
                            <div className="text-sm text-gray-900 truncate" title={part.forModel}>
                              {part.forModel ? (
                                part.forModel.length > 25 ? `${part.forModel.substring(0, 25)}...` : part.forModel
                              ) : (
                                <span className="text-gray-400 italic">Kein Modell</span>
                              )}
                            </div>
                          </td>
                          <td className="w-20 px-3 py-4 text-center">
                            {getStockBadge(part.stock)}
                          </td>
                          <td className="w-24 px-3 py-4 text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {part.price?.toFixed(2)} €
                            </span>
                          </td>
                          <td className="w-24 px-3 py-4">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleEdit(part)}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Bearbeiten"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDelete(part)}
                                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
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
              </div>
            ) : null}
            
            {/* Mobile Card View or Small Screen Table Fallback */}
            <div className={`${viewMode === 'table' ? 'block lg:hidden' : 'block'} p-4 sm:p-6`}>
              <div className="space-y-4">
                {paginatedParts.map(part => (
                  <div 
                    key={part._id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-mono text-sm font-medium text-gray-900">
                            📋 {part.partNumber}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {part.category || 'Kategorie'}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(part)}
                          className="text-blue-600 hover:text-blue-800 text-lg"
                          title="Bearbeiten"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(part)}
                          className="text-red-600 hover:text-red-800 text-lg"
                          title="Löschen"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">📝 Beschreibung:</p>
                        <p className="text-sm text-gray-900">{part.description}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 font-medium mb-1">📱 Modell:</p>
                        <p className="text-sm text-gray-900">
                          {part.forModel ? (
                            part.forModel.length > 60 ? `${part.forModel.substring(0, 60)}...` : part.forModel
                          ) : (
                            <span className="text-gray-400 italic">Kein Modell</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">💰 Preis</p>
                            <p className="text-lg font-bold text-gray-900">
                              {part.price?.toFixed(2)} €
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">📦 Lager</p>
                            {getStockBadge(part.stock)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PAGINATION Controls Bottom */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
              >
                Erste
              </button>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
              >
                ← Zurück
              </button>
              <span className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
              >
                Weiter →
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
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
    </div>
  );
};

export default PartsList;