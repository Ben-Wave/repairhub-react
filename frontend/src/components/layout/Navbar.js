// frontend/src/components/layout/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ admin, onLogout }) => {
  const location = useLocation();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return path !== '/' && location.pathname.startsWith(path);
  };

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
            <Link 
              to="/" 
              className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
              }`}
            >
              Dashboard
            </Link>
            
            <Link 
              to="/devices" 
              className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/devices') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
              }`}
            >
              Geräte
            </Link>
            
            <Link 
              to="/parts" 
              className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/parts') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
              }`}
            >
              Ersatzteile
            </Link>
            
            <Link 
              to="/admin/resellers" 
              className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/admin/resellers') ? 'bg-blue-800 border-b-2 border-blue-300' : ''
              }`}
            >
              Reseller
            </Link>

            {/* Dropdown für Tools */}
            <div className="relative group">
              <button className={`text-white hover:text-blue-200 transition duration-200 px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/calculator') || isActive('/foneday-search') || isActive('/sync-settings') 
                  ? 'bg-blue-800 border-b-2 border-blue-300' : ''
              }`}>
                Tools
                <svg className="w-4 h-4 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link 
                    to="/calculator" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Preisrechner
                  </Link>
                  <Link 
                    to="/foneday-search" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Foneday Suche
                  </Link>
                  <Link 
                    to="/sync-settings" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  >
                    Sync Einstellungen
                  </Link>
                </div>
              </div>
            </div>
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
                <span className="hidden lg:inline text-blue-300 ml-1">({admin.role})</span>
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
            <Link 
              to="/" 
              className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') ? 'bg-blue-800' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link 
              to="/devices" 
              className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                isActive('/devices') ? 'bg-blue-800' : ''
              }`}
            >
              Geräte
            </Link>
            <Link 
              to="/parts" 
              className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                isActive('/parts') ? 'bg-blue-800' : ''
              }`}
            >
              Ersatzteile
            </Link>
            <Link 
              to="/admin/resellers" 
              className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                isActive('/admin/resellers') ? 'bg-blue-800' : ''
              }`}
            >
              Reseller
            </Link>
            <Link 
              to="/calculator" 
              className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                isActive('/calculator') ? 'bg-blue-800' : ''
              }`}
            >
              Preisrechner
            </Link>
            <Link 
              to="/foneday-search" 
              className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                isActive('/foneday-search') ? 'bg-blue-800' : ''
              }`}
            >
              Foneday Suche
            </Link>
            <Link 
              to="/sync-settings" 
              className={`block text-white hover:text-blue-200 px-3 py-2 rounded-md text-base font-medium ${
                isActive('/sync-settings') ? 'bg-blue-800' : ''
              }`}
            >
              Sync Einstellungen
            </Link>
            
            {/* Mobile Admin Info & Logout */}
            <div className="border-t border-blue-700 pt-4 mt-4">
              {admin && (
                <div className="text-blue-200 text-sm px-3 py-2">
                  {admin.name} ({admin.role})
                </div>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-base font-medium transition duration-200"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;