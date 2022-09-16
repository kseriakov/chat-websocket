import { useState, useEffect, useContext, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ContextUsers } from "../utils/Context";
import * as action from "../store/actions/auth";
import { Spinner } from "./Login";
import UploadLogo from "./UploadLogo";
import { urlServer } from "../store/actions/auth";

import "../styles/scss/App.scss";

const Sidebar = () => {
    const [burgerOpen, setBurgerOpen] = useState(false);
    const [searchingUser, setSearchingUser] = useState(false);
    const [searchingText, setSearchingText] = useState("");

    const { userTo } = useContext(ContextUsers);

    const onClickBurger = (e) => {
        setBurgerOpen((burgerOpen) => !burgerOpen);
    };

    // Как только кликнули по пользователю, поиск закрывается
    useEffect(() => {
        setSearchingUser(false);
    }, [userTo]);

    const hideUsersClass = burgerOpen ? "sidebar__users-hidden" : "";
    const hideSearchFieldClass = burgerOpen ? "search__field-hidden" : "";
    const showSettingsClass = burgerOpen ? "sidebar__settings-show" : "";

    return (
        <div className="window__sidebar sidebar">
            <SidebarSettings showClass={showSettingsClass} />
            <div className="sidebar__search search">
                <div className="search__burger" onClick={onClickBurger}>
                    <Burger burgerOpen={burgerOpen} />
                </div>
                <SearchField
                    hideClass={hideSearchFieldClass}
                    setSearchingUser={setSearchingUser}
                    setSearchingText={setSearchingText}
                />
            </div>
            <SidebarUsers
                hideClass={hideUsersClass}
                searching={searchingUser}
                searchingText={searchingText}
            />
        </div>
    );
};

const SidebarUsers = (props) => {
    const { lastChats } = useContext(ContextUsers);
    const { availableUsers } = useContext(ContextUsers);

    const { user_id } = useSelector(({ authReducer }) => authReducer);

    let usersContent;

    // Формируем данные для отображения: все пользователи (поиск), или с которыми есть чат
    if (!props.searching) {
        usersContent = lastChats.map(
            ({ user_to, message, count_unread_messages }) => {

                return {
                    id: user_to.id,
                    userLogo: user_to.logo,
                    username: user_to.username,
                    status: user_to.is_online,
                    content: message.content,
                    time: message.time.time,
                    ownerId: message.user_id,
                    countUnreadMessages: count_unread_messages,
                };
            }
        );
        //  предотвращение отображения полного списка пользователей, когда поле поиска пустое
    } else if (props.searchingText !== "") {
        usersContent = [];
        // Фильтрация при поиске
        availableUsers.forEach((user) => {
            const username = user.username;
            const id = user.id;
            const status = user.status;
            const redExp = new RegExp(`${props.searchingText}`, "i");
            if (redExp.test(username)) {
                usersContent.push({ id, username, status });
            }
        });
    } else {
        usersContent = [];
    }

    const usersItem = usersContent.map((user) => {
        const you = user.ownerId == user_id ? "You: " : "";

        return (
            <SidebarOneUser
                key={user.id}
                username={user.username}
                userLogo={user.userLogo}
                content={`${you}${user.content}`}
                time={user.time}
                userId={user.id}
                status={user.status}
                countUnreadMessages={user.countUnreadMessages}
                searching={props.searching}
            />
        );
    });
    const searchUsers =
        usersItem.length > 0 || lastChats.length === 0 ? (
            usersItem
        ) : (
            <NotMatchingUsers />
        );
    return (
        <div className={`sidebar__users users ${props.hideClass}`}>
            {searchUsers}
        </div>
    );
};

const SidebarOneUser = (props) => {
    const logoName = props.username[0].toUpperCase();
    const { setUserTo } = useContext(ContextUsers);
    const { userTo } = useContext(ContextUsers);
    const { setUsernameTo } = useContext(ContextUsers);

    const hideUser = userTo === props.userId ? "none" : "";

    const onClickUser = (e) => {
        setUserTo(props.userId);
    };

    // Получаем имя пользователя, чтобы вывести его в TopBar
    useEffect(() => {
        if (hideUser !== "") {
            setUsernameTo(props.username);
        }
    }, [hideUser]);

    const User = props.searching ? SearchOne : SidebarOne;

    const statusClass = props.status ? "user__logo-online" : "";

    return (
        <User
            onClickUser={onClickUser}
            hideUser={hideUser}
            userLogo={props.userLogo}
            logoName={logoName}
            statusClass={statusClass}
            username={props.username}
            time={props.time}
            content={props.content}
            countUnreadMessages={props.countUnreadMessages}
        />
    );
};

const UnreadMessages = (props) => {
    if (props.countUnreadMessages < 1) {
        return null;
    }
    return (
        <div className="row__last-message-count">
            <p>{props.countUnreadMessages}</p>
        </div>
    );
};

const SidebarOne = (props) => {
    const UserLogo = (
        <div className="users__logo-img">
            <img src={`${urlServer}${props.userLogo}`} alt="" />
        </div>
    );
    const LogoName = <p className="users__logo-name">{props.logoName}</p>;

    const LogoItem = props.userLogo ? UserLogo : LogoName;

    return (
        <div
            className="users__one"
            onClick={props.onClickUser}
            style={{ display: props.hideUser }}
        >
            <div className={`users__logo ${props.statusClass}`}>{LogoItem}</div>
            <div className="users__row row">
                <div className="row__top">
                    <div className="row__name">
                        <p>{props.username}</p>
                    </div>
                    <div className="row__time">{props.time}</div>
                </div>
                <div className="row__bottom">
                    <div className="row__last-message">
                        <p className="row__last-message-text">
                            {props.content}
                        </p>
                    </div>
                    <UnreadMessages
                        countUnreadMessages={props.countUnreadMessages}
                    />
                </div>
            </div>
        </div>
    );
};

const SearchOne = (props) => {
    return (
        <div className="users__one" onClick={props.onClickUser}>
            <div className={`users__logo ${props.statusClass}`}>
                <p className="users__logo-name">{props.logoName}</p>
            </div>
            <div className="users__row row">
                <div className="row__search">{props.username}</div>
            </div>
        </div>
    );
};

const SearchField = (props) => {
    const [text, setText] = useState("");

    const searchRef = useRef();

    const { userTo } = useContext(ContextUsers);

    useEffect(() => {
        if (text.length > 0) {
            props.setSearchingUser(true);
        } else {
            props.setSearchingUser(false);
        }
    }, [text]);

    // При клике по пользователю поиск закрываем
    useEffect(() => {
        closeSearch();
    }, [userTo]);

    const onInputText = (e) => {
        setText(e.target.value);
        props.setSearchingText(e.target.value);
    };

    const onClearSearch = (e) => {
        if (e.keyCode === 27) {
            e.preventDefault();
            closeSearch();
        }
    };

    const closeSearch = () => {
        setText("");
        props.setSearchingUser(false);
        searchRef.current.blur();
    };

    return (
        <div className={`search__field ${props.hideClass}`}>
            <div className="search__icon">
                <img src="./img/search.png" alt="" />
            </div>
            <div className="search__content">
                <input
                    ref={searchRef}
                    type="text"
                    name="search-chats"
                    id=""
                    placeholder="Search"
                    className="search-chats"
                    value={text}
                    onChange={onInputText}
                    onKeyDown={onClearSearch}
                />
            </div>
        </div>
    );
};

const NotMatchingUsers = () => {
    return <div className="sidebar__users-not">No matching users</div>;
};

const SidebarSettings = (props) => {
    const { loading } = useSelector(({ authReducer }) => authReducer);
    const spinner = loading ? <Spinner /> : null;
    return (
        <div className={`sidebar__settings ${props.showClass}`}>
            {spinner}
            <ButtonLogout />
            <UploadLogo />
        </div>
    );
};

const ButtonLogout = () => {
    const dispatch = useDispatch();
    const { token } = useSelector(({ authReducer }) => authReducer);

    const { getWebSockets } = useContext(ContextUsers);

    const onLogout = (e) => {
        e.preventDefault();
        // Закрываем все подключения
        getWebSockets().forEach((wb) => wb.closeConnection());

        dispatch(action.logout(token));
    };

    return (
        <div className="sidebar__logout">
            <button className="sidebar__logout-button" onClick={onLogout}>
                Logout
            </button>
        </div>
    );
};

const Burger = (props) => {
    const [lines, setLines] = useState([]);

    const changeBurger = () => {
        // Обнуление линий, чтобы они не копились, а было всегда 3
        setLines([]);

        for (let i of Array(3).keys()) {
            let st = {};

            switch (i) {
                case 0: {
                    st = { display: "none" };
                    break;
                }
                case 1: {
                    st = { transform: "rotate(-45deg)" };
                    break;
                }
                case 2: {
                    st = { transform: "rotate(225deg)" };
                    break;
                }
                default:
                    return;
            }

            const style = props.burgerOpen ? st : {};
            const closeClass = props.burgerOpen ? "burger__close" : "";

            setLines((lines) => [
                ...lines,
                <div
                    className={`burger__line ${closeClass}`}
                    key={i}
                    style={style}
                ></div>,
            ]);
        }
    };

    useEffect(() => {
        changeBurger();
    }, [props.burgerOpen]);

    return <>{lines}</>;
};

export default Sidebar;
