import React, { useState, useEffect } from 'react';
import ResellerLogin from './Login';
import ResellerDashboard from './Dashboard';
import ChangePasswordModal from './ChangePasswordModal';

const ResellerApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [reseller, setReseller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    // Prüfen ob bereits eingeloggt
    const token = localStorage.getItem('resellerToken');
    const resellerData = localStorage.getItem('resellerData');

    if (token && resellerData) {
      try {
        const parsedReseller = JSON.parse(resellerData);
        setReseller(parsedReseller);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('resellerToken');
        localStorage.removeItem('resellerData');
      }
    }
    setLoading(false);
  }, []);

  // Zugriffsbeschränkung implementieren
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNavigation = (e) => {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/reseller')) {
        return;
      }
      
      e.preventDefault();
      e.stopPropagation();
      window.history.pushState({}, '', '/reseller');
      alert('Zugriff verweigert. Sie sind als Reseller angemeldet und können nur auf das Reseller-Dashboard zugreifen.');
    };

    const links = document.querySelectorAll('a');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('/reseller') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        link.addEventListener('click', handleNavigation);
      }
    });

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/reseller')) {
        window.history.pushState({}, '', '/reseller');
        alert('Sie können das Reseller-Dashboard nicht verlassen. Bitte loggen Sie sich aus, um zur Hauptseite zu gelangen.');
      }
    };

    window.addEventListener('popstate', handlePopState);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(state, title, url) {
      if (isAuthenticated && url && !url.startsWith('/reseller')) {
        console.warn('Navigation blockiert:', url);
        return;
      }
      return originalPushState.apply(this, arguments);
    };

    window.history.replaceState = function(state, title, url) {
      if (isAuthenticated && url && !url.startsWith('/reseller')) {
        console.warn('Navigation blockiert:', url);
        return;
      }
      return originalReplaceState.apply(this, arguments);
    };

    return () => {
      links.forEach(link => {
        link.removeEventListener('click', handleNavigation);
      });
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [isAuthenticated]);

  const handleLogin = (resellerData, token, passwordStatus = {}) => {
    setReseller(resellerData);
    setIsAuthenticated(true);
    
    // NEU: Passwort-Status prüfen
    if (passwordStatus.mustChangePassword) {
      setMustChangePassword(true);
      setIsFirstLogin(passwordStatus.firstLogin || false);
    }
    
    if (window.location.pathname !== '/reseller') {
      window.history.pushState({}, '', '/reseller');
    }
  };

const handleLogout = () => {
  setReseller(null);
  setIsAuthenticated(false);
  setMustChangePassword(false);
  setIsFirstLogin(false);
  // GEÄNDERT: Nicht zur Hauptseite umleiten, bei Reseller-Login bleiben
  // window.location.href = '/'; // ENTFERNT
};

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
    setIsFirstLogin(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Reseller-Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Warnhinweis für Reseller */}
      {isAuthenticated && (
        <div className="bg-blue-600 text-white text-center py-2 text-sm">
          Sie sind als Reseller angemeldet. Zugriff ist auf das Reseller-Dashboard beschränkt.
        </div>
      )}
      
      {isAuthenticated ? (
        <>
          <ResellerDashboard 
            reseller={reseller} 
            onLogout={handleLogout} 
          />
          
          {/* Passwort-Ändern Modal */}
          {mustChangePassword && (
            <ChangePasswordModal
              isFirstLogin={isFirstLogin}
              onPasswordChanged={handlePasswordChanged}
              onClose={!isFirstLogin ? () => setMustChangePassword(false) : undefined}
            />
          )}
        </>
      ) : (
        <ResellerLogin onLogin={handleLogin} />
      )}
    </div>
  );
};

export default ResellerApp;