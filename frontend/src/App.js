import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DeviceProvider } from './context/DeviceContext';
import { PartsProvider } from './context/PartsContext';
import Navbar from './components/layout/Navbar';
import Dashboard from './components/pages/Dashboard';
import DeviceList from './components/devices/DeviceList';
import DeviceDetails from './components/devices/DeviceDetails';
import AddDevice from './components/devices/AddDevice';
import EditDevice from './components/devices/EditDevice';
import PartsList from './components/parts/PartsList';
import AddPart from './components/parts/AddPart';
import NotFound from './components/pages/NotFound';
import './App.css';

function App() {
  return (
    <DeviceProvider>
      <PartsProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gray-100">
            <Navbar />
            <main className="container mx-auto px-4 py-8 flex-grow">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/devices" element={<DeviceList />} />
                <Route path="/devices/add" element={<AddDevice />} />
                <Route path="/devices/:id" element={<DeviceDetails />} />
                <Route path="/devices/edit/:id" element={<EditDevice />} />
                <Route path="/parts" element={<PartsList />} />
                <Route path="/parts/add" element={<AddPart />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <footer className="bg-blue-900 text-white p-4 text-center">
              <p>&copy; {new Date().getFullYear()} Repairhub</p>
            </footer>
          </div>
        </Router>
      </PartsProvider>
    </DeviceProvider>
  );
}

export default App;