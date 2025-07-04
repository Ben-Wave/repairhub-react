// frontend/src/components/pages/RegisterPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [inviteData, setInviteData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Token validieren beim Laden der Seite
  useEffect(() => {
    if (!token) {
      setError('Kein Einladungstoken gefunden');
      setLoading(false);
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await axios.get(`/api/user-management/validate-invite/${token}`);
      setInviteData(response.data);
      
      // Vorausfüllen falls Name bereits bekannt
      if (response.data.name) {
        setFormData(prev => ({ ...prev, name: response.data.name }));
      }
      
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Ungültiger Einladungslink');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Validierung
    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      setSubmitting(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      setSubmitting(false);
      return;
    }

    try {
      await axios.post('/api/user-management/complete-registration', {
        token,
        username: formData.username,
        password: formData.password,
        name: formData.name
      });

      setSuccess(true);
      // Nach 3 Sekunden zur Login-Seite weiterleiten
      setTimeout(() => {
        navigate('/admin/login');
      }, 3000);

    } catch (error) {
      setError(error.response?.data?.error || 'Fehler bei der Registrierung');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Einladung wird überprüft...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">RepairHub</h1>
            <p className="text-gray-600">Smartphone-Manager System</p>
          </div>

          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">❌</div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Einladung ungültig</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              
              <div className="space-y-2 text-sm text-gray-500">
                <p>Mögliche Ursachen:</p>
                <ul className="text-left space-y-1">
                  <li>• Link ist abgelaufen (48h Gültigkeit)</li>
                  <li>• Link wurde bereits verwendet</li>
                  <li>• Ungültiger oder manipulierter Link</li>
                  <li>• Account wurde bereits erstellt</li>
                </ul>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate('/admin/login')}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Zur Anmeldung →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success State
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Registrierung erfolgreich!</h2>
              <p className="text-gray-600 mb-6">
                Ihr Account wurde erfolgreich erstellt. Sie werden automatisch zur Anmeldung weitergeleitet.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="text-sm text-green-700">
                  <p><strong>Benutzername:</strong> {formData.username}</p>
                  <p><strong>E-Mail:</strong> {inviteData.email}</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/admin/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                Jetzt anmelden
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RepairHub</h1>
          <p className="text-gray-600">Smartphone-Manager System</p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-900 text-center mb-4">
              🎉 Willkommen bei RepairHub!
            </h2>
            
            {/* Einladungsinfo */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="text-sm text-blue-700">
                <p><strong>📧 Eingeladen als:</strong> {inviteData.email}</p>
                <p><strong>👤 Rolle:</strong> {inviteData.roleName}</p>
                {inviteData.timeRemaining > 0 && (
                  <p><strong>⏰ Gültig noch:</strong> {formatTimeRemaining(inviteData.timeRemaining)}</p>
                )}
              </div>
            </div>

            <p className="text-gray-600 text-center text-sm">
              Vervollständigen Sie Ihre Registrierung, um Zugang zu erhalten.
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-Mail-Adresse
              </label>
              <input
                type="email"
                value={inviteData.email}
                disabled
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vollständiger Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Benutzername *
              </label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="max.mustermann"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird für die Anmeldung verwendet
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Passwort *
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Passwort bestätigen *
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Passwort wiederholen"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Nach der Registrierung erhalten Sie:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Zugang zum RepairHub Admin-Panel</li>
                  <li>✓ Berechtigungen entsprechend Ihrer Rolle</li>
                  <li>✓ Vollständigen Zugriff auf Ihre Features</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrierung läuft...
                </div>
              ) : (
                '🔐 Registrierung abschließen'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Haben Sie bereits einen Account?{' '}
              <button
                onClick={() => navigate('/admin/login')}
                className="text-indigo-600 hover:text-indigo-500 font-medium"
              >
                Hier anmelden
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;