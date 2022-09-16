import { useState } from "react";
import { useSelector } from "react-redux";
import checkWhite from "../img/check-white.png";    
import checkBlue from "../img/check-blue.png";

const ChatMessage = (props) => {
    const [mouseOnTMessage, setMouseOnTMessage] = useState(false);
    const { user_id } = useSelector(({ authReducer }) => authReducer);

    const showDeleteIcon = () => {
        setMouseOnTMessage(true);
    };

    const hideDeleteIcon = () => {
        setMouseOnTMessage(false);
    };

    const iconDeleteVisible =
        mouseOnTMessage && props.userId == user_id ? "visible" : "hidden";
    const messageOwner = props.userId == user_id ? "my" : "his";

    let image = props.userId == user_id ? checkWhite : null;
    image = props.isRead && image ? checkBlue : image;

    return (
        <>
            <div className="chat__content message">
                <div
                    className={`message__block ${messageOwner}`}
                    onMouseEnter={showDeleteIcon}
                    onMouseLeave={hideDeleteIcon}
                >
                    <div className="message__text">{props.content}</div>
                    <div className="message__info">
                        <div className={`message__time-${messageOwner}`}>
                            {props.time}
                        </div>
                        <div className="message__status">
                            <img src={image} alt="" />
                        </div>
                    </div>
                    <form
                        action=""
                        method="get"
                        name="delete-message"
                        style={{ visibility: iconDeleteVisible }}
                        onSubmit={props.onDelete}
                    >
                        <button type="submit" className="submit">
                            <div className="message__delete"></div>
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ChatMessage;
