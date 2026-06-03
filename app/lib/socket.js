import { io } from "socket.io-client";

const socket = io("https://vi-farm-backend.onrender.com", {
  transports: ["websocket", "polling"], // 👈 mobile network ke liye fallback
  withCredentials: true, // 👈 mobile cross-domain safe
});

export default socket;
