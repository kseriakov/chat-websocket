import React, {
    useEffect,
    useMemo,
    useState,
    useContext,
    useRef,
    useLayoutEffect,
} from "react";
import { useSelector, useDispatch } from "react-redux";
import { Spin } from "antd";

import * as actions from ".././store/actions/chat";
import { ContextUsers } from "../utils/Context";
import webSocketInstance from "../WebSocket";
import webSocketUserInstance from "../WebSocketUser";
import ChatMessage from "./Message";
import TopBar from "./Topbar";

const Chat = (props) => {
    const dispatch = useDispatch();

    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState([]);
    const [messageItems, setMessageItems] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [availableMessages, setAvailableMessages] = useState(false);
    const [userTo, setUserTo] = useState(null);
    const [lastChats, setLastChats] = useState([]);
    const [scrollUp, setScrollUp] = useState(false);
    const [heightOld, setHeightOld] = useState(null);
    const [heightCurrent, setHeightCurrent] = useState(null);
    const [readingMessages, setReadingMessages] = useState([]);

    // const [webSocketsSidebar, setWebSocketsSidebar] = useState([]);
    const [countUpdateSidebar, setCountUpdateSidebar] = useState(0);

    const { user_id } = useSelector(({ authReducer }) => authReducer);
    const { chatLoading } = useSelector(({ chatReducer }) => chatReducer);
    const { chatLoaded } = useSelector(({ chatReducer }) => chatReducer);

    const userToFromContext = useContext(ContextUsers).userTo;

    const txtRef = useRef();
    const chatRef = useRef();

    const webSocket = useMemo(() => {
        return webSocketInstance(
            setMessages,
            setLastChats,
            setAvailableUsers,
            setAvailableMessages,
            setReadingMessages,
            user_id,
            userTo
        );
    }, [userTo]);

    const webSocketUser = useMemo(() => {
        return webSocketUserInstance(user_id, setCountUpdateSidebar);
    }, []);

    const onInputText = (e) => {
        setInputText(e.target.value);

        // Отзывчивая textarea
        formatTextArea();
    };

    // Клик по иконке "отправить"
    const sendNewMessage = (e) => {
        sendFormContent(e, inputText);
    };

    // Отправить через Enter, очистить через Esc
    const onKeyInTextArea = (e) => {
        switch (e.keyCode) {
            case 13: {
                return sendFormContent(e, inputText);
            }
            case 27: {
                return onClearInputText();
            }
            default:
                return;
        }
    };

    const sendFormContent = (e, content) => {
        e.preventDefault();
        webSocket.sendMessage(content);
        setInputText("");
        txtRef.current.style.height = "auto";
        // Передает собеседнику чата сигнал, что получено новое сообщение и надо вызвать getLastChats
        updateSidebar();
        setScrollUp(false);
    };

    const onClearInputText = () => {
        focusOnTextArea();
        txtRef.current.style.height = "auto";
    };

    const onDeleteMessage = (e, pk) => {
        e.preventDefault();

        // Обнуляем, т.к. с backend начинает отдавать сообщения с последнего
        // setMessages([]);
        webSocket.deleteMessage(pk);
        updateSidebar();
        setScrollUp(false);
    };

    const onScrollChat = (e) => {
        if (e.target.scrollTop === 0 && availableMessages && !chatLoading) {
            setHeightOld(e.target.scrollHeight);
            dispatch(actions.chatStart());
            webSocket.fetchMessages();
        }
    };

    const onScrollMouse = (e) => {
        // Когда скролим вверх, при перерендере страница не будет прокручена вниз
        // Прокрутка восстановится после отправки или удалении сообщений
        if (e.deltaY < 0) {
            setScrollUp(true);
        }
    };

    const formatTextArea = () => {
        txtRef.current.style.height = "auto";
        txtRef.current.style.height = txtRef.current.scrollHeight + "px";
    };

    const renderMessages = () => {
        return messages.map((item) => {
            // Меняем иконку на прочитано
            if (readingMessages.includes(item.pk)) {
                item.is_read = true;
            }

            return (
                <ChatMessage
                    time={item.time.time}
                    content={item.content}
                    key={item.pk}
                    userId={item.user_id}
                    isRead={item.is_read}
                    onDelete={(e) => onDeleteMessage(e, item.pk)}
                />
            );
        });
    };

    const updateSidebar = () => {
        // webSocketsSidebar[userTo].updateSidebar();
        webSocketUser.updateSidebar();
    };

    const focusOnTextArea = () => {
        setInputText("");
        txtRef.current.focus();
    };

    // Вызывается после построения DOM структуры страницы
    // Здесь устанавливаем прокрутку всегда внизу, если не было скрола вверх
    // При скроле вверх после загрузки контента, положение на странице сохраняется
    useLayoutEffect(() => {
        setHeightCurrent(chatRef.current.scrollHeight);
        if (!scrollUp) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        } else {
            chatRef.current.scrollTop = heightCurrent - heightOld;
        }
    });

    useEffect(() => {
        if (webSocket) {
            props.setWebSockets({ webSocket });
        }
        if (webSocketUser) {
            props.setWebSockets({ webSocketUser });
        }

        // При переходе по чатам, обнуляем положение скрола
        setHeightOld(null);
    }, [webSocket, webSocketUser]);

    useEffect(() => {
        webSocket.getLastChats(lastChats);
    }, [countUpdateSidebar, webSocket]);

    // отображение всех сообщений
    useEffect(() => {
        if (messages === "new_chat") {
            // Если новый чат, обнуляем сообщения в state, от прошлых чатов
            setMessages([]);
            dispatch(actions.chatLoadingEnd());
            return;
        }

        setMessageItems(renderMessages());

        if (chatLoading) {
            // Останавливаем спиннер, если была загрузка сообщений в чате
            dispatch(actions.chatLoadingEnd());
        }
    }, [messages, readingMessages]);

    // Получение сообщений в чате для отображения, при клике по пользователю
    useEffect(() => {
        if (userTo !== null) {
            // Запускаем спиннер
            // dispatch(actions.chatStart());

            // Обнуляем данные чата после его смены
            setMessages([]);
            setAvailableMessages(false);

            webSocket.fetchMessages();
        }
    }, [userTo]);

    // Последние сообщения для SideBar
    useEffect(() => {
        props.getLastChats(lastChats);
    }, [lastChats]);

    // Передаем всех пользователей
    useEffect(() => {
        props.getUsers(availableUsers);
    }, [availableUsers]);

    // Получаем пользователя, по которому кликнули в SideBar, для чата с ним
    useEffect(() => {
        if (userToFromContext) {
            dispatch(actions.chatStart());
        }

        setUserTo(userToFromContext);
    }, [userToFromContext]);

    useEffect(() => {
        if (webSocket) {
            webSocket.getAllUsers();
        }
    }, [webSocket]);

    const styleClearIcon = inputText.length > 0 ? "visible" : "hidden";

    const UserChat = (
        <>
            {messageItems}
            <div className="chat__date date">
                <div className="date__text"></div>
            </div>
            <form
                action=""
                method="get"
                className="writer__form"
                name="writer__form"
                onSubmit={sendNewMessage}
            >
                <div className="chat__writer writer">
                    <div className="writer__text">
                        <textarea
                            ref={txtRef}
                            name="my-message"
                            id=""
                            rows="1"
                            className="writer__textarea"
                            placeholder="Message..."
                            required
                            onChange={onInputText}
                            onKeyDown={onKeyInTextArea}
                            value={inputText}
                        ></textarea>
                    </div>
                    <div
                        className="writer__clear"
                        style={{ visibility: styleClearIcon }}
                        onClick={onClearInputText}
                    >
                        <img src="/img/clear.png" alt="" />
                    </div>
                    <div className="writer__send">
                        <button type="submit">
                            <img
                                src="/img/send.png"
                                alt=""
                                className="writer__send-button"
                            />
                        </button>
                    </div>
                </div>
            </form>
        </>
    );

    const spinner = chatLoading ? <ChatSpinner /> : null;
    const chatRoom = chatLoaded ? UserChat : null;
    const chatHello = !chatLoaded && !chatLoading ? <Hello /> : null;

    return (
        <div className="window__chat chat">
            <TopBar />
            <div
                className="chat__block"
                ref={chatRef}
                onScroll={onScrollChat}
                onWheel={onScrollMouse}
            >
                <div className="chat__container">
                    {spinner}
                    {chatHello}
                    {chatRoom}
                </div>
            </div>
        </div>
    );
};

const Hello = () => {
    return <div className="chat__hello">Select user for chat</div>;
};

const ChatSpinner = () => {
    return (
        <div className="chat__spinner">
            <Spin tip="Loading chat..." style={{ color: "white" }}></Spin>
        </div>
    );
};

export default Chat;
