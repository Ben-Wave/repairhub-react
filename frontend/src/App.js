// frontend/src/App.js - Erweitert mit Rollen-Support
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DeviceProvider } from './context/DeviceContext';
import { PartsProvider } from './context/PartsContext';
import AdminApp from './components/admin/AdminApp';
import Navbar from './components/layout/Navbar';
import Dashboard from './components/pages/Dashboard';
import DeviceList from './components/devices/DeviceList';
import DeviceDetails from './components/devices/DeviceDetails';
import AddDevice from './components/devices/AddDevice';
import EditDevice from './components/devices/EditDevice';
import PartsList from './components/parts/PartsList';
import AddPart from './components/parts/AddPart';
import PriceCalculator from './components/tools/PriceCalculator';
import FonedaySearch from './components/parts/FonedaySearch';
import SyncSettings from './components/parts/SyncSettings';
import NotFound from './components/pages/NotFound';
import ResellerApp from './components/reseller/ResellerApp';
import ResellerManagement from './components/admin/ResellerManagement';
import UserManagement from './components/admin/UserManagement';
import axios from 'axios';
import './App.css';

// NEU: Permission Check Hook
const usePermissions = () => {
  const [userPermissions, setUserPermissions] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermissions = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('/api/auth/user-info', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.type === 'admin') {
          setUserPermissions(response.data.user.permissions);
          setUserRole(response.data.user.role);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Berechtigungen:', error);
        localStorage.removeItem('adminToken');
      }
      setLoading(false);
    };

    checkPermissions();
  }, []);

  const hasPermission = (category, permission) => {
    if (userRole === 'super_admin') return true;
    if (!userPermissions) return false;
    return userPermissions[category] && userPermissions[category][permission];
  };

  return { hasPermission, userPermissions, userRole, loading };
};

// NEU: Protected Route Komponente mit Berechtigungsprüfung
const ProtectedRoute = ({ children, requiredPermission, fallback = <Navigate to="/unauthorized" replace /> }) => {
  const { hasPermission, loading } = usePermissions();
  const resellerToken = localStorage.getItem('resellerToken');
  
  // Wenn Reseller eingeloggt ist, blockiere Zugriff auf Admin-Bereich
  if (resellerToken) {
    return <Navigate to="/reseller" replace />;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  // Wenn keine spezifische Berechtigung erforderlich ist
  if (!requiredPermission) {
    return children;
  }

  // Berechtigung prüfen
  const [category, permission] = requiredPermission.split('.');
  if (hasPermission(category, permission)) {
    return children;
  }

  return fallback;
};

// NEU: Unauthorized Komponente
const Unauthorized = () => {
  const { userPermissions, userRole } = usePermissions();
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Zugriff verweigert</h2>
        <p className="text-gray-600 mb-4">
          Sie haben nicht die erforderlichen Berechtigungen für diese Seite.
        </p>
        {userRole && (
          <p className="text-sm text-gray-500 mb-4">Ihre Rolle: {userRole}</p>
        )}
        {userPermissions && userPermissions.tools && userPermissions.tools.priceCalculator && (
          <a 
            href="/calculator"
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Zum Preisrechner
          </a>
        )}
      </div>
    </div>
  );
};

// NEU: Calculator Only App für reine Preisrechner-Benutzer
const CalculatorOnlyApp = ({ admin, onLogout }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <nav className="bg-blue-900 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Preisrechner</h1>
          <div className="flex items-center space-x-4">
            <span>Willkommen, {admin?.name}</span>
            <button
              onClick={onLogout}
              className="bg-blue-700 hover:bg-blue-600 px-3 py-1 rounded text-sm"
            >
              Abmelden
            </button>
          </div>
        </div>
      </nav>
      <main className="container mx-auto px-4 py-8 flex-grow">
        <PriceCalculator />
      </main>
    </div>
  );
};

// Admin Routes Komponente
const AdminRoutes = ({ admin, onLogout }) => {
  const { hasPermission, userPermissions, loading } = usePermissions();

  // Während die Berechtigungen laden, zeige einen Spinner
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Navbar admin={admin} onLogout={onLogout} />
        <main className="container mx-auto px-4 py-8 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Berechtigungen...</p>
          </div>
        </main>
      </div>
    );
  }

  // Wenn Benutzer nur Preisrechner-Berechtigung hat (und sonst nichts)
  if (userPermissions && 
      userPermissions.tools && 
      userPermissions.tools.priceCalculator &&
      !hasPermission('devices', 'view') &&
      !hasPermission('parts', 'create') &&
      !hasPermission('system', 'userManagement') &&
      !hasPermission('system', 'statistics')) {
    return <CalculatorOnlyApp admin={admin} onLogout={onLogout} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar admin={admin} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Routes>
          {/* Dashboard Route - verfügbar für alle mit system.statistics ODER wenn keine spezifischen Berechtigungen gesetzt sind */}
          <Route path="/" element={
            hasPermission('system', 'statistics') || !userPermissions ? 
            <Dashboard /> : 
            hasPermission('tools', 'priceCalculator') ?
            <Navigate to="/calculator" replace /> :
            <Navigate to="/unauthorized" replace />
          } />
          
          {/* Geräte-Routen */}
          <Route path="/devices" element={
            <ProtectedRoute requiredPermission="devices.view">
              <DeviceList />
            </ProtectedRoute>
          } />
          <Route path="/devices/add" element={
            <ProtectedRoute requiredPermission="devices.create">
              <AddDevice />
            </ProtectedRoute>
          } />
          <Route path="/devices/:id" element={
            <ProtectedRoute requiredPermission="devices.view">
              <DeviceDetails />
            </ProtectedRoute>
          } />
          <Route path="/devices/edit/:id" element={
            <ProtectedRoute requiredPermission="devices.edit">
              <EditDevice />
            </ProtectedRoute>
          } />
          
          {/* Ersatzteile-Routen */}
          <Route path="/parts" element={
            <ProtectedRoute requiredPermission="parts.view">
              <PartsList />
            </ProtectedRoute>
          } />
          <Route path="/parts/add" element={
            <ProtectedRoute requiredPermission="parts.create">
              <AddPart />
            </ProtectedRoute>
          } />
          <Route path="/foneday-search" element={
            <ProtectedRoute requiredPermission="parts.view">
              <FonedaySearch />
            </ProtectedRoute>
          } />
          <Route path="/sync-settings" element={
            <ProtectedRoute requiredPermission="system.settings">
              <SyncSettings />
            </ProtectedRoute>
          } />
          
          {/* Preisrechner - für alle mit tools.priceCalculator Berechtigung */}
          <Route path="/calculator" element={
            <ProtectedRoute requiredPermission="tools.priceCalculator">
              <PriceCalculator />
            </ProtectedRoute>
          } />
          
          {/* Admin-Routen */}
          <Route path="/admin/resellers" element={
            <ProtectedRoute requiredPermission="resellers.view">
              <ResellerManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute requiredPermission="system.userManagement">
              <UserManagement />
            </ProtectedRoute>
          } />
          
          {/* Unauthorized Route */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="bg-blue-900 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} Repairhub</p>
      </footer>
    </div>
  );
};

function App() {
  useEffect(() => {
    // Global Navigation Guard
    const checkResellerAccess = () => {
      const resellerToken = localStorage.getItem('resellerToken');
      const currentPath = window.location.pathname;
      
      // Wenn Reseller eingeloggt ist und versucht andere Seiten zu besuchen
      if (resellerToken && !currentPath.startsWith('/reseller')) {
        window.location.href = '/reseller';
      }
    };

    // Bei App-Start prüfen
    checkResellerAccess();
    
    // Bei Route-Änderungen prüfen
    window.addEventListener('popstate', checkResellerAccess);
    
    return () => {
      window.removeEventListener('popstate', checkResellerAccess);
    };
  }, []);

  return (
    <DeviceProvider>
      <PartsProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Reseller Routes - separate Layout, ungeschützt */}
              <Route path="/reseller*" element={<ResellerApp />} />
              
              {/* Admin Routes - geschützt vor Reseller-Zugriff UND mit Admin Login */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <AdminApp>
                    <AdminRoutes />
                  </AdminApp>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </PartsProvider>
    </DeviceProvider>
  );
}

export default App;