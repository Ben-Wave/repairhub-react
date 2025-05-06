const partsReducer = (state, action) => {
  switch (action.type) {
    case 'GET_PARTS':
      return {
        ...state,
        parts: action.payload,
        loading: false
      };
    case 'GET_PART':
      return {
        ...state,
        part: action.payload,
        loading: false
      };
    case 'ADD_PART':
      return {
        ...state,
        parts: [action.payload, ...state.parts],
        loading: false
      };
    case 'UPDATE_PART':
      return {
        ...state,
        parts: state.parts.map(part => 
          part._id === action.payload._id ? action.payload : part
        ),
        loading: false
      };
    case 'DELETE_PART':
      return {
        ...state,
        parts: state.parts.filter(part => part._id !== action.payload),
        loading: false
      };
    case 'PARTS_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: true
      };
    default:
      return state;
  }
};

export default partsReducer;