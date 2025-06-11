// frontend/src/components/reseller/ChangePasswordModal.js
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
      <div className="relative min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
          <div className="p-4 sm:p-6">
            {/* Header - Mobile optimized */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 leading-tight">
                  {isFirstLogin ? '🔐 Passwort erstellen' : '🔐 Passwort ändern'}
                </h3>
              </div>
              {!isFirstLogin && (
                <button
                  onClick={onClose}
                  className="ml-3 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>

            {/* Welcome Message - Mobile optimized */}
            {isFirstLogin && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
                <p className="text-blue-800 text-sm">
                  <strong>Willkommen!</strong> Bitte erstellen Sie ein sicheres Passwort für Ihr Konto. 
                  Ihr temporäres Passwort war Ihr Benutzername.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {/* Form - Mobile optimized */}
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Passwort wiederholen"
                />
              </div>

              {/* Password Requirements - Mobile optimized */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Passwort-Anforderungen:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className={`flex items-center ${formData.newPassword.length >= 6 ? 'text-green-600' : 'text-gray-600'}`}>
                    <span className="w-4 h-4 mr-2 flex-shrink-0">
                      {formData.newPassword.length >= 6 ? '✓' : '•'}
                    </span>
                    Mindestens 6 Zeichen
                  </li>
                  <li className={`flex items-center ${formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'text-green-600' : 'text-gray-600'}`}>
                    <span className="w-4 h-4 mr-2 flex-shrink-0">
                      {formData.newPassword === formData.confirmPassword && formData.confirmPassword ? '✓' : '•'}
                    </span>
                    Passwörter stimmen überein
                  </li>
                </ul>
              </div>

              {/* Buttons - Mobile optimized */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                {!isFirstLogin && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 order-2 sm:order-1"
                  >
                    Abbrechen
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading || formData.newPassword.length < 6 || formData.newPassword !== formData.confirmPassword}
                  className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 order-1 sm:order-2"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Ändere...
                    </div>
                  ) : (
                    isFirstLogin ? 'Passwort erstellen' : 'Passwort ändern'
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

export default ChangePasswordModal;