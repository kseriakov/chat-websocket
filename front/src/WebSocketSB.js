import { waitingForConnect } from "./WebSocket";

const webSocketInstanceSB = (from_id, to_id, setCountUpdateSidebar) => {
    let instance;

    const id1 = Math.min(from_id, to_id);
    const id2 = Math.max(from_id, to_id);
    const pathItem = `${id1}/${id2}`;

    const path = `ws://127.0.0.1:8000/ws/sidebar/${pathItem}/`;

    if (!webSocketInstanceSB.__instances) {
        webSocketInstanceSB.__instances = {};
    }
    if (webSocketInstanceSB.__instances[to_id]) {
        instance = webSocketInstanceSB.__instances[to_id];
    } else {
        instance = new WebSocket(path);
        webSocketInstanceSB.__instances[to_id] = instance;
    }

    instance.onopen = () => {
        console.log("Websocket connection for sidebar is open!");
    };

    instance.onerror = (err) => {
        console.error("Websocket connetion for sidebar failed, tried reconnecting.", err);
        const reconnect = setInterval(() => {
            if (instance.readyState !== 1) {
                instance = new WebSocket(path);
            }
            if (instance.readyState === 1) {
                console.log("Websocket connection for sidebar is open!");
                clearInterval(reconnect);
            }
        }, 500);
    };

    instance.onclose = () => {
        console.log(`Websocket connection with user_id = ${to_id} "closed`);
    };

    instance.onmessage = (event) => {
        const action = JSON.parse(event.data)["action"];
        const id = JSON.parse(event.data)["from_id"];
        switch (action) {
            case "update_sidebar": {
                if (id !== from_id) {
                    setUpdateSidebar();
                }
                break;
            }
            default:
                break;
        }
    };

    const setUpdateSidebar = () => {
        setCountUpdateSidebar((cnt) => ++cnt);
    };

    const updateSidebar = () => {
        const send = () =>
            instance.send(
                JSON.stringify({
                    action: "update_sidebar",
                    data: { from_id },
                })
            );
        waitingForConnect(instance, send);
    };

    return {
        to: to_id,
        updateSidebar,
    };
};

export default webSocketInstanceSB;
