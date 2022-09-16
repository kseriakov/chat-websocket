import { combineReducers } from "@reduxjs/toolkit";

import chatReducer from "./chat";
import authReducer from "./auth";
import logoReducer from "./logo";

const reducer = combineReducers({ chatReducer, authReducer, logoReducer });

export default reducer;
