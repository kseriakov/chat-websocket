import * as actionTypes from "../actions/actionTypes";
import updateStore from "../utils/utils";

const initialState = {
    logoLoading: false,
    logoLoaded: false,
    logoError: null,
    logoStartLoad: false,
    isLogo: false,
};

const logoStart = (state, action) => {
    const newData = {
        logoLoading: true,
        logoError: null,
        logoLoaded: false,
    };
    return updateStore(state, newData);
};

const logoLoaded = (state, action) => {
    const newData = {
        logoLoading: false,
        logoLoaded: true,
    };
    return updateStore(state, newData);
};

const logoError = (state, action) => {
    const newData = {
        logoLoading: false,
        logoLoaded: false,
        logoError: action.lgError,
    };
    return updateStore(state, newData);
};

const logoServerStartLoad = (state, action) => {
    const newData = {
        logoStartLoad: true,
        isLogo: false,
    };
    return updateStore(state, newData);
};

const logoServerLoaded = (state, action) => {
    const newData = {
        logoStartLoad: false,
        isLogo: true,
    };
    return updateStore(state, newData);
};

const logoReducer = (state = initialState, action) => {
    switch (action.type) {
        case actionTypes.LOGO_LOADING: {
            return logoStart(state, action);
        }
        case actionTypes.LOGO_SUCCESS: {
            return logoLoaded(state, action);
        }
        case actionTypes.LOGO_ERROR: {
            return logoError(state, action);
        }
        case actionTypes.LOGO_START_GET: {
            return logoServerStartLoad(state, action);
        }
        case actionTypes.LOGO_END_GET: {
            return logoServerLoaded(state, action);
        }
        default: {
            return state;
        }
    }
};

export default logoReducer;
