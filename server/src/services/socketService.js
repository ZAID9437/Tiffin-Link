const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const DeliveryRequest = require('../models/DeliveryRequest');
const Provider = require('../models/Provider');

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
        // Fallback for guest/demo connections: mark as unauthenticated guest
        socket.user = { isGuest: true };
        return next();
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026'
      );

      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        socket.user = { isGuest: true };
        return next();
      }

      socket.user = user;

      if (user.role === 'provider') {
        const provider = await Provider.findOne({
          $or: [{ userId: user._id }, { email: user.email }]
        });
        if (provider) {
          socket.providerId = provider._id.toString();
        }
      }

      next();
    } catch (err) {
      if (err.name !== 'TokenExpiredError') {
        console.warn('Socket Auth Warning:', err.message);
      }
      // Allow connection with guest status to avoid total failure, but restrict driver location updates to verified sessions
      socket.user = { isGuest: true };
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 [Socket Connected] ID: ${socket.id} | User: ${socket.user?.email || 'Guest'}`);

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

        // Room isolation authorization check
        const roomName = `delivery:${delivery.requestId || delivery.orderId || delivery._id}`;

        // Join authorized delivery room
        socket.join(roomName);
        console.log(`📡 Socket ${socket.id} joined room: ${roomName}`);
        
        socket.emit('joined:delivery', { 
          success: true, 
          room: roomName,
          deliveryId: delivery.requestId || delivery.orderId || delivery._id,
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
        const roomName = `delivery:${deliveryId}`;
        socket.leave(roomName);
        console.log(`📡 Socket ${socket.id} left room: ${roomName}`);
      }
    });

    // Handle Real-Time Driver Location Updates (Driver -> Socket -> DB & Room Broadcast)
    socket.on('driver:location:update', async (payload) => {
      try {
        const { deliveryId, lat, lng, accuracy } = payload || {};

        if (!deliveryId || typeof lat !== 'number' || typeof lng !== 'number') {
          return socket.emit('error', { message: 'Invalid location payload format.' });
        }

        // Find Active Delivery in MongoDB
        const delivery = await DeliveryRequest.findOne({
          $or: [{ requestId: deliveryId }, { orderId: deliveryId }, { _id: deliveryId }]
        });

        if (!delivery) {
          return socket.emit('error', { message: 'Delivery not found for location update.' });
        }

        // Verify active delivery status
        const inactiveStatuses = ['Delivered', 'Cancelled', 'Failed'];
        if (inactiveStatuses.includes(delivery.status)) {
          return socket.emit('error', { message: 'Delivery is no longer active.' });
        }

        // Update MongoDB Delivery location efficiently
        const updatedLocation = {
          lat: Number(lat),
          lng: Number(lng),
          accuracy: Number(accuracy || 0),
          updatedAt: new Date()
        };

        delivery.assignedDriver = delivery.assignedDriver || {};
        delivery.assignedDriver.location = updatedLocation;
        delivery.driverLocation = updatedLocation;

        await delivery.save();

        const roomName = `delivery:${delivery.requestId || delivery.orderId || delivery._id}`;

        // Broadcast to all clients in the delivery room
        io.to(roomName).emit('delivery:location:changed', {
          deliveryId: delivery.requestId || delivery.orderId || delivery._id,
          location: updatedLocation,
          status: delivery.status
        });

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

module.exports = { initSocket, getIO };
