import * as actionTypes from "../actions/actionTypes";
import updateStore from "../utils/utils";

const initialState = {
    chatLoading: false,
    chatLoaded: false,
    chatError: null,
};

const chatStart = (state, action) => {
    const newData = {
        chatLoading: true,
        chatError: null,
        chatLoaded: false,
    };
    return updateStore(state, newData);
};

const chatLoaded = (state, action) => {
    const newData = {
        chatLoading: false,
        chatLoaded: true,
    };
    return updateStore(state, newData);
};

const chatError = (state, action) => {
    const newData = {
        chatLoading: false,
        chatLoaded: false,
        chatError: action.chtError,
    };
    return updateStore(state, newData);
};

const chatReducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.CHAT_LOADING: {
            return chatStart(state, action);
        }
        case actionTypes.CHAT_SUCCESS: {
            return chatLoaded(state, action);
        }
        case actionTypes.CHAT_ERROR: {
            return chatError(state, action);
        }
        default: {
            return state;
        }
    }
};

export default chatReducer;
