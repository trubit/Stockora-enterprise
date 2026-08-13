import { io } from 'socket.io-client';

export const socket = io(window.location.origin, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  timeout: 10000,
});

socket.on('connect_error', (err) => {
  console.warn('[Socket.IO] Connection warning:', err.message);
});

export default socket;
