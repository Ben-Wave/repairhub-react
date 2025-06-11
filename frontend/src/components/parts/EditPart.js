import React, { useState, useEffect, useContext } from 'react';
import { PartsContext } from '../../context/PartsContext';
import Alert from '../layout/Alert';

const EditPart = ({ part, onClose, onSave }) => {
  const { loading } = useContext(PartsContext);
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    forModel: '',
    price: '',
    category: '',
    stock: 0
  });
  const [alert, setAlert] = useState(null);

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

  useEffect(() => {
    if (part) {
      setFormData({
        partNumber: part.partNumber,
        description: part.description,
        forModel: part.forModel,
        price: part.price.toString(),
        category: part.category || '',
        stock: part.stock || 0
      });
    }
  }, [part]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'stock' ? parseInt(value, 10) || 0 : value
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!formData.partNumber || !formData.description || !formData.forModel || !formData.price || !formData.category) {
      setAlert('Bitte füllen Sie alle Felder aus.');
      return;
    }

    try {
      await onSave(part._id, {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10) || 0
      });
      onClose();
    } catch (err) {
      setAlert(err.response?.data?.error || 'Fehler beim Speichern des Ersatzteils');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Header - Mobile optimized */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-blue-900 leading-tight">
                  Ersatzteil bearbeiten
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Ändern Sie die Details des Ersatzteils
                </p>
              </div>
              <button
                onClick={onClose}
                className="ml-3 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Alert */}
            {alert && <Alert message={alert} type="error" onClose={() => setAlert(null)} />}
            
            {/* Form - Mobile optimized */}
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Part Number - Disabled */}
              <div>
                <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  Teilenummer
                </label>
                <input
                  type="text"
                  id="partNumber"
                  name="partNumber"
                  value={formData.partNumber}
                  onChange={onChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed text-base"
                  disabled // Teilenummer sollte nicht geändert werden
                />
                <p className="text-xs text-gray-500 mt-1">
                  Die Teilenummer kann nicht geändert werden
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
                  value={formData.description}
                  onChange={onChange}
                  rows="3"
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  required
                  placeholder="Detaillierte Beschreibung des Ersatzteils"
                />
              </div>

              {/* Model Selection - Mobile optimized */}
              <div>
                <label htmlFor="forModel" className="block text-sm font-medium text-gray-700 mb-2">
                  Für Modell *
                </label>
                <div className="space-y-2">
                  <select
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    onChange={(e) => setFormData({ ...formData, forModel: e.target.value })}
                    value={popularModels.includes(formData.forModel) ? formData.forModel : ''}
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
                    value={formData.forModel}
                    onChange={onChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Eigenes Modell eingeben..."
                    required
                  />
                </div>
              </div>

              {/* Category Selection - Mobile optimized */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Kategorie *
                </label>
                <div className="space-y-2">
                  <select
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    value={predefinedCategories.includes(formData.category) ? formData.category : ''}
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
                    value={formData.category}
                    onChange={onChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Eigene Kategorie eingeben..."
                    required
                  />
                </div>
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
                    value={formData.price}
                    onChange={onChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0.00"
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
                    value={formData.stock}
                    onChange={onChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Preview Section - Mobile optimized */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3 text-sm">Vorschau der Änderungen:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Teilenummer:</span>
                    <span className="font-mono font-medium">{formData.partNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Kategorie:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {formData.category || 'Keine Kategorie'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Modell:</span>
                    <span className="font-medium">{formData.forModel || 'Kein Modell'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Preis:</span>
                    <span className="font-bold text-green-600">
                      {formData.price ? `${parseFloat(formData.price).toFixed(2)} €` : '0.00 €'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Lagerbestand:</span>
                    <span className={`font-medium ${
                      formData.stock > 0 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {formData.stock} Stück
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Mobile optimized */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 order-2 sm:order-1"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 order-1 sm:order-2"
                  disabled={loading || !formData.description || !formData.forModel || !formData.price || !formData.category}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Wird gespeichert...
                    </div>
                  ) : (
                    'Änderungen speichern'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPart;