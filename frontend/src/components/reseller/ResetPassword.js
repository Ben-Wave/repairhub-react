// frontend/src/components/reseller/ResetPassword.js - NEU ERSTELLEN
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Kein Reset-Token gefunden. Bitte fordern Sie einen neuen Reset-Link an.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }

    try {
      await axios.post('/api/auth/reset-password', {
        token,
        newPassword: password
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/reseller');
      }, 3000);

    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Zurücksetzen des Passworts');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Passwort zurückgesetzt!</h2>
            <p className="text-gray-600 mb-4">
              Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden automatisch zur Login-Seite weitergeleitet.
            </p>
            <button
              onClick={() => navigate('/reseller')}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Jetzt anmelden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Neues Passwort setzen</h2>
            <p className="text-gray-600 mt-2">RepairHub Reseller-Portal</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Neues Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passwort bestätigen
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                placeholder="Passwort wiederholen"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-base transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Passwort wird zurückgesetzt...
                </div>
              ) : (
                'Passwort zurücksetzen'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/reseller')}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              ← Zurück zum Login
            </button>
          </div>

          {/* Password Requirements */}
          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Passwort-Anforderungen:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Mindestens 6 Zeichen</li>
              <li>• Keine besonderen Zeichen erforderlich</li>
              <li>• Beide Eingaben müssen übereinstimmen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;