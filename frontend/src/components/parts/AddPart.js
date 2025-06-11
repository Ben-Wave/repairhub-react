import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartsContext } from '../../context/PartsContext';
import Spinner from '../layout/Spinner';
import Alert from '../layout/Alert';

const AddPart = () => {
  const { addPart, loading, error, clearErrors } = useContext(PartsContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    forModel: '',
    price: '',
    category: ''
  });
  const [alert, setAlert] = useState(null);
  const [stock, setStock] = useState(0);

  const { partNumber, description, forModel, price, category } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    clearErrors();

    if (!partNumber || !description || !forModel || !price || !category) {
      setAlert('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      await addPart({
        partNumber,
        description,
        forModel,
        price: parseFloat(price),
        category,
        stock: parseInt(stock, 10) || 0
      });
      navigate('/parts');
    } catch (err) {
      setAlert(err.response?.data?.error || 'Fehler beim Hinzufügen des Ersatzteils');
    }
  };

  // Predefined categories for better UX
  const predefinedCategories = [
    'Display', 'Akku', 'Kamera', 'Lautsprecher', 'Mikrofon', 
    'Ladebuchse', 'Gehäuse', 'Platine', 'Home Button', 
    'Power Button', 'Volume Button', 'SIM Tray', 'Antenne'
  ];

  // Popular iPhone models for quick selection
  const popularModels = [
    'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
    'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
    'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13 mini', 'iPhone 13',
    'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12 mini', 'iPhone 12',
    'iPhone SE (3rd generation)', 'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11'
  ];

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {/* Header - Mobile optimized */}
          <div className="text-center mb-6">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-blue-900">Neues Ersatzteil hinzufügen</h2>
            <p className="text-sm sm:text-base text-gray-600">Fügen Sie ein neues Ersatzteil zur Datenbank hinzu</p>
          </div>

          {/* Alerts - Mobile optimized */}
          {alert && <Alert message={alert} type="error" onClose={() => setAlert(null)} />}
          {error && <Alert message={error} type="error" onClose={clearErrors} />}

          {/* Form - Mobile optimized */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Part Number */}
            <div>
              <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Teilenummer *
              </label>
              <input
                type="text"
                id="partNumber"
                name="partNumber"
                value={partNumber}
                onChange={onChange}
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                placeholder="z.B. APL-IPH13-LCD-001"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Eindeutige Artikelnummer des Ersatzteils
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung *
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={onChange}
                rows="3"
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                placeholder="z.B. OLED Display Bildschirm mit Touchscreen"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Detaillierte Beschreibung des Ersatzteils
              </p>
            </div>

            {/* Model Selection - Mobile optimized */}
            <div>
              <label htmlFor="forModel" className="block text-sm font-medium text-gray-700 mb-2">
                Für Modell *
              </label>
              <div className="space-y-2">
                <select
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  onChange={(e) => setFormData({ ...formData, forModel: e.target.value })}
                  value={forModel}
                >
                  <option value="">Modell auswählen...</option>
                  {popularModels.map((model, index) => (
                    <option key={index} value={model}>{model}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 text-center">oder</div>
                <input
                  type="text"
                  id="forModel"
                  name="forModel"
                  value={forModel}
                  onChange={onChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  placeholder="Eigenes Modell eingeben..."
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Wählen Sie aus der Liste oder geben Sie ein eigenes Modell ein
              </p>
            </div>

            {/* Category Selection - Mobile optimized */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie *
              </label>
              <div className="space-y-2">
                <select
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  value={category}
                >
                  <option value="">Kategorie auswählen...</option>
                  {predefinedCategories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 text-center">oder</div>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={category}
                  onChange={onChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  placeholder="Eigene Kategorie eingeben..."
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Wählen Sie aus der Liste oder geben Sie eine eigene Kategorie ein
              </p>
            </div>

            {/* Price and Stock - Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                  Preis (€) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={price}
                  onChange={onChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
                  Lagerbestand
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Preview Section - Mobile optimized */}
            {(partNumber || description || forModel || category || price) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3 text-sm">Vorschau:</h3>
                <div className="space-y-2 text-sm">
                  {partNumber && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Teilenummer:</span>
                      <span className="font-medium">{partNumber}</span>
                    </div>
                  )}
                  {category && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Kategorie:</span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">{category}</span>
                    </div>
                  )}
                  {forModel && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Modell:</span>
                      <span className="font-medium">{forModel}</span>
                    </div>
                  )}
                  {price && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Preis:</span>
                      <span className="font-bold text-green-600">{parseFloat(price).toFixed(2)} €</span>
                    </div>
                  )}
                  {stock > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Lagerbestand:</span>
                      <span className="font-medium">{stock} Stück</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons - Mobile optimized */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/parts')}
                className="w-full sm:w-auto px-4 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 order-2 sm:order-1"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 order-1 sm:order-2"
                disabled={loading || !partNumber || !description || !forModel || !price || !category}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird hinzugefügt...
                  </div>
                ) : (
                  'Ersatzteil hinzufügen'
                )}
              </button>
            </div>
          </form>

          {/* Help Section - Mobile optimized */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">💡 Tipps</h3>
            <div className="space-y-2 text-xs sm:text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <p>Verwenden Sie eindeutige Teilenummern für bessere Verwaltung</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <p>Wählen Sie spezifische Modellbezeichnungen (z.B. "iPhone 13 Pro" statt nur "iPhone")</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <p>Kategorien helfen bei der späteren Suche und Filterung</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-600 font-bold">•</span>
                <p>Lagerbestand kann später jederzeit angepasst werden</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddPart;