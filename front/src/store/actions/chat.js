import * as actionTypes from "./actionTypes";

export const chatStart = () => {
    return {
        type: actionTypes.CHAT_LOADING
    }
}
export const chatLoadingEnd = () => {
    return {
        type: actionTypes.CHAT_SUCCESS
    }
}
export const chatError = (error) => {
    return {
        type: actionTypes.CHAT_ERROR,
        chtError: error,
    }
}
