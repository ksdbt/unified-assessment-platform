import { io } from 'socket.io-client';

// 'http://localhost:5000' is standard backend port; adjust if your backend runs on a different port.
// For production, this should be the deployed backend URL or simply io() if served together.
const socketURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const socket = io(socketURL, {
    autoConnect: false, // We'll connect manually when user logs in
    withCredentials: true,
});

export default socket;
