import axios from "axios";

import * as actionTypes from "./actionTypes";

const tokenLiveTime = 86400; // в секундах - один день

// Адрес используется далее во всем приложении
export const urlServer = "w-chat.space";

export const api = `http://${urlServer}/api/dj-rest-auth`;

export const authStart = () => {
    return {
        type: actionTypes.AUTH_START,
    };
};

export const authSuccess = (token, username, user_id) => {
    return {
        type: actionTypes.AUTH_SUCCESS,
        token: token,
        username: username,
        user_id: user_id,
    };
};

export const authFail = (error) => {
    return {
        type: actionTypes.AUTH_FAIL,
        error: error,
    };
};

export const authLogout = () => {
    return {
        type: actionTypes.AUTH_LOGOUT,
    };
};

export const logout = (token) => {
    return (dispatch) => {
        dispatch(authStart());

        localStorage.removeItem("token");
        localStorage.removeItem("tokenEndTime");
        localStorage.removeItem("username");
        localStorage.removeItem("user_id");

        if (token) {
            const config = setTokenInHeaders(token);
            // Выходим и удаляем токен из БД
            axios
                .post(`${api}/logout/`, {}, config)
                .then(() => {})
                .catch((error) => {
                    console.error("Logout failed! Error:", error);
                });
        }
        localStorage.removeItem("logo");
        dispatch(authLogout());
    };
};

// Таймер жизни токена
export const setAuthTime = (tokenEndTime) => {
    return (dispatch, getState) => {
        setTimeout(() => {
            dispatch(logout(getState().authReducer.token));
        }, tokenEndTime * 1000);
    };
};

export const authLogin = (username, password) => {
    return (dispatch) => {
        const data = {
            username: username,
            password: password,
        };
        loginOrRegister(dispatch, data, "login");
    };
};

export const authRegister = (username, password, confirm) => {
    return (dispatch) => {
        const data = {
            username: username,
            password1: password,
            password2: confirm,
        };
        loginOrRegister(dispatch, data, "registration");
    };
};

const getUserData = (token, dispatch) => {
    const config = setTokenInHeaders(token);
    axios.get(`${api}/user/`, config).then(({ data }) => {
        const user_id = data.pk;
        const username = data.username;

        localStorage.setItem("token", token);
        localStorage.setItem("user_id", user_id);
        localStorage.setItem("username", username);

        dispatch(authSuccess(token, username, user_id));
    });
};

// проверка на аутентификацию после перезагрузки страницы
export const checkAuth = () => {
    return (dispatch, getState) => {
        const tokenEndTime = localStorage.getItem("tokenEndTime");
        const token = localStorage.getItem("token");
        // Если локальное хранилище пусто, проверка не нужна
        if (!tokenEndTime) {
            return;
        }
        if (tokenEndTime <= new Date().getTime()) {
            dispatch(logout(token));
        } else {
            const username = localStorage.getItem("username");
            const user_id = localStorage.getItem("user_id");
            dispatch(authSuccess(token, username, user_id));
            updateTokenTime();
            dispatch(setAuthTime(tokenLiveTime));
        }
    };
};

const loginOrRegister = (dispatch, data, path) => {
    dispatch(authStart());
    axios
        .post(`${api}/${path}/`, data)
        .then((response) => {
            const token = response.data.key;
            getUserData(token, dispatch);
            updateTokenTime();
            dispatch(setAuthTime(tokenLiveTime));
        })
        .catch((error) => {
            dispatch(authFail(error.message));
        });
};

// При перезагрузке страницы будем обновлять время жизни токена
const updateTokenTime = () => {
    const tokenEndTime = new Date(
        new Date().getTime() + tokenLiveTime * 1000
    ).getTime();
    localStorage.setItem("tokenEndTime", tokenEndTime);
};

export const setTokenInHeaders = (token) => {
    const config = {
        headers: {
            Authorization: `Token ${token}`,
        },
    };
    return config;
};
