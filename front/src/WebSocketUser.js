import { sendDataToConsumers } from "./WebSocket";

const webSocketUserInstance = (from_id, setCountUpdateSidebar) => {
    const path = `ws://127.0.0.1:8000/ws/user/${from_id}/`;

    // Соединение всего закрывается перед открытием нового
    // Чтобы корректно удалялся экземпляр канала в модели ReadMessage
    if (webSocketUserInstance._instance) {
        webSocketUserInstance._instance.close();
    }
    let instance = new WebSocket(path);
    webSocketUserInstance._instance = instance;

    instance.onopen = () => {
        console.log(`Websocket connection for user_id ${from_id} is open!`);
    };

    instance.onerror = (err) => {
        console.error(err);
        console.log(
            `Websocket connetion for user_id ${from_id} failed, tried reconnecting.`
        );
        const reconnect = setInterval(() => {
            if (instance.readyState !== 1) {
                instance = new WebSocket(path);
            }
            if (instance.readyState === 1) {
                console.log(
                    `Websocket connection for user_id ${from_id} is open!`
                );
                clearInterval(reconnect);
            }
        }, 500);
    };

    instance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const { type } = data;
        switch (type) {
            case "update_sidebar": {
                goUpdateSidebar();
                break;
            }
            default:
                break;
        }
    };

    const goUpdateSidebar = () => {
        setCountUpdateSidebar((cnt) => ++cnt);
    };

    const updateSidebar = () => {
        const data = {
            action: "update_sidebar",
            type: "update_sidebar",
            from_id: from_id,
        };
        sendDataToConsumers(instance, data);
    };

    const closeConnection = () => {
        instance.close();
        console.log(`Connection with user - ${from_id} closed`);
    };

    return {
        updateSidebar,
        closeConnection,
    };
};

export default webSocketUserInstance;
