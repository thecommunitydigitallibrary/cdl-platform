import { useEffect } from 'react';
import useUserDataStore from "../store/userData";
import jsCookie from "js-cookie";

const WebSocketManager = () => {
   
    const {isLoggedOut, socket, setUserDataStoreProps} = useUserDataStore();
    let ws_token = jsCookie.get("ws_token");
    if (!ws_token) {
        ws_token = jsCookie.get("token");
        jsCookie.set("ws_token", ws_token,{ expires: 1 });
    }
    
    const handleLogout = () => {
        
        if (socket && ws_token) {
            let logoutMessage = JSON.stringify({
                type: 'logout',
                token: ws_token
            });
            socket.send(logoutMessage);
            jsCookie.remove("ws_token");
            socket.close();
            setUserDataStoreProps({socket: null});
        }
    };
    useEffect(() => {
        
        if (!isLoggedOut && ws_token && !socket) {
            const websocketUrl = 'ws://localhost:8090/'; 
            const newSocket = new WebSocket(websocketUrl);

            newSocket.onopen = function(event) {
                console.log('WebSocket connection established');
                let message = JSON.stringify({
                    type: 'register',
                    token:ws_token
                });
                setUserDataStoreProps({socket:newSocket});
                newSocket.send(message);
                console.log('Registration message sent:', message);
            };

            newSocket.onmessage = function(event) {
                console.log('Message from server:', event.data);
            };

            newSocket.onclose = function(event) {
                console.log('WebSocket connection closed');
                console.log('Code:', event.code);
                console.log('Reason:', event.reason);
                
            };

            newSocket.onerror = function(error) {
                console.log('WebSocket error:', error);
            };
           
        }
    
        else if (isLoggedOut) {
                //console.log("token in islogged out",token);
                handleLogout();
            }
    
    }, [isLoggedOut, ws_token, socket]);

    return null;
    
};

export default WebSocketManager;
