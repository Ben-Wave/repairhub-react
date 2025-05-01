import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Navbar = () => {
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
          </div>
          
          <div className="md:hidden">
            <button className="text-white focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menü */}
      <div className="hidden md:hidden px-4 py-2 bg-blue-800">
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
      </div>
    </nav>
  );
};

export default Navbar;