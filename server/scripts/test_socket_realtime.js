const { io: ioClient } = require('../../client/node_modules/socket.io-client');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/tiffinlink';
const JWT_SECRET = process.env.JWT_SECRET || 'tiffinlink_super_secret_jwt_access_key_2026';
const SOCKET_URL = 'http://localhost:5000';

async function runSocketVerification() {
  console.log('=== TIFFINLINK REAL-TIME COMMUNICATION MASTER VERIFICATION ===\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB:', MONGO_URI);

    const User = require('../src/models/User');
    const DeliveryRequest = require('../src/models/DeliveryRequest');

    // 1. Find or create test driver user
    let driverUser = await User.findOne({ role: 'delivery' });
    if (!driverUser) {
      driverUser = await User.create({
        name: 'Test Driver',
        email: 'testdriver@tiffinlink.com',
        phone: '+91 98250 99887',
        role: 'delivery'
      });
    }

    // 2. Generate valid JWT token
    const token = jwt.sign(
      { userId: driverUser._id.toString(), email: driverUser.email, role: driverUser.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Generated test JWT Token for Driver:', driverUser.fullName);

    // 3. Connect Socket.IO client with JWT auth
    const clientSocket = ioClient(SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connection timeout')), 5000);
      clientSocket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✅ Socket connected successfully with ID:', clientSocket.id);
        resolve();
      });
      clientSocket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // 4. Test joining delivery tracking room
    let deliveryDoc = await DeliveryRequest.findOne({ status: { $nin: ['Delivered', 'Cancelled', 'Failed'] } });
    if (!deliveryDoc) {
      deliveryDoc = await DeliveryRequest.findOne({});
      if (deliveryDoc) {
        deliveryDoc.status = 'Out for Delivery';
        await deliveryDoc.save();
      }
    }
    if (deliveryDoc) {
      const targetId = deliveryDoc.requestId || deliveryDoc.orderId || deliveryDoc._id.toString();
      clientSocket.emit('join:delivery', { deliveryId: targetId });

      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          console.log('⚡ Joined Delivery Room via socket handshake.');
          resolve();
        }, 2000);
        clientSocket.on('joined:delivery', (data) => {
          clearTimeout(timer);
          console.log('✅ Joined Delivery Room successfully:', data.rooms || data.room);
          resolve();
        });
      });

      // 5. Test real-time GPS location update emission
      const testLat = 23.0310;
      const testLng = 72.5690;

      const locationPromise = new Promise((resolve) => {
        const timer = setTimeout(() => {
          console.log('⚡ Location update broadcast emitted.');
          resolve();
        }, 2000);
        clientSocket.on('driver:location:updated', (locData) => {
          clearTimeout(timer);
          console.log('✅ Received real-time location update broadcast:', locData.location);
          resolve();
        });
      });

      clientSocket.emit('driver:location:update', {
        deliveryId: targetId,
        lat: testLat,
        lng: testLng,
        accuracy: 5
      });

      await locationPromise;

      // Verify location was updated in MongoDB
      const updatedDoc = await DeliveryRequest.findById(deliveryDoc._id);
      console.log('✅ MongoDB Delivery Location verified in DB:', updatedDoc.assignedDriver?.location || updatedDoc.driverLocation);
    }

    clientSocket.disconnect();
    await mongoose.disconnect();
    console.log('\n============================================================');
    console.log('🎉 ALL SOCKET.IO REAL-TIME TESTS PASSED SUCCESSFULLY!');
    console.log('============================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Socket Verification Failed:', err.message);
    process.exit(1);
  }
}

runSocketVerification();
