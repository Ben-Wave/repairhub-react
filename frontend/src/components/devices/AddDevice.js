import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceContext } from '../../context/DeviceContext';
import Spinner from '../layout/Spinner';
import Alert from '../layout/Alert';

const AddDevice = () => {
  const { checkImei, loading, error, clearErrors } = useContext(DeviceContext);
  const navigate = useNavigate();

  const [imei, setImei] = useState('');
  const [alert, setAlert] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    if (imei.trim() === '') {
      setAlert('Bitte geben Sie eine IMEI-Nummer ein');
      return;
    }

    try {
      const device = await checkImei(imei);
      navigate(`/devices/${device._id}`);
    } catch (err) {
      setAlert(err.response?.data?.error || 'Fehler bei der IMEI-Überprüfung');
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Neues Gerät hinzufügen</h2>

      {alert && <Alert message={alert} type="error" onClose={() => setAlert(null)} />}
      {error && <Alert message={error} type="error" onClose={clearErrors} />}

      <form onSubmit={onSubmit}>
        <div className="mb-4">
          <label htmlFor="imei" className="block text-gray-700 font-medium mb-2">
            IMEI-Nummer
          </label>
          <input
            type="text"
            id="imei"
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="IMEI eingeben..."
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Die IMEI finden Sie auf der Verpackung oder unter *#06# auf dem Gerät.
          </p>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigate('/devices')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Wird abgefragt...' : 'IMEI überprüfen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddDevice;