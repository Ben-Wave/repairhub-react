// frontend/src/context/PartsContext.js - KORRIGIERT für Admin-Token
import React, { createContext, useReducer } from 'react';
import axios from 'axios';
import PartsReducer from './PartsReducer';

const initialState = {
  parts: [],
  currentPart: null,
  loading: false,
  error: null
};

export const PartsContext = createContext(initialState);

export const PartsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(PartsReducer, initialState);

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

  // Helper function to determine which API endpoint to use
  const getPartsEndpoint = (forModel = null) => {
    const adminToken = localStorage.getItem('adminToken');
    
    // Wenn Admin-Token vorhanden, verwende normale API
    // Wenn nur Reseller-Token oder Calculator-Only, verwende Calculator-API
    if (adminToken) {
      return forModel ? `/api/parts?forModel=${encodeURIComponent(forModel)}` : '/api/parts';
    } else {
      return forModel ? `/api/calculator/parts?forModel=${encodeURIComponent(forModel)}` : '/api/calculator/parts';
    }
  };

  // Get all parts
  const getParts = async (forModel = null) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const endpoint = getPartsEndpoint(forModel);
      const res = await axios.get(endpoint, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'GET_PARTS',
        payload: res.data
      });
    } catch (error) {
      console.error('Error fetching parts:', error);
      
      // Detaillierte Fehlerbehandlung
      if (error.response?.status === 401) {
        dispatch({
          type: 'PARTS_ERROR',
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
          type: 'PARTS_ERROR',
          payload: 'Keine Berechtigung zum Anzeigen von Ersatzteilen.'
        });
      } else {
        dispatch({
          type: 'PARTS_ERROR',
          payload: error.response?.data?.error || 'Fehler beim Laden der Ersatzteile'
        });
      }
    }
  };

  // Get single part
  const getPart = async (id) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const res = await axios.get(`/api/parts/${id}`, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'GET_PART',
        payload: res.data
      });
    } catch (error) {
      console.error('Error fetching part:', error);
      dispatch({
        type: 'PARTS_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Laden des Ersatzteils'
      });
    }
  };

  // Add part
  const addPart = async (partData) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const res = await axios.post('/api/parts', partData, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'ADD_PART',
        payload: res.data
      });
      
      return res.data;
    } catch (error) {
      console.error('Error adding part:', error);
      dispatch({
        type: 'PARTS_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Hinzufügen des Ersatzteils'
      });
      throw error;
    }
  };

  // Update part
  const updatePart = async (id, partData) => {
    try {
      dispatch({ type: 'SET_LOADING' });
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      const res = await axios.put(`/api/parts/${id}`, partData, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'UPDATE_PART',
        payload: res.data
      });
      
      return res.data;
    } catch (error) {
      console.error('Error updating part:', error);
      dispatch({
        type: 'PARTS_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Aktualisieren des Ersatzteils'
      });
      throw error;
    }
  };

  // Delete part
  const deletePart = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token gefunden');
      }

      await axios.delete(`/api/parts/${id}`, {
        headers: getAuthHeaders()
      });
      
      dispatch({
        type: 'DELETE_PART',
        payload: id
      });
    } catch (error) {
      console.error('Error deleting part:', error);
      dispatch({
        type: 'PARTS_ERROR',
        payload: error.response?.data?.error || 'Fehler beim Löschen des Ersatzteils'
      });
      throw error;
    }
  };

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  return (
    <PartsContext.Provider
      value={{
        parts: state.parts,
        currentPart: state.currentPart,
        loading: state.loading,
        error: state.error,
        getParts,
        getPart,
        addPart,
        updatePart,
        deletePart,
        clearErrors
      }}
    >
      {children}
    </PartsContext.Provider>
  );
};