// frontend/src/components/reseller/Login.js - MIT Password Reset
import React, { useState } from 'react';
import axios from 'axios';

const ResellerLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // NEU: Password Reset State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', formData);
      const { token, reseller, mustChangePassword, firstLogin } = response.data;
      
      // Token speichern
      localStorage.setItem('resellerToken', token);
      localStorage.setItem('resellerData', JSON.stringify(reseller));
      
      // Passwort-Status weitergeben
      onLogin(reseller, token, { mustChangePassword, firstLogin });
    } catch (error) {
      setError(error.response?.data?.error || 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  // NEU: Password Reset Handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetLoading(true);
    setError('');
    setResetMessage('');

    try {
      const response = await axios.post('/api/auth/request-password-reset', {
        email: resetEmail
      });

      setResetMessage(response.data.message);
      setShowForgotPassword(false);
      setResetEmail('');
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Anfordern des Password-Resets');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header - Mobile optimized */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl sm:text-3xl">🔧</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Reseller Login
          </h2>
          <p className="mt-2 text-sm sm:text-base text-center text-gray-600">
            Melden Sie sich mit Ihren Zugangsdaten an
          </p>
        </div>

        {/* Success/Error Messages */}
        {resetMessage && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{resetMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {!showForgotPassword ? (
          /* BESTEHENDE LOGIN FORM */
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Benutzername oder E-Mail
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base"
                  placeholder="Ihr Benutzername"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Passwort
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base"
                  placeholder="Ihr Passwort"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* NEU: Passwort vergessen Link */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                🔒 Passwort vergessen?
              </button>
            </div>

            {/* Login Button - Mobile optimized */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Anmeldung läuft...
                  </div>
                ) : (
                  <>
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                      <svg className="h-5 w-5 text-indigo-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                      </svg>
                    </span>
                    Anmelden
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* NEU: PASSWORD RESET FORM */
          <form className="mt-8 space-y-6" onSubmit={handleForgotPassword}>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                🔒 Passwort zurücksetzen
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
              </p>
              
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Ihre E-Mail-Adresse"
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                  setError('');
                  setResetMessage('');
                }}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Abbrechen
              </button>
              
              <button
                type="submit"
                disabled={resetLoading || !resetEmail}
                className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Senden...
                  </div>
                ) : (
                  'Reset-Link senden'
                )}
              </button>
            </div>
          </form>
        )}

        {/* Help Info - Mobile optimized */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Erste Anmeldung?</h3>
          <div className="text-xs sm:text-sm text-blue-800 space-y-1">
            <p>• Ihr Administrator hat Ihnen Zugangsdaten zugesendet</p>
            <p>• Beim ersten Login erstellen Sie ein neues Passwort</p>
            <p>• Das temporäre Passwort ist Ihr Benutzername</p>
          </div>
        </div>

        {/* Contact Info - Mobile optimized */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-600 mb-2">
            Probleme beim Login?
          </p>
          <div className="space-y-1 text-xs sm:text-sm text-gray-700">
            <p>📧 admin@repairhub.ovh</p>
            <p>📱 017631762175</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResellerLogin;