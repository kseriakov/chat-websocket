import { useSelector, useDispatch } from "react-redux";
import { useContext, useEffect, useState } from "react";

import { ContextUsers } from "../utils/Context";
import { urlServer } from "../store/actions/auth";

import * as actions from "../store/actions/logo";

const TopBar = () => {
    const { isLogo } = useSelector(({ logoReducer }) => logoReducer);

    const { username } = useSelector(({ authReducer }) => authReducer);
    const { token } = useSelector(({ authReducer }) => authReducer);
    const { loading } = useSelector(({ authReducer }) => authReducer);

    const { usernameTo } = useContext(ContextUsers);
    const { availableUsers } = useContext(ContextUsers);

    const [userLogo, setUserLogo] = useState(null);

    const dispatch = useDispatch();

    // После загрузки логотипа сразу подгружается в Topbar
    useEffect(() => {
        const myLogo = localStorage.getItem("logo");
        if (!myLogo) {
            dispatch(actions.loadServerLogo(token));
        } else {
            setUserLogo(myLogo);
        }
    }, [isLogo, loading]);

    // Ищем, есть ли для собеседника фото, здесь же определяем статус в сети
    const getUserToLogo = () => {
        const userToLogoList = availableUsers.filter(
            (user) => user.username === usernameTo
        );
        let status, logo;

        if (userToLogoList.length > 0) {
            logo = userToLogoList[0].logo;
            status = userToLogoList[0].is_online;
            if (logo) {
                logo = `${urlServer}${logo}`;
            }
        }
        return {
            logo,
            status,
        };
    };

    const { logo, status } = getUserToLogo();

    const userToChat = usernameTo ? (
        <ChatUser username={usernameTo} logo={logo} status={status} />
    ) : null;

    return (
        <div className="chat__topbar">
            {userToChat}
            <ChatUser myUser={"my"} username={username} logo={userLogo} />
            {/* <div className="chat__action">
                <div className="chat__search">
                    <img src="/img/search.png" alt="" />
                </div>
                <div className="chat__phone">
                    <img src="/img/phone.png" alt="" />
                </div>
                <div className="chat__dots">
                    <img src="/img/dots.png" alt="" />
                </div>
            </div> */}
        </div>
    );
};

const ChatUser = (props) => {
    const LogoName = (
        <p className="user__logo-name">{props.username[0].toUpperCase()}</p>
    );

    const logo =
        props.logo && props.logo !== "null" ? (
            <img src={props.logo} alt="" />
        ) : null;
    const logoItem = logo ?? LogoName;

    const online = props.status ? "user__logo-online" : null;

    return (
        <div className={`chat__user user ${props.myUser}`}>
            <div className={`user__logo ${online}`}>{logoItem}</div>
            <div className="user__info">
                <div className="user__name">{props.username}</div>
                {/* <div className="user__last-seen">{props.lastLogin}</div> */}
            </div>
        </div>
    );
};

export default TopBar;
