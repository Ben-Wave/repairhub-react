// frontend/src/components/pages/RegisterResellerPage.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const RegisterResellerPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [inviteData, setInviteData] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: '',
    phone: ''
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
      const response = await axios.get(`/api/admin/validate-invite/${token}`);
      setInviteData(response.data);
      
      // Vorausfüllen falls Daten bereits bekannt
      if (response.data.name) {
        setFormData(prev => ({ ...prev, name: response.data.name }));
      }
      if (response.data.company) {
        setFormData(prev => ({ ...prev, company: response.data.company }));
      }
      if (response.data.phone) {
        setFormData(prev => ({ ...prev, phone: response.data.phone }));
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
      await axios.post('/api/admin/complete-registration', {
        token,
        username: formData.username,
        password: formData.password,
        name: formData.name,
        company: formData.company,
        phone: formData.phone
      });

      setSuccess(true);
      // Nach 3 Sekunden zur Reseller-Login-Seite weiterleiten
      setTimeout(() => {
        navigate('/reseller/login');
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🏪 RepairHub</h1>
            <p className="text-gray-600">Reseller-Netzwerk</p>
          </div>

          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
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
                  <li>• Reseller-Account wurde bereits erstellt</li>
                </ul>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => navigate('/reseller/login')}
                  className="text-green-600 hover:text-green-500 font-medium"
                >
                  Zur Reseller-Anmeldung →
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">🏪</div>
              <h2 className="text-xl font-medium text-gray-900 mb-4">Willkommen im Reseller-Netzwerk!</h2>
              <p className="text-gray-600 mb-6">
                Ihr Reseller-Account wurde erfolgreich erstellt. Sie werden automatisch zur Anmeldung weitergeleitet.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="text-sm text-green-700">
                  <p><strong>🏪 Benutzername:</strong> {formData.username}</p>
                  <p><strong>📧 E-Mail:</strong> {inviteData.email}</p>
                  {formData.company && <p><strong>🏢 Firma:</strong> {formData.company}</p>}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h4 className="font-medium text-blue-800 mb-2">🎯 Ihre nächsten Schritte:</h4>
                <ol className="text-sm text-blue-700 text-left space-y-1">
                  <li>1. Loggen Sie sich in Ihr Reseller-Portal ein</li>
                  <li>2. Warten Sie auf Ihre ersten Gerätezuweisungen</li>
                  <li>3. Verkaufen Sie Geräte mit attraktiven Gewinnmargen</li>
                  <li>4. Nutzen Sie unser Dashboard zur Verwaltung</li>
                </ol>
              </div>

              <button
                onClick={() => navigate('/reseller/login')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                🏪 Zum Reseller-Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">🏪 RepairHub</h1>
          <p className="text-gray-600">Reseller-Netzwerk</p>
        </div>

        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <h2 className="text-xl font-medium text-gray-900 text-center mb-4">
              🎉 Willkommen im Reseller-Programm!
            </h2>
            
            {/* Einladungsinfo */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="text-sm text-green-700">
                <p><strong>📧 Eingeladen als:</strong> {inviteData.email}</p>
                {inviteData.company && <p><strong>🏢 Firma:</strong> {inviteData.company}</p>}
                {inviteData.timeRemaining > 0 && (
                  <p><strong>⏰ Gültig noch:</strong> {formatTimeRemaining(inviteData.timeRemaining)}</p>
                )}
              </div>
            </div>

            {/* Reseller-Vorteile */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <h4 className="font-medium text-blue-800 mb-2">🎯 Ihre Reseller-Vorteile:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 💰 Hohe Gewinnmargen - Sie behalten alles über dem Mindestpreis</li>
                <li>• 📱 Geprüfte, reparierte Smartphones in Top-Qualität</li>
                <li>• 📊 Echtzeit-Dashboard zur Inventarverwaltung</li>
                <li>• 🤝 Direkter Support durch RepairHub</li>
              </ul>
            </div>

            <p className="text-gray-600 text-center text-sm">
              Vervollständigen Sie Ihre Registrierung, um zu starten.
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Max Mustermann"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Firma (optional)
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Mustermann Electronics GmbH"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefon (optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="+49 123 456 789"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="max.mustermann"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wird für die Anmeldung im Reseller-Portal verwendet
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
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
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Passwort wiederholen"
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Als RepairHub-Reseller erhalten Sie:</p>
                <ul className="space-y-1 text-xs">
                  <li>✓ Zugang zum exklusiven Reseller-Portal</li>
                  <li>✓ Hochwertige, reparierte Smartphones</li>
                  <li>✓ Transparente Preisgestaltung</li>
                  <li>✓ Persönliche Betreuung</li>
                  <li>✓ Echtzeit-Verkaufsstatistiken</li>
                </ul>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registrierung läuft...
                </div>
              ) : (
                '🏪 Reseller-Account aktivieren'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Haben Sie bereits einen Reseller-Account?{' '}
              <button
                onClick={() => navigate('/reseller/login')}
                className="text-green-600 hover:text-green-500 font-medium"
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

export default RegisterResellerPage;