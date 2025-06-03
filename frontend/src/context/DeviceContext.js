// frontend/src/context/DeviceContext.js - KORRIGIERT für Admin-Token + getStats
import React, { createContext, useReducer } from 'react';
import axios from 'axios';
import DeviceReducer from './DeviceReducer';

const initialState = {
  devices: [],
  currentDevice: null,
  loading: false,
  error: null,
  stats: null
};

export const DeviceContext = createContext(initialState);

export const DeviceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(DeviceReducer, initialState);

  // Helper function to get the correct token
  const getAuthToken = () => {
    // Prüfe zuerst adminToken, dann resellerToken
    const adminToken = localStorage.getItem('adminToken');
    const resellerToken = localStorage.getItem('resellerToken');
    
    if (adminToken) {
      return adminToken;
    } else if (resellerToken) {
      return resellerToken;
    }
    return null;
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Get all devices
  const getDevices = async () => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const res = await axios.get('/api/devices', {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'GET_DEVICES',
        payload: res.data
      });
    } catch (error) {
      console.error('Error fetching devices:', error);
      
      // Detaillierte Fehlerbehandlung
      if (error.response?.status === 401) {
        dispatch({
          type: 'DEVICE_ERROR',
          payload: 'Nicht autorisiert. Bitte loggen Sie sich erneut ein.'
        });
        
        // Token ungültig - weiterleiten zum Login
        const adminToken = localStorage.getItem('adminToken');
        const resellerToken = localStorage.getItem('resellerToken');
        
        if (adminToken) {
          localStorage.removeItem('adminToken');
          window.location.href = '/';
        } else if (resellerToken) {
          localStorage.removeItem('resellerToken');
          window.location.href = '/reseller';
        }
      } else if (error.response?.status === 403) {
        dispatch({
          type: 'DEVICE_ERROR',
          payload: 'Keine Berechtigung zum Anzeigen von Geräten.'
        });
      } else {
        dispatch({
          type: 'DEVICE_ERROR',
          payload: error.response?.data?.error || 'Fehler beim Laden der Geräte'
        });
      }
    }
  };

  // Get single device
  const getDevice = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const res = await axios.get(`/api/devices/${id}`, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'GET_DEVICE',
        payload: res.data
      });
    } catch (error) {
      console.error('Error fetching device:', error);
      dispatch({
        type: 'DEVICE_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Laden des Geräts'
      });
    }
  };

  // Get stats - HINZUGEFÜGT für Dashboard
  const getStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const res = await axios.get('/api/stats', {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'GET_STATS',
        payload: res.data
      });
      
      return res.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      dispatch({
        type: 'DEVICE_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Laden der Statistiken'
      });
      throw error;
    }
  };

  // Add device
  const addDevice = async (deviceData) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const res = await axios.post('/api/devices/check-imei', deviceData, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'ADD_DEVICE',
        payload: res.data
      });
      
      return res.data;
    } catch (error) {
      console.error('Error adding device:', error);
      dispatch({
        type: 'DEVICE_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Hinzufügen des Geräts'
      });
      throw error;
    }
  };

  // Update device
  const updateDevice = async (id, deviceData) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const res = await axios.put(`/api/devices/${id}`, deviceData, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'UPDATE_DEVICE',
        payload: res.data
      });
      
      return res.data;
    } catch (error) {
      console.error('Error updating device:', error);
      dispatch({
        type: 'DEVICE_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Aktualisieren des Geräts'
      });
      throw error;
    }
  };

  // Delete device
  const deleteDevice = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      await axios.delete(`/api/devices/${id}`, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'DELETE_DEVICE',
        payload: id
      });
    } catch (error) {
      console.error('Error deleting device:', error);
      dispatch({
        type: 'DEVICE_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Löschen des Geräts'
      });
      throw error;
    }
  };

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  return (
    <DeviceContext.Provider
      value={{
        devices: state.devices,
        currentDevice: state.currentDevice,
        loading: state.loading,
        error: state.error,
        stats: state.stats,
        getDevices,
        getDevice,
        getStats, // HINZUGEFÜGT
        addDevice,
        updateDevice,
        deleteDevice,
        clearErrors
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};