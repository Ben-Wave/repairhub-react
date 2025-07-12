// frontend/src/components/layout/Navbar.js - Mit PurchaseGuide Integration
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ admin, onLogout }) => {
  const location = useLocation();
  const [userPermissions, setUserPermissions] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setIsLoading(false);
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
      }
      setIsLoading(false);
    };

    loadPermissions();
  }, []);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const closeMobileMenu = () => {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
      mobileMenu.classList.add('hidden');
    }
  };

  const hasPermission = (category, permission) => {
    if (userRole === 'super_admin') return true;
    if (!userPermissions) return false;
    return userPermissions[category] && userPermissions[category][permission];
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return path !== '/' && location.pathname.startsWith(path);
  };

  // Wenn noch lädt, zeige einfache Navbar
  if (isLoading) {
    return (
      <nav className="bg-blue-900 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔧</span>
              <Link to="/" className="text-white text-xl font-bold hover:text-blue-200 transition duration-200">
                Repairhub
              </Link>
            </div>
            <div className="text-white">Lädt...</div>
          </div>
        </div>
      </nav>
    );
  }

  // Tools Dropdown Items basierend auf Berechtigungen
  const toolsItems = [
    ...(hasPermission('tools', 'priceCalculator') ? [
      { path: '/calculator', label: 'Preisrechner', icon: '💰' }
    ] : []),
    ...(hasPermission('devices', 'create') ? [
      { path: '/purchase-guide', label: 'Ankaufleitfaden', icon: '🛒' }
    ] : []),
    ...(hasPermission('parts', 'view') ? [
      { path: '/foneday-search', label: 'Foneday Suche', icon: '🔍' }
    ] : []),
    ...(hasPermission('system', 'settings') ? [
      { path: '/sync-settings', label: 'Sync Einstellungen', icon: '⚙️' }
    ] : [])
  ];

  const hasToolsAccess = toolsItems.length > 0;
  const isToolsActive = isActive('/calculator') || isActive('/purchase-guide') || isActive('/foneday-search') || isActive('/sync-settings');

  return (
    <nav className="bg-blue-900 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🔧</span>
            <Link to="/" className="text-white text-xl font-bold hover:text-blue-200 transition duration-200">
              Repairhub
            </Link>
          </div>
          
          {/* Main Navigation */}
          <div className="hidden md:flex space-x-6">
            {/* Dashboard - nur wenn Statistiken-Berechtigung vorhanden */}
            {hasPermission('system', 'statistics') && (
              <Link 
                to="/" 
                className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
                }`}
              >
                📊 Dashboard
              </Link>
            )}
            {/* Analytics - nur wenn Statistiken-Berechtigung vorhanden */}
            {hasPermission('system', 'statistics') && (
              <Link 
                to="/analytics" 
                className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/analytics') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
                }`}
              >
                📈 Analytics
              </Link>
            )}
            {/* Geräte - nur wenn Berechtigung vorhanden */}
            {hasPermission('devices', 'view') && (
              <Link 
                to="/devices" 
                className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/devices') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
                }`}
              >
                📱 Geräte
              </Link>
            )}
            
            {/* Ersatzteile - nur wenn Berechtigung vorhanden */}
            {hasPermission('parts', 'view') && (
              <Link 
                to="/parts" 
                className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/parts') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
                }`}
              >
                🔧 Ersatzteile
              </Link>
            )}
            
            {/* Reseller - nur wenn Berechtigung vorhanden */}
            {hasPermission('resellers', 'view') && (
              <Link 
                to="/admin/resellers" 
                className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin/resellers') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
                }`}
              >
                👥 Reseller
              </Link>
            )}

            {/* Benutzerverwaltung - nur wenn Berechtigung vorhanden */}
            {hasPermission('system', 'userManagement') && (
              <Link 
                to="/admin/users" 
                className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin/users') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
                }`}
              >
                👤 Benutzer
              </Link>
            )}

            {/* Tools Dropdown/Direct Link */}
            {hasToolsAccess && (
              <>
                {toolsItems.length === 1 ? (
                  // Nur ein Tool - direkter Link ohne Dropdown
                  <Link 
                    to={toolsItems[0].path}
                    className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                      isActive(toolsItems[0].path) ? 'bg-blue-800 border-b-2 border-blue-300' : ''
                    }`}
                  >
                    {toolsItems[0].icon} {toolsItems[0].label}
                  </Link>
                ) : (
                  // Mehrere Tools - Dropdown
                  <div className="relative group">
                    <button className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                      isToolsActive ? 'bg-blue-800 border-b-2 border-blue-300' : ''
                    }`}>
                      🛠️ Tools
                      <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                    
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-1">
                        {toolsItems.map((item) => (
                          <Link 
                            key={item.path}
                            to={item.path} 
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center"
                          >
                            <span className="mr-2">{item.icon}</span>
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile Navigation Button */}
          <div className="md:hidden">
            <button 
              type="button" 
              className="text-white hover:text-blue-200 focus:outline-none focus:text-blue-200"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                mobileMenu.classList.toggle('hidden');
              }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Admin Info & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            {admin && (
              <div className="text-white text-sm">
                <span className="hidden lg:inline">Willkommen, </span>
                <span className="font-medium">{admin.name}</span>
                <span className="hidden lg:inline text-blue-300 ml-1">
                  ({userRole === 'super_admin' ? 'Super Admin' : 
                    userRole === 'admin' ? 'Administrator' :
                    userRole === 'manager' ? 'Manager' :
                    userRole || admin.role})
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>Abmelden</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div id="mobile-menu" className="md:hidden hidden pb-4">
          <div className="space-y-2">
            {/* Dashboard - Mobile */}
            {hasPermission('system', 'statistics') && (
              <Link 
                to="/" 
                onClick={closeMobileMenu}
                className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/') ? 'bg-blue-800' : ''
                }`}
              >
                📊 Dashboard
              </Link>
            )}
            {/* Analytics - Mobile */}
            {hasPermission('system', 'statistics') && (
              <Link 
                to="/analytics" 
                onClick={closeMobileMenu}
                className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/analytics') ? 'bg-blue-800' : ''
                }`}
              >
                📈 Analytics
              </Link>
            )}
            {/* Geräte - Mobile */}
            {hasPermission('devices', 'view') && (
              <Link 
                to="/devices" 
                onClick={closeMobileMenu}
                className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/devices') ? 'bg-blue-800' : ''
                }`}
              >
                📱 Geräte
              </Link>
            )}

            {/* Ersatzteile - Mobile */}
            {hasPermission('parts', 'view') && (
              <Link 
                to="/parts" 
                onClick={closeMobileMenu}
                className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/parts') ? 'bg-blue-800' : ''
                }`}
              >
                🔧 Ersatzteile
              </Link>
            )}

            {/* Reseller - Mobile */}
            {hasPermission('resellers', 'view') && (
              <Link 
                to="/admin/resellers" 
                onClick={closeMobileMenu}
                className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/admin/resellers') ? 'bg-blue-800' : ''
                }`}
              >
                👥 Reseller
              </Link>
            )}
            
            {/* Benutzerverwaltung - Mobile */}
            {hasPermission('system', 'userManagement') && (
              <Link 
                to="/admin/users" 
                onClick={closeMobileMenu}
                className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/admin/users') ? 'bg-blue-800' : ''
                }`}
              >
                👤 Benutzerverwaltung
              </Link>
            )}
            
            {/* Tools - Mobile (alle einzeln) */}
            {toolsItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path} 
                onClick={closeMobileMenu}
                className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                  isActive(item.path) ? 'bg-blue-800' : ''
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            
            {/* Mobile Admin Info & Logout */}
            <div className="border-t border-blue-700 pt-4 mt-4">
              {admin && (
                <div className="text-blue-200 text-sm px-3 py-2">
                  {admin.name} ({userRole === 'super_admin' ? 'Super Admin' : 
                               userRole === 'admin' ? 'Administrator' :
                               userRole === 'manager' ? 'Manager' :
                               userRole || admin.role})
                </div>
              )}
              <button
                onClick={() => {
                  closeMobileMenu();
                  handleLogout();
                }}
                className="w-full text-left bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-base font-medium transition duration-200"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Role Info Banner für Calculator-Only Users */}
      {userPermissions && 
       userPermissions.tools && 
       userPermissions.tools.priceCalculator &&
       !hasPermission('devices', 'view') &&
       !hasPermission('parts', 'create') &&
       !hasPermission('system', 'userManagement') && (
        <div className="bg-blue-800 px-4 py-2 text-center text-sm">
          🧮 Sie haben Zugriff auf den Preisrechner{hasPermission('parts', 'view') ? ' und Ersatzteile-Ansicht' : ''}
          {hasPermission('devices', 'create') ? ' und den Ankaufleitfaden' : ''}
        </div>
      )}
    </nav>
  );
};

export default Navbar;