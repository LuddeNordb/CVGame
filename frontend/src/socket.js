// frontend/src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

export default socket;
