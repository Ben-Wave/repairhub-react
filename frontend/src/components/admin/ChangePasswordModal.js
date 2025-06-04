// ChangePasswordModal.js - frontend/src/components/admin/ChangePasswordModal.js
import React, { useState } from 'react';
import axios from 'axios';

const ChangePasswordModal = ({ isOpen, onClose, onSuccess, isFirstLogin = false, username }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Fehler zurücksetzen wenn User tippt
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      setError('Aktuelles Passwort ist erforderlich');
      return false;
    }
    
    if (!formData.newPassword || formData.newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return false;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      setError('Neues Passwort muss sich vom aktuellen unterscheiden');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('resellerToken');
      
      await axios.post('/api/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      onSuccess();
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Ändern des Passworts');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    if (password.length < 6) return { strength: 1, text: 'Zu kurz', color: 'text-red-500' };
    if (password.length < 8) return { strength: 2, text: 'Schwach', color: 'text-orange-500' };
    if (password.length >= 8 && /[0-9]/.test(password)) return { strength: 3, text: 'Mittel', color: 'text-yellow-500' };
    if (password.length >= 8 && /[0-9]/.test(password) && /[A-Z]/.test(password)) return { strength: 4, text: 'Stark', color: 'text-green-500' };
    return { strength: 2, text: 'Schwach', color: 'text-orange-500' };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="text-center mb-4">
            <div className={`text-4xl mb-2 ${isFirstLogin ? '🔐' : '🔑'}`}>
              {isFirstLogin ? '🔐' : '🔑'}
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {isFirstLogin ? 'Passwort bei Erstanmeldung ändern' : 'Passwort ändern'}
            </h3>
            {isFirstLogin && (
              <p className="text-sm text-gray-600 mt-2">
                Willkommen! Bitte wählen Sie ein neues sicheres Passwort.
              </p>
            )}
          </div>
          
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {isFirstLogin && (
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start">
                <div className="text-blue-400 text-lg mr-2">ℹ️</div>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Ihr temporäres Passwort</p>
                  <p>Aktuelles Passwort: <span className="font-mono bg-blue-100 px-1 rounded">{username}</span></p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {isFirstLogin ? 'Temporäres Passwort' : 'Aktuelles Passwort'} *
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  name="currentPassword"
                  required
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder={isFirstLogin ? `Ihr Username: ${username}` : ''}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Neues Passwort *</label>
              <div className="relative">
                <input
                  type={showPasswords ? "text" : "password"}
                  name="newPassword"
                  required
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {/* Passwort-Stärke Anzeige */}
              {formData.newPassword && (
                <div className="mt-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                          passwordStrength.strength === 2 ? 'bg-orange-500 w-2/4' :
                          passwordStrength.strength === 3 ? 'bg-yellow-500 w-3/4' :
                          passwordStrength.strength === 4 ? 'bg-green-500 w-full' : 'w-0'
                        }`}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Neues Passwort bestätigen *</label>
              <input
                type={showPasswords ? "text" : "password"}
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {/* Bestätigungs-Feedback */}
              {formData.confirmPassword && formData.newPassword && (
                <div className="mt-1">
                  {formData.newPassword === formData.confirmPassword ? (
                    <span className="text-xs text-green-600 flex items-center">
                      ✓ Passwörter stimmen überein
                    </span>
                  ) : (
                    <span className="text-xs text-red-600 flex items-center">
                      ✗ Passwörter stimmen nicht überein
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Passwörter anzeigen Toggle */}
            <div className="flex items-center">
              <input
                id="show-passwords"
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="show-passwords" className="ml-2 block text-sm text-gray-700">
                Passwörter anzeigen
              </label>
            </div>

            {/* Passwort-Tipps */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">💡 Tipps für ein sicheres Passwort:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Mindestens 8 Zeichen lang</li>
                <li>• Kombinieren Sie Groß- und Kleinbuchstaben</li>
                <li>• Verwenden Sie Zahlen und Sonderzeichen</li>
                <li>• Vermeiden Sie persönliche Informationen</li>
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
                disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Ändere...' : 'Passwort ändern'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;