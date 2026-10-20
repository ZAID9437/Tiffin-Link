import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;
let currentJoinedDeliveryRoom = null;
let currentProviderRoom = null;
let currentDriverRoom = null;
let currentCustomerRoom = null;

export const initSocket = () => {
  if (socket && socket.connected) return socket;

  const token = localStorage.getItem('token') || 
                localStorage.getItem('tiffinlink_token') || 
                localStorage.getItem('tiffinlink_access_token') || '';

  if (socket) {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000
  });

  socket.on('connect', () => {
    console.log('⚡ [Socket.IO Client] Connected to server:', socket.id);
    if (currentJoinedDeliveryRoom) {
      socket.emit('join:delivery', { deliveryId: currentJoinedDeliveryRoom });
    }
    if (currentProviderRoom) {
      socket.emit('join:provider', { providerId: currentProviderRoom });
    }
    if (currentDriverRoom) {
      socket.emit('join:driver', { driverId: currentDriverRoom });
    }
    if (currentCustomerRoom) {
      socket.emit('join:customer', currentCustomerRoom);
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
  currentJoinedDeliveryRoom = deliveryId;
  s.emit('join:delivery', { deliveryId });
};

export const leaveDeliveryRoom = (deliveryId) => {
  if (!deliveryId) return;
  const s = getSocket();
  if (currentJoinedDeliveryRoom === deliveryId) {
    currentJoinedDeliveryRoom = null;
  }
  s.emit('leave:delivery', { deliveryId });
};

export const joinProviderRoom = (providerId) => {
  if (!providerId) return;
  const s = getSocket();
  currentProviderRoom = providerId;
  s.emit('join:provider', { providerId });
};

export const joinDriverRoom = (driverId) => {
  if (!driverId) return;
  const s = getSocket();
  currentDriverRoom = driverId;
  s.emit('join:driver', { driverId });
};

export const joinCustomerRoom = (customerId, email) => {
  if (!customerId && !email) return;
  const s = getSocket();
  currentCustomerRoom = { customerId: customerId ? String(customerId) : '', email: email || '' };
  s.emit('join:customer', currentCustomerRoom);
};

export const sendDriverPresence = (isOnline) => {
  const s = getSocket();
  s.emit('driver:presence', { isOnline: Boolean(isOnline) });
};

export const sendDriverLocationUpdate = ({ deliveryId, lat, lng, accuracy, heading, speed }) => {
  if (!deliveryId || typeof lat !== 'number' || typeof lng !== 'number') return;
  const s = getSocket();
  s.emit('driver:location:update', {
    deliveryId,
    lat,
    lng,
    accuracy: accuracy || 0,
    heading: heading || 0,
    speed: speed || 0,
    timestamp: Date.now()
  });
};

export const subscribeToNewDeliveryRequests = ({ onNew, onUnavailable, onExpired }) => {
  const s = getSocket();

  const newHandler = (data) => onNew && onNew(data);
  const unavailHandler = (data) => onUnavailable && onUnavailable(data);
  const expiredHandler = (data) => onExpired && onExpired(data);

  s.on('delivery:request:new', newHandler);
  s.on('delivery:request:unavailable', unavailHandler);
  s.on('delivery:request:expired', expiredHandler);

  return () => {
    s.off('delivery:request:new', newHandler);
    s.off('delivery:request:unavailable', unavailHandler);
    s.off('delivery:request:expired', expiredHandler);
  };
};

export const subscribeToDeliveryLifecycle = ({ onAssigned, onStatusUpdate, onPickup, onCompleted }) => {
  const s = getSocket();

  const assignedHandler = (data) => onAssigned && onAssigned(data);
  const statusHandler = (data) => onStatusUpdate && onStatusUpdate(data);
  const pickupHandler = (data) => onPickup && onPickup(data);
  const completedHandler = (data) => onCompleted && onCompleted(data);

  s.on('delivery:assigned', assignedHandler);
  s.on('delivery:status:updated', statusHandler);
  s.on('delivery:pickup:completed', pickupHandler);
  s.on('delivery:completed', completedHandler);

  return () => {
    s.off('delivery:assigned', assignedHandler);
    s.off('delivery:status:updated', statusHandler);
    s.off('delivery:pickup:completed', pickupHandler);
    s.off('delivery:completed', completedHandler);
  };
};

export const subscribeToLocationUpdates = (callback) => {
  const s = getSocket();
  const handler = (data) => {
    if (callback) callback(data);
  };
  s.on('driver:location:updated', handler);
  s.on('delivery:location:changed', handler);
  s.on('driver:location:update', handler);
  return () => {
    s.off('driver:location:updated', handler);
    s.off('delivery:location:changed', handler);
    s.off('driver:location:update', handler);
  };
};

export const subscribeToNotifications = ({ onNewNotif, onCountUpdate }) => {
  const s = getSocket();

  const newNotifHandler = (data) => onNewNotif && onNewNotif(data);
  const countHandler = (data) => onCountUpdate && onCountUpdate(data);

  s.on('notification:new', newNotifHandler);
  s.on('notification:count:update', countHandler);

  return () => {
    s.off('notification:new', newNotifHandler);
    s.off('notification:count:update', countHandler);
  };
};

export const subscribeToEarnings = (callback) => {
  const s = getSocket();
  const handler = (data) => callback && callback(data);

  s.on('earnings:updated', handler);
  s.on('payment:updated', handler);

  return () => {
    s.off('earnings:updated', handler);
    s.off('payment:updated', handler);
  };
};

export const subscribeToDriverReviews = (callback) => {
  const s = getSocket();
  const handler = (data) => callback && callback(data);

  s.on('review:new', handler);
  s.on('review:updated', handler);
  s.on('review:replied', handler);
  s.on('driver:rating:updated', handler);
  s.on('delivery:status:updated', handler);
  s.on('delivery:completed', handler);
  s.on('delivery:dashboard:refresh', handler);

  return () => {
    s.off('review:new', handler);
    s.off('review:updated', handler);
    s.off('review:replied', handler);
    s.off('driver:rating:updated', handler);
    s.off('delivery:status:updated', handler);
    s.off('delivery:completed', handler);
    s.off('delivery:dashboard:refresh', handler);
  };
};

export const subscribeToConnectionStatus = (onConnectOrStatus, onDisconnect) => {
  const s = getSocket();
  const isSingleCallback = typeof onConnectOrStatus === 'function' && typeof onDisconnect !== 'function';

  const connectHandler = () => {
    if (isSingleCallback) {
      onConnectOrStatus(true);
    } else if (typeof onConnectOrStatus === 'function') {
      onConnectOrStatus();
    }
  };

  const disconnectHandler = () => {
    if (isSingleCallback) {
      onConnectOrStatus(false);
    } else if (typeof onDisconnect === 'function') {
      onDisconnect();
    }
  };

  // Immediate state synchronization on subscription
  const isCurrentlyConnected = Boolean(s && s.connected);
  if (isSingleCallback) {
    onConnectOrStatus(isCurrentlyConnected);
  } else if (isCurrentlyConnected && typeof onConnectOrStatus === 'function') {
    onConnectOrStatus();
  } else if (!isCurrentlyConnected && typeof onDisconnect === 'function') {
    onDisconnect();
  }

  if (s) {
    s.on('connect', connectHandler);
    s.on('disconnect', disconnectHandler);
    s.on('connect_error', disconnectHandler);
  }

  return () => {
    if (s) {
      s.off('connect', connectHandler);
      s.off('disconnect', disconnectHandler);
      s.off('connect_error', disconnectHandler);
    }
  };
};

