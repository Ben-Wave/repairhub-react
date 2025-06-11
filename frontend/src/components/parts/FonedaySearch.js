import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { PartsContext } from '../../context/PartsContext';

const FonedaySearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState({});
  const [categories, setCategories] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  
  const { getParts } = useContext(PartsContext);
  
  // Produkte suchen
  const searchProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('term', searchTerm);
      if (modelFilter) queryParams.append('model', modelFilter);
      if (categoryFilter) queryParams.append('category', categoryFilter);
      
      const response = await axios.get(`/api/foneday/products/search?${queryParams}`);
      setProducts(response.data.products || []);
      
      // Kategorien extrahieren
      const uniqueCategories = [...new Set(response.data.products.map(product => product.category).filter(Boolean))];
      setCategories(uniqueCategories.sort());
    } catch (err) {
      setError('Fehler beim Abrufen der Produkte: ' + (err.response?.data?.error || err.message));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Produkte importieren (einzeln)
  const importProduct = async (sku) => {
    setImporting(prev => ({ ...prev, [sku]: true }));
    
    try {
      await axios.post(`/api/foneday/import/${sku}`);
      // Daten nach dem Import aktualisieren
      getParts();
      setImporting(prev => ({ ...prev, [sku]: false }));
    } catch (err) {
      setError(`Fehler beim Import von ${sku}: ${err.response?.data?.error || err.message}`);
      setImporting(prev => ({ ...prev, [sku]: false }));
    }
  };
  
  // Alle gefilterten Produkte importieren
  const importAllFiltered = async () => {
    if (!products.length) return;
    
    setLoading(true);
    try {
      await axios.post('/api/foneday/import', { products });
      // Daten nach dem Import aktualisieren
      getParts();
      setError(null);
    } catch (err) {
      setError('Fehler beim Import aller Produkte: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Bei Eingabe von Suchparametern suchen
  useEffect(() => {
    if (searchTerm || modelFilter || categoryFilter) {
      const timer = setTimeout(() => {
        searchProducts();
      }, 500); // Debounce-Delay
      
      return () => clearTimeout(timer);
    }
  }, [searchTerm, modelFilter, categoryFilter]);
  
  // Initial alle Produkte laden
  useEffect(() => {
    searchProducts();
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        {/* Header - Mobile optimized */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-2">🛒 Foneday Ersatzteile</h2>
          <p className="text-sm sm:text-base text-gray-600">Ersatzteile suchen und importieren</p>
        </div>
        
        {/* Search Section - Mobile optimized */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          {/* Main Search Bar */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  🔍 Produktsuche
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Nach Produkten suchen..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-end">
                <button
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
                  onClick={searchProducts}
                >
                  🔍 Suchen
                </button>
                
                <button
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? '🔺 Filter ausblenden' : '🔻 Filter anzeigen'}
                </button>
              </div>
            </div>
            
            {/* Advanced Filters - Collapsible */}
            {showFilters && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">📋 Erweiterte Filter</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">📱 Modell</label>
                    <input
                      type="text"
                      placeholder="z.B. iPhone 12"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={modelFilter}
                      onChange={(e) => setModelFilter(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">🏷️ Kategorie</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">Alle Kategorien</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* View Mode Toggle - Mobile optimized */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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
              
              {products.length > 0 && (
                <button
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  onClick={importAllFiltered}
                  disabled={loading}
                >
                  {loading ? '⏳ Importiere...' : '📦 Alle importieren'}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Error Alert */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg" role="alert">
            <div className="flex items-center">
              <span className="text-lg mr-2">⚠️</span>
              <p className="text-sm sm:text-base">{error}</p>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="text-gray-400 text-4xl sm:text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Laden...</h3>
            <p className="text-gray-500">Produkte werden abgerufen</p>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="bg-white rounded-t-lg border border-gray-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <p className="text-gray-600 text-sm sm:text-base">
                📊 {products.length} Ergebnisse gefunden
              </p>
            </div>
            
            {/* Results Content */}
            <div className="bg-white rounded-b-lg shadow-sm border-l border-r border-b border-gray-200 overflow-hidden">
              {products.length === 0 ? (
                <div className="p-8 sm:p-12 text-center">
                  <div className="text-gray-400 text-4xl sm:text-6xl mb-4">📦</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Produkte gefunden</h3>
                  <p className="text-gray-500">Versuchen Sie andere Suchbegriffe</p>
                </div>
              ) : viewMode === 'table' ? (
                /* Desktop Table View */
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Artikelnummer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Beschreibung
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Für Modell
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategorie
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Preis
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aktion
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {products.map((product) => (
                        <tr key={product.sku} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                            <div className="truncate" title={product.title}>
                              {product.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                            <div className="truncate" title={product.suitable_for}>
                              {product.suitable_for}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {parseFloat(product.price).toFixed(2)} €
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              product.instock === 'Y' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {product.instock === 'Y' ? '✅ Auf Lager' : '❌ Nicht auf Lager'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => importProduct(product.sku)}
                              disabled={importing[product.sku]}
                              className={`text-indigo-600 hover:text-indigo-900 font-medium ${
                                importing[product.sku] ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {importing[product.sku] ? '⏳ Importiere...' : '📥 Importieren'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              
              {/* Mobile Card View or fallback for small screens */}
              <div className={`${viewMode === 'table' ? 'block lg:hidden' : 'block'} p-4 sm:p-6`}>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.sku} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Card Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-medium text-gray-900 mb-1">
                            📋 {product.sku}
                          </p>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        </div>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                          product.instock === 'Y' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.instock === 'Y' ? '✅ Lager' : '❌ Kein Lager'}
                        </span>
                      </div>
                      
                      {/* Card Content */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-1">📱 Beschreibung:</p>
                          <p className="text-sm text-gray-900">{product.title}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-600 font-medium mb-1">🔧 Geeignet für:</p>
                          <p className="text-sm text-gray-900">{product.suitable_for}</p>
                        </div>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-lg font-bold text-gray-900">
                            💰 {parseFloat(product.price).toFixed(2)} €
                          </span>
                          <button
                            onClick={() => importProduct(product.sku)}
                            disabled={importing[product.sku]}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm ${
                              importing[product.sku] ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {importing[product.sku] ? '⏳ Importiere...' : '📥 Importieren'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FonedaySearch;