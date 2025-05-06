import React, { createContext, useReducer } from 'react';
import deviceReducer from './DeviceReducer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.178.102:5000/api';
console.log('API_URL from env:', process.env.REACT_APP_API_URL);
console.log('Final API_URL:', API_URL);

const initialState = {
  devices: [],
  device: null,
  loading: false,
  error: null,
  stats: {
    totalDevices: 0,
    availableDevices: 0,
    soldDevices: 0,
    totalProfit: 0
  }
};

export const DeviceContext = createContext(initialState);

export const DeviceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(deviceReducer, initialState);

  // Aktionen
  const getDevices = async () => {
    setLoading();
    try {
      const res = await axios.get(`${API_URL}/devices`);
      dispatch({
        type: 'GET_DEVICES',
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Abrufen der Geräte'
      });
    }
  };

  const getDevice = async (id) => {
    setLoading();
    try {
      const res = await axios.get(`${API_URL}/devices/${id}`);
      dispatch({
        type: 'GET_DEVICE',
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Abrufen des Geräts'
      });
    }
  };

  const checkImei = async (imei) => {
    setLoading();
    try {
      const res = await axios.post(`${API_URL}/devices/check-imei`, { imei });
      dispatch({
        type: 'CHECK_IMEI_SUCCESS',
        payload: res.data
      });
      return res.data;
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.error || 'Fehler bei der IMEI-Überprüfung'
      });
      throw err;
    }
  };

  const updateDevice = async (id, deviceData) => {
    try {
      const res = await axios.put(`${API_URL}/devices/${id}`, deviceData);
      dispatch({
        type: 'UPDATE_DEVICE',
        payload: res.data
      });
      return res.data;
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Aktualisieren des Geräts'
      });
      throw err;
    }
  };

  const deleteDevice = async (id) => {
    try {
      await axios.delete(`${API_URL}/devices/${id}`);
      dispatch({
        type: 'DELETE_DEVICE',
        payload: id
      });
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Löschen des Geräts'
      });
    }
  };

  const getStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      dispatch({
        type: 'GET_STATS',
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: 'DEVICE_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Abrufen der Statistiken'
      });
    }
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const setLoading = () => {
    dispatch({ type: 'SET_LOADING' });
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
        checkImei,
        updateDevice,
        deleteDevice,
        getStats,
        clearErrors
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};