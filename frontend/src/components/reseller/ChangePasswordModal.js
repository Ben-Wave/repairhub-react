// frontend/src/components/reseller/ChangePasswordModal.js (NEUE DATEI)

import React, { useState } from 'react';
import axios from 'axios';

const ChangePasswordModal = ({ isFirstLogin = false, onPasswordChanged, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validierung
    if (formData.newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Neue Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('resellerToken');
      await axios.post('/api/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onPasswordChanged();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Ändern des Passworts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {isFirstLogin ? '🔐 Passwort erstellen' : '🔐 Passwort ändern'}
            </h3>
            {!isFirstLogin && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
          </div>

          {isFirstLogin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Willkommen!</strong> Bitte erstellen Sie ein sicheres Passwort für Ihr Konto. 
                Ihr temporäres Passwort war Ihr Benutzername.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isFirstLogin ? 'Ihr temporäres Passwort (Benutzername)' : 'Aktuelles Passwort'}
              </label>
              <input
                type="password"
                name="currentPassword"
                required
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={isFirstLogin ? 'Ihr Benutzername' : 'Aktuelles Passwort eingeben'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort
              </label>
              <input
                type="password"
                name="newPassword"
                required
                minLength="6"
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort bestätigen
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Passwort wiederholen"
              />
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Passwort-Anforderungen:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li className={`${formData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-600'}`}>
                  • Mindestens 6 Zeichen {formData.newPassword.length >= 6 ? '✓' : ''}
                </li>
                <li className={`${formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'text-green-600' : 'text-gray-600'}`}>
                  • Passwörter stimmen überein {formData.newPassword === formData.confirmPassword && formData.confirmPassword ? '✓' : ''}
                </li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              {!isFirstLogin && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Abbrechen
                </button>
              )}
              <button
                type="submit"
                disabled={loading || formData.newPassword.length < 6 || formData.newPassword !== formData.confirmPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Ändere...' : isFirstLogin ? 'Passwort erstellen' : 'Passwort ändern'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;