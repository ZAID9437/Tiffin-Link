import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;
let currentJoinedRoom = null;

export const initSocket = () => {
  if (socket) return socket;

  const token = localStorage.getItem('tiffinlink_access_token');

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('⚡ [Socket.IO Client] Connected to server:', socket.id);
    if (currentJoinedRoom) {
      socket.emit('join:delivery', { deliveryId: currentJoinedRoom });
    }
  });

  socket.on('disconnect', (reason) => {
    console.warn('⚡ [Socket.IO Client] Disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('⚡ [Socket.IO Connection Error]:', err.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const joinDeliveryRoom = (deliveryId) => {
  if (!deliveryId) return;
  const s = getSocket();
  currentJoinedRoom = deliveryId;
  s.emit('join:delivery', { deliveryId });
};

export const leaveDeliveryRoom = (deliveryId) => {
  if (!deliveryId) return;
  const s = getSocket();
  if (currentJoinedRoom === deliveryId) {
    currentJoinedRoom = null;
  }
  s.emit('leave:delivery', { deliveryId });
};

export const sendDriverLocationUpdate = ({ deliveryId, lat, lng, accuracy }) => {
  if (!deliveryId || typeof lat !== 'number' || typeof lng !== 'number') return;
  const s = getSocket();
  s.emit('driver:location:update', {
    deliveryId,
    lat,
    lng,
    accuracy: accuracy || 0,
    timestamp: Date.now()
  });
};

export const subscribeToLocationUpdates = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    if (callback) callback(data);
  };
  s.on('delivery:location:changed', handler);
  return () => {
    s.off('delivery:location:changed', handler);
  };
};

export const subscribeToConnectionStatus = (onConnect, onDisconnect) => {
  const s = getSocket();
  
  const connectHandler = () => onConnect && onConnect();
  const disconnectHandler = () => onDisconnect && onDisconnect();

  s.on('connect', connectHandler);
  s.on('disconnect', disconnectHandler);

  return () => {
    s.off('connect', connectHandler);
    s.off('disconnect', disconnectHandler);
  };
};
