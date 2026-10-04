const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Provider = require('../models/Provider');
const DeliveryRequest = require('../models/DeliveryRequest');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      credentials: true
    }
  });

  // JWT Authentication Middleware for Socket.IO Handshake
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || 
                    socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        // Unauthenticated guest socket
        socket.user = { isGuest: true };
        return next();
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026'
      );

      const userId = decoded.userId || decoded.id || decoded._id;
      const user = await User.findById(userId).select('-password');

      if (!user) {
        socket.user = { isGuest: true };
        return next();
      }

      socket.user = user;
      socket.userId = user._id.toString();
      socket.role = user.role || 'customer';

      // Query database for linked entity IDs (Never trust frontend-supplied IDs)
      if (user.role === 'provider') {
        const provider = await Provider.findOne({
          $or: [{ userId: user._id }, { email: user.email }]
        });
        if (provider) {
          socket.providerId = provider._id.toString();
        }
      } else if (user.role === 'driver' || user.role === 'delivery') {
        const driver = await Driver.findOne({
          $or: [{ userId: user._id }, { email: user.email }, { phone: user.phone }]
        });
        if (driver) {
          socket.driverId = driver.driverId || driver._id.toString();
        }
      } else {
        socket.customerId = user._id.toString();
      }

      next();
    } catch (err) {
      if (err.name !== 'TokenExpiredError') {
        console.warn('Socket Auth Warning:', err.message);
      }
      socket.user = { isGuest: true };
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket Connected] ID: ${socket.id} | User: ${socket.user?.email || 'Guest'} | Role: ${socket.role || 'guest'}`);

    // Auto-join isolated user and role rooms if authenticated
    if (socket.userId && !socket.user?.isGuest) {
      const userRoom = `user:${socket.userId}`;
      socket.join(userRoom);
      console.log(`📡 Socket ${socket.id} joined room: ${userRoom}`);

      if (socket.providerId) {
        const providerRoom = `provider:${socket.providerId}`;
        socket.join(providerRoom);
        console.log(`📡 Socket ${socket.id} joined room: ${providerRoom}`);
      }

      if (socket.driverId) {
        const driverRoom = `driver:${socket.driverId}`;
        socket.join(driverRoom);
        console.log(`📡 Socket ${socket.id} joined room: ${driverRoom}`);
      }

      if (socket.customerId) {
        const customerRoom = `customer:${socket.customerId}`;
        socket.join(customerRoom);
        console.log(`📡 Socket ${socket.id} joined room: ${customerRoom}`);
      }
    }

    // Join Provider Room explicitly
    socket.on('join:provider', ({ providerId }) => {
      if (providerId) {
        const roomName = `provider:${providerId}`;
        socket.join(roomName);
        console.log(`📡 Socket ${socket.id} explicitly joined room: ${roomName}`);
      }
    });

    // Join Driver Room explicitly
    socket.on('join:driver', ({ driverId }) => {
      if (driverId) {
        const roomName = `driver:${driverId}`;
        socket.join(roomName);
        console.log(`📡 Socket ${socket.id} explicitly joined room: ${roomName}`);
      }
    });

    // Join Delivery Tracking Room with Security Verification
    socket.on('join:delivery', async ({ deliveryId }) => {
      try {
        if (!deliveryId) return;

        const delivery = await DeliveryRequest.findOne({
          $or: [{ requestId: deliveryId }, { orderId: deliveryId }, { _id: deliveryId }]
        });

        if (!delivery) {
          socket.emit('error', { message: 'Delivery not found.' });
          return;
        }

        const cleanReqId = delivery.requestId ? String(delivery.requestId).trim().replace(/^#+/, '') : '';
        const cleanOrdId = delivery.orderId ? String(delivery.orderId).trim().replace(/^#+/, '') : '';
        const rawMongoId = delivery._id ? delivery._id.toString() : '';

        const roomsToJoin = new Set();
        if (cleanReqId) {
          roomsToJoin.add(`delivery:${cleanReqId}`);
          roomsToJoin.add(`delivery:#${cleanReqId}`);
        }
        if (cleanOrdId) {
          roomsToJoin.add(`delivery:${cleanOrdId}`);
          roomsToJoin.add(`delivery:#${cleanOrdId}`);
        }
        if (rawMongoId) roomsToJoin.add(`delivery:${rawMongoId}`);
        if (deliveryId) roomsToJoin.add(`delivery:${deliveryId}`);

        roomsToJoin.forEach(r => socket.join(r));
        console.log(`📡 Socket ${socket.id} joined delivery rooms:`, Array.from(roomsToJoin).join(', '));
        
        socket.emit('joined:delivery', { 
          success: true, 
          rooms: Array.from(roomsToJoin),
          deliveryId: cleanReqId || cleanOrdId || rawMongoId,
          currentLocation: delivery.assignedDriver?.location || null
        });
      } catch (err) {
        console.error('Error joining delivery room:', err);
        socket.emit('error', { message: 'Failed to join delivery room.' });
      }
    });

    // Leave Delivery Room
    socket.on('leave:delivery', ({ deliveryId }) => {
      if (deliveryId) {
        const cleanId = String(deliveryId).trim().replace(/^#+/, '');
        const roomName = `delivery:${cleanId}`;
        socket.leave(roomName);
        console.log(`📡 Socket ${socket.id} left room: ${roomName}`);
      }
    });

    // Driver Online/Offline Presence Updates
    socket.on('driver:presence', async ({ isOnline }) => {
      try {
        if (socket.driverId) {
          await Driver.updateOne(
            { $or: [{ driverId: socket.driverId }, { _id: socket.driverId }] },
            { $set: { status: isOnline ? 'AVAILABLE' : 'OFFLINE' } }
          );
          console.log(`📡 Driver ${socket.driverId} status updated in DB: ${isOnline ? 'AVAILABLE' : 'OFFLINE'}`);
        }
      } catch (err) {
        console.error('Error updating driver presence:', err);
      }
    });

    // Handle Real-Time Driver Location Updates (Driver -> Socket -> DB & Room Broadcast)
    socket.on('driver:location:update', async (payload) => {
      try {
        const { deliveryId, lat, lng, accuracy, heading, speed } = payload || {};

        if (!deliveryId || typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return socket.emit('error', { message: 'Invalid coordinates provided.' });
        }

        const delivery = await DeliveryRequest.findOne({
          $or: [{ requestId: deliveryId }, { orderId: deliveryId }, { _id: deliveryId }]
        });

        if (!delivery) {
          return socket.emit('error', { message: 'Delivery not found for location update.' });
        }

        const inactiveStatuses = ['Delivered', 'Cancelled', 'Failed'];
        if (inactiveStatuses.includes(delivery.status)) {
          return socket.emit('error', { message: 'Delivery is no longer active.' });
        }

        const updatedLocation = {
          lat: Number(lat),
          lng: Number(lng),
          accuracy: Number(accuracy || 0),
          heading: Number(heading || 0),
          speed: Number(speed || 0),
          updatedAt: new Date()
        };

        delivery.assignedDriver = delivery.assignedDriver || {};
        delivery.assignedDriver.location = updatedLocation;
        delivery.driverLocation = updatedLocation;

        await delivery.save();

        const cleanReqId = delivery.requestId ? String(delivery.requestId).trim().replace(/^#+/, '') : '';
        const cleanOrdId = delivery.orderId ? String(delivery.orderId).trim().replace(/^#+/, '') : '';
        const rawMongoId = delivery._id ? delivery._id.toString() : '';

        const locationPayload = {
          deliveryId: cleanReqId || cleanOrdId || rawMongoId,
          orderId: delivery.orderId,
          location: updatedLocation,
          status: delivery.status,
          etaMinutes: delivery.etaMinutes,
          distanceKm: delivery.distanceKm,
          accuracy: Number(accuracy || 0),
          isLowAccuracy: Number(accuracy || 0) > 50
        };

        const targetRooms = new Set();
        if (cleanReqId) {
          targetRooms.add(`delivery:${cleanReqId}`);
          targetRooms.add(`delivery:#${cleanReqId}`);
        }
        if (cleanOrdId) {
          targetRooms.add(`delivery:${cleanOrdId}`);
          targetRooms.add(`delivery:#${cleanOrdId}`);
        }
        if (rawMongoId) targetRooms.add(`delivery:${rawMongoId}`);

        targetRooms.forEach(room => {
          io.to(room).emit('driver:location:updated', locationPayload);
          io.to(room).emit('delivery:location:changed', locationPayload);
          io.to(room).emit('driver:location:update', locationPayload);
        });

        // Also broadcast to Provider room
        if (delivery.providerId) {
          io.to(`provider:${delivery.providerId}`).emit('driver:location:updated', locationPayload);
          io.to(`provider:${delivery.providerId}`).emit('driver:location:update', locationPayload);
        }

      } catch (err) {
        console.error('Error handling driver location update:', err);
        socket.emit('error', { message: 'Server error processing location update.' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket Disconnected] ID: ${socket.id} | Reason: ${reason}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Targeted Helper Emitters
const emitToUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, payload);
  }
};

const emitToDriver = (driverId, event, payload) => {
  if (io && driverId) {
    io.to(`driver:${driverId}`).emit(event, payload);
  }
};

const emitToProvider = (providerId, event, payload) => {
  if (io && providerId) {
    io.to(`provider:${providerId}`).emit(event, payload);
  }
};

const emitToCustomer = (customerId, event, payload) => {
  if (io && customerId) {
    io.to(`customer:${customerId}`).emit(event, payload);
  }
};

const emitToDelivery = (deliveryId, event, payload) => {
  if (io && deliveryId) {
    const cleanId = String(deliveryId).trim().replace(/^#+/, '');
    io.to(`delivery:${cleanId}`).emit(event, payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToDriver,
  emitToProvider,
  emitToCustomer,
  emitToDelivery
};

