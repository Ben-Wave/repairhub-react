import React, { useState, useEffect, useContext } from 'react';
import { PartsContext } from '../../context/PartsContext';
import Alert from '../layout/Alert';

const EditPart = ({ part, onClose, onSave }) => {
  const { loading } = useContext(PartsContext);
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    forModel: '',
    price: ''
  });
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (part) {
      setFormData({
        partNumber: part.partNumber,
        description: part.description,
        forModel: part.forModel,
        price: part.price.toString()
      });
    }
  }, [part]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();

    if (!formData.partNumber || !formData.description || !formData.forModel || !formData.price) {
      setAlert('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      await onSave(part._id, {
        ...formData,
        price: parseFloat(formData.price)
      });
      onClose();
    } catch (err) {
      setAlert(err.response?.data?.error || 'Fehler beim Speichern des Ersatzteils');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-bold text-blue-900 mb-4">Ersatzteil bearbeiten</h3>
          
          {alert && <Alert message={alert} type="error" onClose={() => setAlert(null)} />}
          
          <form onSubmit={onSubmit}>
            <div className="mb-4">
              <label htmlFor="partNumber" className="block text-gray-700 font-medium mb-2">
                Teilenummer
              </label>
              <input
                type="text"
                id="partNumber"
                name="partNumber"
                value={formData.partNumber}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled // Teilenummer sollte nicht geändert werden
              />
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Beschreibung
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="forModel" className="block text-gray-700 font-medium mb-2">
                Für Modell
              </label>
              <input
                type="text"
                id="forModel"
                name="forModel"
                value={formData.forModel}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="price" className="block text-gray-700 font-medium mb-2">
                Preis (€)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={onChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Wird gespeichert...' : 'Speichern'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPart;