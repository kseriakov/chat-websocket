import { useSelector, useDispatch } from "react-redux";
import React, { useEffect, useState } from "react";

import { ContextUsers } from "../utils/Context";
import * as actionsAuth from "../store/actions/auth";
import Login from "./Login";
import Sidebar from "./Sidebar";
import Chat from "./Chat";

const Content = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        if (localStorage.getItem("token")) {
            dispatch(actionsAuth.authStart());
        }

        dispatch(actionsAuth.checkAuth());
    }, []);

    const { token } = useSelector(({ authReducer }) => authReducer);
    const content = token ? <ChatContent /> : <Login />;

    return <>{content}</>;
};

const ChatContent = () => {
    const [availableUsers, setAvailableUsers] = useState([]);
    const [userTo, setUserTo] = useState(null);
    const [usernameTo, setUsernameTo] = useState(null);
    const [lastChats, setLastChats] = useState([]);
    const [webSocket, setWebSocket] = useState(null);
    const [webSocketUser, setWebSocketUser] = useState(null);

    // Получили доступных пользователей и передали их в SideBar
    const getUsersFromChat = (users) => {
        setAvailableUsers(users);
    };

    // Последние чаты
    const getLastChats = (lastChats) => {
        setLastChats(lastChats);
    };

    // Получаем из Chat сокеты, чтобы закрывать их при logout
    const setWebSockets = (args) => {
        if (args.webSocket) {
            setWebSocket(args.webSocket);
        }
        if (args.webSocketUser) {
            setWebSocketUser(args.webSocketUser);
        }
    };

    const getWebSockets = () => {
        return [webSocket, webSocketUser];
    };

    return (
        <>
            <ContextUsers.Provider
                value={{
                    lastChats,
                    availableUsers,
                    userTo,
                    setUserTo,
                    usernameTo,
                    setUsernameTo,
                    getWebSockets,
                }}
            >
                <Sidebar />
                <Chat
                    getUsers={getUsersFromChat}
                    getLastChats={getLastChats}
                    setWebSockets={setWebSockets}
                />
            </ContextUsers.Provider>
        </>
    );
};

export default Content;
