import React, { createContext, useReducer } from 'react';
import partsReducer from './PartsReducer';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://192.168.178.102:5000/api';
console.log('API_URL from env:', process.env.REACT_APP_API_URL);
console.log('Final API_URL for parts:', API_URL);

const initialState = {
  parts: [],
  part: null,
  loading: false,
  error: null
};

export const PartsContext = createContext(initialState);

export const PartsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(partsReducer, initialState);

  // Aktionen
  const getParts = async (forModel = '') => {
    setLoading();
    try {
      const res = await axios.get(`${API_URL}/parts${forModel ? `?forModel=${forModel}` : ''}`);
      dispatch({
        type: 'GET_PARTS',
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: 'PARTS_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Abrufen der Ersatzteile'
      });
    }
  };

  const getPart = async (id) => {
    setLoading();
    try {
      const res = await axios.get(`${API_URL}/parts/${id}`);
      dispatch({
        type: 'GET_PART',
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: 'PARTS_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Abrufen des Ersatzteils'
      });
    }
  };

  const addPart = async (partData) => {
    try {
      const res = await axios.post(`${API_URL}/parts`, partData);
      dispatch({
        type: 'ADD_PART',
        payload: res.data
      });
      return res.data;
    } catch (err) {
      dispatch({
        type: 'PARTS_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Hinzufügen des Ersatzteils'
      });
      throw err;
    }
  };

  const updatePart = async (id, partData) => {
    try {
      const res = await axios.put(`${API_URL}/parts/${id}`, partData);
      dispatch({
        type: 'UPDATE_PART',
        payload: res.data
      });
      return res.data;
    } catch (err) {
      dispatch({
        type: 'PARTS_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Aktualisieren des Ersatzteils'
      });
      throw err;
    }
  };

  const deletePart = async (id) => {
    try {
      await axios.delete(`${API_URL}/parts/${id}`);
      dispatch({
        type: 'DELETE_PART',
        payload: id
      });
    } catch (err) {
      dispatch({
        type: 'PARTS_ERROR',
        payload: err.response?.data?.error || 'Fehler beim Löschen des Ersatzteils'
      });
      throw err;
    }
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const setLoading = () => {
    dispatch({ type: 'SET_LOADING' });
  };

  return (
    <PartsContext.Provider
      value={{
        parts: state.parts,
        part: state.part,
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