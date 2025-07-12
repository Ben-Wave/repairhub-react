// frontend/src/components/reseller/Login.js
import React, { useState } from 'react';
import axios from 'axios';

const ResellerLogin = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

        {/* Login Form - Mobile optimized */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
        </form>
      </div>
    </div>
  );
};

export default ResellerLogin;