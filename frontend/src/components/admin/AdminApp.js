import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import ChangePasswordModal from './ChangePasswordModal';

const AdminApp = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');

    if (token && adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        setAdmin(parsedAdmin);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (adminData, token, passwordStatus = {}) => {
    setAdmin(adminData);
    setIsAuthenticated(true);
    
    // NEU: Passwort-Status prüfen
    if (passwordStatus.mustChangePassword) {
      setMustChangePassword(true);
      setIsFirstLogin(passwordStatus.firstLogin || false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdmin(null);
    setIsAuthenticated(false);
    setMustChangePassword(false);
    setIsFirstLogin(false);
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
    setIsFirstLogin(false);
    // Admin-Daten aktualisieren
    if (admin) {
      const updatedAdmin = { ...admin, mustChangePassword: false, firstLogin: false };
      setAdmin(updatedAdmin);
      localStorage.setItem('adminData', JSON.stringify(updatedAdmin));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Repairhub...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <>
      {React.cloneElement(children, { admin, onLogout: handleLogout })}
      
      {/* NEU: Passwort-Ändern Modal */}
      {mustChangePassword && (
        <ChangePasswordModal
          isOpen={mustChangePassword}
          onClose={!isFirstLogin ? () => setMustChangePassword(false) : undefined}
          onSuccess={handlePasswordChanged}
          isFirstLogin={isFirstLogin}
          username={admin?.username}
        />
      )}
    </>
  );
};

export default AdminApp;