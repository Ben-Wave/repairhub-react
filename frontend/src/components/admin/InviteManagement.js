// frontend/src/components/admin/InviteManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InviteManagement = () => {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInvites();
  }, []);

  const fetchInvites = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/user-management/invites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvites(response.data);
    } catch (error) {
      setError('Fehler beim Laden der Einladungen');
    } finally {
      setLoading(false);
    }
  };

  const resendInvite = async (inviteId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`/api/user-management/resend-invite/${inviteId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Einladung erfolgreich erneut gesendet');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim erneuten Senden');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteInvite = async (inviteId) => {
    if (!window.confirm('Möchten Sie diese Einladung wirklich widerrufen?')) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/user-management/invites/${inviteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvites(invites.filter(invite => invite._id !== inviteId));
      setSuccess('Einladung erfolgreich widerrufen');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.response?.data?.error || 'Fehler beim Widerrufen der Einladung');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const remaining = expiry - now;
    
    if (remaining <= 0) return 'Abgelaufen';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const remaining = expiry - now;
    const hoursRemaining = remaining / (1000 * 60 * 60);
    
    if (remaining <= 0) return 'bg-red-100 text-red-800';
    if (hoursRemaining < 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const copyInviteLink = (token) => {
    const inviteUrl = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    setSuccess('Einladungslink in Zwischenablage kopiert');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              📧 Offene Einladungen
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Verwalten Sie ausstehende Benutzereinladungen
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {invites.length} {invites.length === 1 ? 'Einladung' : 'Einladungen'}
          </div>
        </div>

        {(error || success) && (
          <div className={`mb-4 p-4 rounded-md ${
            error ? 'bg-red-50 border border-red-200 text-red-700' : 
                   'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {error || success}
          </div>
        )}

        {invites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine offenen Einladungen</h3>
            <p className="text-gray-500">
              Alle Einladungen wurden verwendet oder sind abgelaufen.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="space-y-4">
              {invites.map((invite) => (
                <div key={invite._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {invite.email}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invite.expiresAt)}`}>
                          {formatTimeRemaining(invite.expiresAt)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        {invite.name && (
                          <p><strong>Name:</strong> {invite.name}</p>
                        )}
                        <p><strong>Rolle:</strong> {invite.roleId?.displayName || invite.role}</p>
                        <p><strong>Eingeladen von:</strong> {invite.createdBy?.name || 'Unbekannt'}</p>
                        <p><strong>Erstellt:</strong> {new Date(invite.createdAt).toLocaleString('de-DE')}</p>
                        <p><strong>Läuft ab:</strong> {new Date(invite.expiresAt).toLocaleString('de-DE')}</p>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => copyInviteLink(invite.token)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        title="Einladungslink kopieren"
                      >
                        📋 Link kopieren
                      </button>
                      
                      <button
                        onClick={() => resendInvite(invite._id)}
                        className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-xs font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
                        title="E-Mail erneut senden"
                      >
                        📧 Erneut senden
                      </button>
                      
                      <button
                        onClick={() => deleteInvite(invite._id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                        title="Einladung widerrufen"
                      >
                        🗑️ Widerrufen
                      </button>
                    </div>
                  </div>

                  {/* Erweiterte Informationen (ausklappbar) */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                      🔍 Details anzeigen
                    </summary>
                    <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <strong>Token (erste 8 Zeichen):</strong><br/>
                          <code className="bg-gray-200 px-1 rounded">{invite.token.substring(0, 8)}...</code>
                        </div>
                        <div>
                          <strong>Einladungslink:</strong><br/>
                          <code className="bg-gray-200 px-1 rounded break-all">
                            {`${window.location.origin}/register?token=${invite.token.substring(0, 12)}...`}
                          </code>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aktualisieren Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={fetchInvites}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            🔄 Aktualisieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteManagement;