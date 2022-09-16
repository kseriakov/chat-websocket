import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import App from "./App";

import reducer from "./store/reducers/reducers";
import "./styles/scss/App.scss";

// redux toolkit сам добавляет thunk и настройку для redux-devtools (Chrome)
const store = configureStore({ reducer });

createRoot(document.getElementById("root")).render(
    <Provider store={store}>
        <App />
    </Provider>
);
