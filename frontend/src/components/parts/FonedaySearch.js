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
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Foneday Ersatzteile</h2>
      
      <div className="mb-6 bg-white p-4 rounded shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Nach Produkten suchen..."
              className="w-full p-2 border rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={searchProducts}
          >
            Suchen
          </button>
          
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Filter ausblenden' : 'Filter anzeigen'}
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Modell</label>
              <input
                type="text"
                placeholder="z.B. iPhone 12"
                className="mt-1 w-full p-2 border rounded"
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Kategorie</label>
              <select
                className="mt-1 w-full p-2 border rounded"
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
        )}
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-6">
          <div className="spinner-border" role="status">
            <span className="sr-only">Lädt...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">{products.length} Ergebnisse gefunden</p>
            
            {products.length > 0 && (
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={importAllFiltered}
              >
                Alle importieren
              </button>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  <tr key={product.sku}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                      {product.title}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                      {product.suitable_for}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {parseFloat(product.price).toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.instock === 'Y' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.instock === 'Y' ? 'Auf Lager' : 'Nicht auf Lager'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => importProduct(product.sku)}
                        disabled={importing[product.sku]}
                        className={`text-indigo-600 hover:text-indigo-900 ${importing[product.sku] ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {importing[product.sku] ? 'Importiere...' : 'Importieren'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default FonedaySearch;