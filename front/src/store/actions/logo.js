import axios from "axios";

import * as actionTypes from "./actionTypes";
import { setTokenInHeaders, urlServer } from "./auth";

export const logoUploadStart = () => {
    return {
        type: actionTypes.LOGO_LOADING,
    };
};

export const logoUploadEnd = () => {
    return {
        type: actionTypes.LOGO_SUCCESS,
    };
};

export const logoUploadError = (error) => {
    return {
        type: actionTypes.LOGO_ERROR,
        lgError: error,
    };
};

export const logoServerStartLoad = () => {
    return {
        type: actionTypes.LOGO_START_GET,
    };
};

export const logoServerGet = () => {
    return {
        type: actionTypes.LOGO_END_GET,
    };
};

export const loadServerLogo = (token) => {
    return (dispatch) => {
        dispatch(logoServerStartLoad());

        const config = setTokenInHeaders(token);
        axios
            .get(`http://${urlServer}/api/logo/`, config)
            .then((res) => {
                const logo = res.data.logo;
                localStorage.setItem("logo", logo);
                dispatch(logoServerGet());
            })
            .catch((err) => dispatch(logoUploadError(err.message)));
    };
};
