const webSocketInstance = (
    setMessages,
    setLastChats,
    setAvailableUsers,
    setAvailableMessages,
    setReadingMessages,
    from_id,
    to_id
) => {
    let wbsSidebar;
    let pathItem;

    if (to_id === null) {
        pathItem = `${from_id}/${from_id}`; // для стартовой страницы, пока не зашли в чат
    } else {
        const id1 = Math.min(from_id, to_id);
        const id2 = Math.max(from_id, to_id);
        pathItem = `${id1}/${id2}`;
    }

    const path = `ws://127.0.0.1:8000/ws/chat/${pathItem}/`;

    // Закрытие действующего соединения перед новым подключением
    if (webSocketInstance._instance) {
        webSocketInstance._instance.close();
    }
    let instance = new WebSocket(path);

    webSocketInstance._instance = instance;

    instance.onopen = () => {
        console.log("Websocket connection is open!");
    };

    instance.onerror = (err) => {
        console.error("Websocket connetion failed, tried reconnecting.", err);
        const reconnect = setInterval(() => {
            if (instance.readyState !== 1) {
                instance = new WebSocket(path);
            }
            if (instance.readyState === 1) {
                console.log("Websocket connection is open!");
                clearInterval(reconnect);
            }
        }, 500);
    };

    instance.onmessage = (event) => {
        const obj = JSON.parse(event.data);
        const key = Object.keys(obj)[0];
        const data = obj[key];
        const data_res = data[key];
        const messageFor = data["from_id"];
        const availableMessages = data["available_messages"];
        const readingMessages = data["reading"];

        switch (key) {
            case "message": {
                readMessage(data_res);
                setOneMessageInState(data_res);
                break;
            }
            case "messages": {
                if (messageFor == from_id) {
                    console.log('fffff');
                    setFetchMessagesInState(data_res, availableMessages);
                } else {
                    setReaidingMessagesInState(readingMessages);
                }
                break;
            }
            case "last_chats": {
                if (messageFor == from_id) {
                    // получаем для того, кому отправлено сообщение
                    setLastChatsInState(data_res);
                }
                break;
            }
            case "all_users": {
                // При перезагрузке страницы получили всех пользователей
                if (messageFor == from_id) {
                    setAvailableUsersInState(data_res);
                }
                // Установили с ними подключения, для мониторинга новых сообщений
                // if (messageFor == from_id) {
                //     setWebSocketsSidebarInState(data_res);
                // }
                break;
            }
            case "delete_message": {
                setMessagesAfterDeleteInState(data_res);
                break;
            }
            // Отметка о чтении сообщения сразу (оба пользователя подключены)
            case "reading": {
                if (messageFor != from_id) {
                    setReadingMessages([data_res]);
                }
                break;
            }
            default: {
                break;
            }
        }
    };

    const setReaidingMessagesInState = (messages) => {
        setReadingMessages(messages);
    };

    const setMessagesAfterDeleteInState = (data) => {
        const deleteMessageId = data["message_id"];
        setMessages((messages) => {
            return messages.filter((item) => item.pk != deleteMessageId);
        });
    };

    const setAvailableUsersInState = (users) => {
        if (users !== undefined) {
            setAvailableUsers(users);
        }
    };

    const setOneMessageInState = (message) => {
        setMessages((messages) => {
            if (messages === "new_chat") {
                return [message];
            }
            return [...messages, message];
        });
    };

    const setFetchMessagesInState = (data, availableMessages) => {
        // Если ли еще доступные для подгрузки сообщения
        if (availableMessages !== undefined) {
            setAvailableMessages(availableMessages);
        }
        setMessages((messages) => {
            if (data === "new_chat") {
                return [];
            }
            return [...data, ...messages];
        });
    };

    const setLastChatsInState = (chats) => {
        setLastChats(chats);
    };

    // Сообщения, полученные в чате, отмечаются, как прочитанные
    const readMessage = (message) => {
        const messageId = message["pk"];
        const messageUserId = message["user_id"];
        if (messageUserId != from_id) {
            actionReadMessage(messageId);
        }
    };

    const actionReadMessage = (messageId) => {
        const data = {
            action: "read_message",
            data: {
                from_id: from_id,
                message_id: messageId,
            },
        };
        sendDataToConsumers(instance, data);
    };

    const getLastChats = () => {
        const data = {
            action: "get_last_chats",
            data: { from_id },
        };
        sendDataToConsumers(instance, data);
    };

    const sendMessage = (message) => {
        const data = {
            data: {
                from_id,
                to_id,
                message: message,
            },
            action: "new_message",
        };
        sendDataToConsumers(instance, data);
    };

    const fetchMessages = () => {
        const data = {
            data: { from_id, to_id },
            action: "fetch_messages",
        };
        sendDataToConsumers(instance, data);
    };

    const deleteMessage = (pk) => {
        const data = {
            data: { pk, from_id }, // from_id - чтобы работало обновление после удаления
            action: "delete_message",
        };
        sendDataToConsumers(instance, data);
    };

    const getAllUsers = () => {
        const data = {
            data: { from_id },
            action: "get_all_users",
        };
        sendDataToConsumers(instance, data);
    };

    const closeConnection = () => {
        instance.close();
        console.log("Connection closed");
    };

    // // Подключаемся ко всем пользователям для мониторинга отправленных сообщений
    // const connectWithUsers = (users) => {
    //     let objWebSockets = {};
    //     users.forEach((user) => {
    //         const to_id = user.id;
    //         const instanceSidebar = webSocketInstanceSB(from_id, to_id, setCountUpdateSidebar);
    //         objWebSockets[to_id] = instanceSidebar;
    //     });
    //     return objWebSockets;
    // };

    return {
        sendMessage,
        fetchMessages,
        deleteMessage,
        getLastChats,
        closeConnection,
        wbsSidebar,
        getAllUsers,
    };
};

// Общий метод отправки данных потребителям
export const sendDataToConsumers = (instance, data) => {
    const send = () => {
        instance.send(JSON.stringify(data));
    };
    waitingForConnect(instance, send);
};

export const waitingForConnect = (instance, callback) => {
    setTimeout(() => {
        if (instance.readyState === 1) {
            callback();
            return;
        }
        waitingForConnect(instance, callback);
    }, 100);
};

export default webSocketInstance;
