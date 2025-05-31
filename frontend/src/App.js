// frontend/src/App.js - Komplett mit Admin Login
import React, { useEffect } from 'react';
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
import './App.css';

// Route Protection für Admin-Bereich
const ProtectedRoute = ({ children }) => {
  const resellerToken = localStorage.getItem('resellerToken');
  
  // Wenn Reseller eingeloggt ist, blockiere Zugriff auf Admin-Bereich
  if (resellerToken) {
    return <Navigate to="/reseller" replace />;
  }
  
  return children;
};

// Admin Routes Komponente
const AdminRoutes = ({ admin, onLogout }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar admin={admin} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8 flex-grow">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<DeviceList />} />
          <Route path="/devices/add" element={<AddDevice />} />
          <Route path="/devices/:id" element={<DeviceDetails />} />
          <Route path="/devices/edit/:id" element={<EditDevice />} />
          <Route path="/parts" element={<PartsList />} />
          <Route path="/parts/add" element={<AddPart />} />
          <Route path="/foneday-search" element={<FonedaySearch />} />
          <Route path="/sync-settings" element={<SyncSettings />} />
          <Route path="/calculator" element={<PriceCalculator />} />
          <Route path="/admin/resellers" element={<ResellerManagement />} />
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