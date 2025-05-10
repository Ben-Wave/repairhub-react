const deviceReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    
    case 'GET_DEVICES':
      return {
        ...state,
        devices: action.payload,
        loading: false
      };
    
    case 'GET_DEVICE':
      return {
        ...state,
        device: action.payload,
        loading: false
      };
    
    case 'GET_STATS':
      return {
        ...state,
        stats: action.payload
      };
    
    case 'ADD_DEVICE':
      return {
        ...state,
        devices: [...state.devices, action.payload],
        loading: false
      };
    
    case 'UPDATE_DEVICE':
      return {
        ...state,
        devices: state.devices.map(device => 
          device._id === action.payload._id ? action.payload : device
        ),
        device: action.payload,
        loading: false
      };
    
    case 'DELETE_DEVICE':
      return {
        ...state,
        devices: state.devices.filter(device => device._id !== action.payload),
        loading: false
      };
    
    case 'DEVICE_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    default:
      return state;
  }
};

export default deviceReducer;