import { io } from "socket.io-client";

const URL = "http://localhost:3001";
const socket = io(URL, { autoConnect: true, reconnection: true, timeout: 10000,  transports: [ "websocket", "polling"  ] });

export default socket;