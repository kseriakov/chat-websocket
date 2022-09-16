import * as actionTypes from "../actions/actionTypes";
import updateStore from "../utils/utils";

const initialState = {
    loading: false,
    error: null,
    token: null,
    username: null,
    user_id: null,
};

const authStart = (state, action) => {
    const newData = {
        loading: true,
        error: null,
    };
    return updateStore(state, newData);
};

const authSuccess = (state, action) => {
    const newData = {
        loading: false,
        token: action.token,
        username: action.username,
        user_id: action.user_id,
    };
    return updateStore(state, newData);
};

const authLogout = (state, action) => {
    const newData = {
        loading: false,
        token: null,
        username: null,
        user_id: null,
    };
    return updateStore(state, newData);
};

const authFail = (state, action) => {
    const newData = {
        error: action.error,
        loading: false,
    };
    return updateStore(state, newData);
};

const authReducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.AUTH_START: {
            return authStart(state, action);
        }
        case actionTypes.AUTH_SUCCESS: {
            return authSuccess(state, action);
        }
        case actionTypes.AUTH_LOGOUT: {
            return authLogout(state, action);
        }
        case actionTypes.AUTH_FAIL: {
            return authFail(state, action);
        }
        default:
            return state;
    }
};

export default authReducer;
