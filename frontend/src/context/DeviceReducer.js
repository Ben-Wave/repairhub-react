// DeviceReducer.js
const deviceReducer = (state, action) => {
  switch (action.type) {
    case 'GET_DEVICES':
      return {
        ...state,
        devices: action.payload,
        loading: false,
        error: null
      };
    case 'GET_DEVICE':
      return {
        ...state,
        device: action.payload,
        loading: false,
        error: null
      };
    case 'ADD_DEVICE':
      return {
        ...state,
        devices: [action.payload, ...state.devices],
        loading: false,
        error: null
      };
    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map(device =>
          device._id === action.payload._id ? action.payload : device
        ),
        device: action.payload,
        loading: false,
        error: null
      };
    case 'DELETE_DEVICE':
      return {
        ...state,
        devices: state.devices.filter(device => device._id !== action.payload),
        loading: false,
        error: null
      };
    case 'GET_STATS':
      return {
        ...state,
        stats: action.payload,
        loading: false,
        error: null
      };
    case 'DEVICE_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export default deviceReducer;