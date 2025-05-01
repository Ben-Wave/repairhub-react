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
    price: ''
  });
  const [alert, setAlert] = useState(null);

  const { partNumber, description, forModel, price } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    clearErrors();

    if (!partNumber || !description || !forModel || !price) {
      setAlert('Bitte füllen Sie alle Felder aus');
      return;
    }

    try {
      await addPart({
        partNumber,
        description,
        forModel,
        price: parseFloat(price)
      });
      navigate('/parts');
    } catch (err) {
      setAlert(err.response?.data?.error || 'Fehler beim Hinzufügen des Ersatzteils');
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Neues Ersatzteil hinzufügen</h2>

      {alert && <Alert message={alert} type="error" onClose={() => setAlert(null)} />}
      {error && <Alert message={error} type="error" onClose={clearErrors} />}

      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label htmlFor="partNumber" className="block text-gray-700 font-medium mb-2">
            Teilenummer
          </label>
          <input
            type="text"
            id="partNumber"
            name="partNumber"
            value={partNumber}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Teilenummer eingeben..."
            required
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
            value={description}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Beschreibung eingeben..."
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
            value={forModel}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Modell eingeben..."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            z.B. "iPhone 13" oder "Samsung Galaxy S21"
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="price" className="block text-gray-700 font-medium mb-2">
            Preis (€)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={price}
            onChange={onChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/parts')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Wird hinzugefügt...' : 'Ersatzteil hinzufügen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPart;