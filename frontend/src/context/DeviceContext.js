import React, { createContext, useReducer } from 'react';
import axios from 'axios';
import deviceReducer from './DeviceReducer';

const initialState = {
  devices: [],
  device: null,
  stats: {
    totalDevices: 0,
    availableDevices: 0,
    soldDevices: 0,
    totalProfit: 0,
    actualProfit: 0,
    plannedProfit: 0
  },
  loading: true,
  error: null
};

export const DeviceContext = createContext(initialState);

export const DeviceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(deviceReducer, initialState);

  // Alle Geräte abrufen
  const getDevices = async () => {
    try {
      dispatch({ type: 'SET_LOADING' });

      const res = await axios.get('/api/devices');

      dispatch({
        type: 'GET_DEVICES',
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.msg || 'Fehler beim Abrufen der Geräte'
      });
    }
  };

  // Statistiken abrufen
  const getStats = async () => {
    try {
      const res = await axios.get('/api/stats');
      
      dispatch({
        type: 'GET_STATS',
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.msg || 'Fehler beim Abrufen der Statistiken'
      });
    }
  };

  // Einzelnes Gerät abrufen
  const getDevice = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING' });

      const res = await axios.get(`/api/devices/${id}`);

      dispatch({
        type: 'GET_DEVICE',
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.msg || 'Fehler beim Abrufen des Geräts'
      });
    }
  };

  // Neues Gerät hinzufügen
  const addDevice = async (device) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.post('/api/devices', device, config);

      dispatch({
        type: 'ADD_DEVICE',
        payload: res.data
      });

      return res.data;
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.msg || 'Fehler beim Hinzufügen des Geräts'
      });
      throw err;
    }
  };

  // Gerät aktualisieren
  const updateDevice = async (id, deviceData) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };

    try {
      const res = await axios.put(`/api/devices/${id}`, deviceData, config);

      dispatch({
        type: 'UPDATE_DEVICE',
        payload: res.data
      });

      return res.data;
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.msg || 'Fehler beim Aktualisieren des Geräts'
      });
      throw err;
    }
  };

  // Gerät löschen
  const deleteDevice = async (id) => {
    try {
      await axios.delete(`/api/devices/${id}`);

      dispatch({
        type: 'DELETE_DEVICE',
        payload: id
      });
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.msg || 'Fehler beim Löschen des Geräts'
      });
      throw err;
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        devices: state.devices,
        device: state.device,
        loading: state.loading,
        error: state.error,
        stats: state.stats,
        getDevices,
        getDevice,
        addDevice,
        updateDevice,
        deleteDevice,
        getStats
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};