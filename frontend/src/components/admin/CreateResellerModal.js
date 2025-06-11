// frontend/src/components/admin/CreateResellerModal.js
import React, { useState } from 'react';
import axios from 'axios';

const CreateResellerModal = ({ onClose, onResellerCreated }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    name: '',
    company: '',
    phone: ''
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
      const response = await axios.post('/api/admin/resellers', formData);
      
      // Temporäres Passwort anzeigen
      const newReseller = response.data;
      alert(`✅ Reseller erfolgreich erstellt!\n\n🔐 Login-Daten:\nUsername: ${newReseller.username}\nPasswort: ${newReseller.temporaryPassword}\n\n⚠️ Der Reseller muss beim ersten Login ein neues Passwort erstellen.`);
      
      onResellerCreated();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Erstellen des Resellers');
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
                  Neuen Reseller erstellen
                </h3>
              </div>
              <button
                onClick={onClose}
                className="ml-3 p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* Info Panel - Mobile optimized */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>ℹ️ Hinweis:</strong> Das initiale Passwort wird automatisch auf den Benutzernamen gesetzt. 
                Der Reseller muss beim ersten Login ein neues Passwort erstellen.
              </p>
            </div>
            
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
                  Benutzername *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="z.B. mueller_reseller"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Wird auch als initiales Passwort verwendet
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="reseller@beispiel.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Firma (optional)
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="Mustermann GmbH"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon (optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  placeholder="+49 123 456 789"
                />
              </div>

              {/* Preview - Mobile optimized */}
              {formData.username && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Vorschau der Login-Daten:</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>Benutzername:</strong> {formData.username}</p>
                    <p><strong>Initiales Passwort:</strong> {formData.username}</p>
                    <p className="text-xs text-orange-600 mt-2">
                      ⚠️ Der Reseller muss das Passwort beim ersten Login ändern
                    </p>
                  </div>
                </div>
              )}

              {/* Buttons - Mobile optimized */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 order-2 sm:order-1"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.username || !formData.email || !formData.name}
                  className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 order-1 sm:order-2"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Erstelle...
                    </div>
                  ) : (
                    'Reseller erstellen'
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

export default CreateResellerModal;