// frontend/src/components/devices/EditDevice.js - Mobile-optimiert
import React from 'react';
import DeviceDetails from './DeviceDetails';

const EditDevice = () => {
  // EditDevice is just an alias for DeviceDetails since editing is handled in the details view
  // But we add a specific mobile-optimized wrapper for editing context
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Edit Context Header */}
      <div className="block sm:hidden bg-blue-600 text-white p-3">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          <span className="font-medium">Bearbeitungsmodus</span>
        </div>
      </div>
      
      {/* Main Device Details Component */}
      <DeviceDetails />
    </div>
  );
};

export default EditDevice;