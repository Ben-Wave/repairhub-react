import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">Repairhub</Link>
          
          <div className="hidden md:flex space-x-6">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                isActive ? "font-medium border-b-2 border-white" : "hover:text-blue-200"
              }
              end
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/devices" 
              className={({ isActive }) => 
                isActive ? "font-medium border-b-2 border-white" : "hover:text-blue-200"
              }
            >
              Geräte
            </NavLink>
            <NavLink 
              to="/parts" 
              className={({ isActive }) => 
                isActive ? "font-medium border-b-2 border-white" : "hover:text-blue-200"
              }
            >
              Ersatzteile
            </NavLink>
            <NavLink 
              to="/foneday-search" 
              className={({ isActive }) => 
                isActive ? "font-medium border-b-2 border-white" : "hover:text-blue-200"
              }
            >
              Foneday Katalog
            </NavLink>
            <NavLink 
              to="/sync-settings" 
              className={({ isActive }) => 
                isActive ? "font-medium border-b-2 border-white" : "hover:text-blue-200"
              }
            >
              Katalog-Sync
            </NavLink>
            <NavLink 
              to="/calculator" 
              className={({ isActive }) => 
                isActive ? "font-medium border-b-2 border-white" : "hover:text-blue-200"
              }
            >
              Kalkulator
            </NavLink>
          </div>
          
          <div className="md:hidden">
            <button 
              className="text-white focus:outline-none" 
              onClick={toggleMobileMenu}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menü */}
      <div className={`md:hidden px-4 py-2 bg-blue-800 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            isActive ? "block py-2 font-medium" : "block py-2 hover:text-blue-200"
          }
          end
        >
          Dashboard
        </NavLink>
        <NavLink 
          to="/devices" 
          className={({ isActive }) => 
            isActive ? "block py-2 font-medium" : "block py-2 hover:text-blue-200"
          }
        >
          Geräte
        </NavLink>
        <NavLink 
          to="/parts" 
          className={({ isActive }) => 
            isActive ? "block py-2 font-medium" : "block py-2 hover:text-blue-200"
          }
        >
          Ersatzteile
        </NavLink>
        <NavLink 
          to="/foneday-search" 
          className={({ isActive }) => 
            isActive ? "block py-2 font-medium" : "block py-2 hover:text-blue-200"
          }
        >
          Foneday Katalog
        </NavLink>
        <NavLink 
          to="/sync-settings" 
          className={({ isActive }) => 
            isActive ? "block py-2 font-medium" : "block py-2 hover:text-blue-200"
          }
        >
          Katalog-Sync
        </NavLink>
        <NavLink 
          to="/calculator" 
          className={({ isActive }) => 
            isActive ? "block py-2 font-medium" : "block py-2 hover:text-blue-200"
          }
        >
          Kalkulator
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;