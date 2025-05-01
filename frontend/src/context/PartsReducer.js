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