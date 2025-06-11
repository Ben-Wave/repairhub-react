// frontend/src/components/admin/ResellerManagement.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CreateResellerModal from './CreateResellerModal';
import AssignDeviceModal from './AssignDeviceModal';

const ResellerManagement = () => {
  const [resellers, setResellers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resellers');
  const [filterStatus, setFilterStatus] = useState('all');
  const [revokingAssignment, setRevokingAssignment] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');

  useEffect(() => {
    fetchResellers();
    fetchAssignments();
  }, []);

  const fetchResellers = async () => {
    try {
      const response = await axios.get('/api/admin/resellers');
      setResellers(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Reseller:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/admin/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Fehler beim Laden der Zuweisungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResellerCreated = () => {
    fetchResellers();
    setShowCreateModal(false);
  };

  const handleDeviceAssigned = () => {
    fetchAssignments();
    setShowAssignModal(false);
  };

  // Gerät entziehen
  const revokeDevice = async (assignmentId) => {
    if (!revokeReason || revokeReason.trim().length < 5) {
      alert('Bitte geben Sie einen Grund für die Entziehung an (mindestens 5 Zeichen)');
      return;
    }

    try {
      await axios.patch(`/api/admin/assignments/${assignmentId}/revoke`, {
        reason: revokeReason
      });
      
      setRevokingAssignment(null);
      setRevokeReason('');
      fetchAssignments();
      alert('Gerät erfolgreich entzogen');
    } catch (error) {
      alert('Fehler beim Entziehen: ' + (error.response?.data?.error || 'Unbekannter Fehler'));
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      assigned: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Zugewiesen' },
      received: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Erhalten' },
      sold: { bg: 'bg-green-100', text: 'text-green-800', label: 'Verkauft' },
      returned: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Zurückgezogen' }
    };

    const config = statusConfig[status] || statusConfig.assigned;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'reversed') {
      return assignment.notes && assignment.notes.includes('VERKAUF ZURÜCKGENOMMEN');
    }
    if (filterStatus === 'revoked') {
      return assignment.status === 'returned';
    }
    return assignment.status === filterStatus;
  });

  // Statistiken berechnen
  const reversedSales = assignments.filter(a => 
    a.notes && a.notes.includes('VERKAUF ZURÜCKGENOMMEN')
  ).length;
  
  const revokedDevices = assignments.filter(a => a.status === 'returned').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-optimized container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        
        {/* Header - Mobile optimized */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reseller Management</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Verwalten Sie Ihre Reseller und Gerätezuweisungen</p>
        </div>

        {/* Statistics Grid - Mobile responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <h3 className="text-lg sm:text-xl font-medium text-gray-900">{assignments.length}</h3>
            <p className="text-xs sm:text-sm text-gray-600">Gesamte Zuweisungen</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <h3 className="text-lg sm:text-xl font-medium text-green-600">{assignments.filter(a => a.status === 'sold').length}</h3>
            <p className="text-xs sm:text-sm text-gray-600">Verkauft</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <h3 className="text-lg sm:text-xl font-medium text-orange-600">{reversedSales}</h3>
            <p className="text-xs sm:text-sm text-gray-600">Zurückgenommen</p>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
            <h3 className="text-lg sm:text-xl font-medium text-gray-600">{revokedDevices}</h3>
            <p className="text-xs sm:text-sm text-gray-600">Zurückgezogen</p>
          </div>
        </div>

        {/* Info Panel - Mobile optimized */}
        {(reversedSales > 0 || revokedDevices > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
            <h3 className="text-base sm:text-lg font-medium text-blue-800">📊 Management-Übersicht</h3>
            <div className="text-blue-700 space-y-1 text-sm sm:text-base">
              {reversedSales > 0 && (
                <p>• {reversedSales} Verkäufe wurden von Resellern zurückgenommen.</p>
              )}
              {revokedDevices > 0 && (
                <p>• {revokedDevices} Geräte wurden zur Neuzuweisung zurückgezogen.</p>
              )}
              <p className="text-xs sm:text-sm italic mt-2">
                ℹ️ Diese Aktionen sind normal und beeinträchtigen nicht die Reseller-Statistiken.
              </p>
            </div>
          </div>
        )}

        {/* Mobile-optimized Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('resellers')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'resellers'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reseller ({resellers.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'assignments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Zuweisungen ({assignments.length})
            </button>
          </nav>
        </div>

        {/* Mobile-optimized Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {activeTab === 'resellers' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span>Neuen Reseller erstellen</span>
              </button>
            )}
            {activeTab === 'assignments' && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <span>Gerät zuweisen</span>
              </button>
            )}
          </div>

          {/* Mobile-friendly Filter */}
          {activeTab === 'assignments' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-0 flex-1 sm:flex-none"
              >
                <option value="all">Alle Zuweisungen</option>
                <option value="assigned">Zugewiesen</option>
                <option value="received">Erhalten</option>
                <option value="sold">Verkauft</option>
                <option value="reversed">Zurückgenommene Verkäufe</option>
                <option value="returned">Zurückgezogene Geräte</option>
              </select>
            </div>
          )}
        </div>

        {/* Resellers Tab - Mobile Card Layout */}
        {activeTab === 'resellers' && (
          <div className="space-y-4">
            {resellers.map((reseller) => (
              <div key={reseller._id} className="bg-white rounded-lg shadow p-4">
                {/* Mobile Card Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {reseller.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-base font-medium text-gray-900 truncate">{reseller.name}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        reseller.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {reseller.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    {reseller.company && (
                      <p className="text-sm text-gray-500 truncate">Firma: {reseller.company}</p>
                    )}
                    <p className="text-sm text-gray-500 truncate">{reseller.email}</p>
                    <p className="text-sm text-gray-500">@{reseller.username}</p>
                    {reseller.phone && (
                      <p className="text-sm text-gray-500">{reseller.phone}</p>
                    )}
                  </div>
                </div>

                {/* Mobile Card Stats */}
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-medium text-gray-900">
                      {assignments.filter(a => a.resellerId._id === reseller._id).length}
                    </p>
                    <p className="text-xs text-gray-500">Zuweisungen</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-lg font-medium text-green-600">
                      {assignments.filter(a => a.resellerId._id === reseller._id && a.status === 'sold').length}
                    </p>
                    <p className="text-xs text-gray-500">Verkauft</p>
                  </div>
                  <div className="col-span-2 text-center sm:text-left">
                    <p className="text-xs text-gray-500">
                      Erstellt: {new Date(reseller.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {resellers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">Keine Reseller vorhanden</p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab - Mobile Card Layout */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => (
              <div key={assignment._id} 
                   className={`bg-white rounded-lg shadow p-4 ${
                     assignment.status === 'returned' ? 'border-l-4 border-gray-400' :
                     assignment.notes && assignment.notes.includes('VERKAUF ZURÜCKGENOMMEN') 
                       ? 'border-l-4 border-orange-400' : ''
                   }`}>
                
                {/* Device Header */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    {assignment.deviceId.thumbnail ? (
                      <img 
                        src={assignment.deviceId.thumbnail} 
                        alt={assignment.deviceId.model}
                        className="h-12 w-12 object-contain rounded"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
                        <span className="text-gray-500 text-xs">📱</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="text-base font-medium text-gray-900">{assignment.deviceId.model}</p>
                      {getStatusBadge(assignment.status)}
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {assignment.status === 'returned' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          📋 Zurückgezogen
                        </span>
                      )}
                      {assignment.notes && assignment.notes.includes('VERKAUF ZURÜCKGENOMMEN') && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          ↩️ Verkauf zurückgenommen
                        </span>
                      )}
                      {assignment.notes && assignment.notes.includes('GERÄT ENTZOGEN') && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          📋 Admin-Rückzug
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-1">IMEI: {assignment.deviceId.imei}</p>
                    <p className="text-sm text-gray-500">
                      Reseller: {assignment.resellerId.name} (@{assignment.resellerId.username})
                    </p>
                  </div>
                </div>

                {/* Price and Date Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Mindestpreis: {assignment.minimumPrice}€
                    </p>
                    {assignment.actualSalePrice && (
                      <p className={`text-sm ${
                        assignment.status === 'returned' || 
                        (assignment.notes && assignment.notes.includes('VERKAUF ZURÜCKGENOMMEN'))
                          ? 'text-gray-500 line-through'
                          : 'text-green-600'
                      }`}>
                        {assignment.status === 'returned' 
                          ? `War verkauft für: ${assignment.actualSalePrice}€`
                          : assignment.notes && assignment.notes.includes('VERKAUF ZURÜCKGENOMMEN')
                          ? `War verkauft für: ${assignment.actualSalePrice}€`
                          : `Verkauft für: ${assignment.actualSalePrice}€`
                        }
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Zugewiesen: {new Date(assignment.assignedAt).toLocaleDateString('de-DE')}
                    </p>
                    {assignment.soldAt && (
                      <p className="text-sm text-gray-500">
                        Verkauft: {new Date(assignment.soldAt).toLocaleDateString('de-DE')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end pt-3 border-t border-gray-200">
                  {(assignment.status === 'assigned' || assignment.status === 'received') && (
                    <button
                      onClick={() => setRevokingAssignment(assignment._id)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium transition duration-200"
                    >
                      Zurückziehen
                    </button>
                  )}
                  
                  {assignment.status === 'sold' && (
                    <span className="text-green-600 text-sm font-medium">
                      ✅ Abgeschlossen
                    </span>
                  )}
                  
                  {assignment.status === 'returned' && (
                    <span className="text-gray-500 text-sm font-medium">
                      📋 Zurückgezogen
                    </span>
                  )}
                </div>
                
                {/* Notes Section */}
                {assignment.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    {assignment.status === 'returned' || assignment.notes.includes('GERÄT ENTZOGEN') ? (
                      <div className="bg-gray-100 p-3 rounded border border-gray-200">
                        <h5 className="font-medium text-gray-700 mb-1 text-sm">📋 Gerät zurückgezogen:</h5>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {assignment.notes}
                        </p>
                      </div>
                    ) : assignment.notes.includes('VERKAUF ZURÜCKGENOMMEN') ? (
                      <div className="bg-orange-100 p-3 rounded border border-orange-200">
                        <h5 className="font-medium text-orange-800 mb-1 text-sm">↩️ Verkauf zurückgenommen:</h5>
                        <p className="text-sm text-orange-700 whitespace-pre-wrap">
                          {assignment.notes}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 italic">
                        Notizen: {assignment.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {filteredAssignments.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">
                  {filterStatus === 'all' 
                    ? 'Keine Zuweisungen vorhanden' 
                    : `Keine Zuweisungen mit Status "${filterStatus}" gefunden`
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mobile-optimized Revoke Modal */}
        {revokingAssignment && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative min-h-screen flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-screen overflow-y-auto">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      📋 Gerät zurückziehen
                    </h3>
                    <button
                      onClick={() => {
                        setRevokingAssignment(null);
                        setRevokeReason('');
                      }}
                      className="text-gray-400 hover:text-gray-600 p-2"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      ℹ️ <strong>Info:</strong> Das Gerät wird zur Neuzuweisung zurückgezogen und als "verkaufsbereit" markiert.
                      Diese Aktion beeinflusst nicht die Reseller-Statistiken.
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grund für Rückzug *
                    </label>
                    <textarea
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="z.B. Neuzuweisung erforderlich, andere Strategie, Reseller nicht erreichbar..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                      rows="4"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Mindestens 5 Zeichen erforderlich. Aktuell: {revokeReason.length} Zeichen
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Was passiert beim Rückzug:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Gerätestatus wird auf "verkaufsbereit" gesetzt</li>
                      <li>• Zuweisung wird als "zurückgezogen" markiert</li>
                      <li>• Gerät kann neu zugewiesen werden</li>
                      <li>• Grund wird in den Notizen gespeichert</li>
                      <li>• Reseller-Statistiken bleiben unberührt</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      onClick={() => {
                        setRevokingAssignment(null);
                        setRevokeReason('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => revokeDevice(revokingAssignment)}
                      disabled={revokeReason.length < 5}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {revokeReason.length < 5 ? 'Grund eingeben' : 'Gerät zurückziehen'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateModal && (
          <CreateResellerModal
            onClose={() => setShowCreateModal(false)}
            onResellerCreated={handleResellerCreated}
          />
        )}

        {showAssignModal && (
          <AssignDeviceModal
            onClose={() => setShowAssignModal(false)}
            onDeviceAssigned={handleDeviceAssigned}
            resellers={resellers}
          />
        )}
      </div>
    </div>
  );
};

export default ResellerManagement;