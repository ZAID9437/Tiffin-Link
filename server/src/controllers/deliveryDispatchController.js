const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const NEARBY_AVAILABLE_DRIVERS = [
  { driverId: 'DRV-101', name: 'Arjun Patel', phone: '+91 98251 11223', rating: 4.9, vehicleNo: 'GJ-01-AB-1029', distanceKm: 0.4, location: { lat: 23.0285, lng: 72.5675 } },
  { driverId: 'DRV-102', name: 'Rahul Sharma', phone: '+91 98251 44556', rating: 4.8, vehicleNo: 'GJ-01-CD-4589', distanceKm: 0.8, location: { lat: 23.0270, lng: 72.5690 } },
  { driverId: 'DRV-103', name: 'Vikram Singh', phone: '+91 98251 77889', rating: 4.7, vehicleNo: 'GJ-01-EF-8890', distanceKm: 1.2, location: { lat: 23.0250, lng: 72.5700 } },
  { driverId: 'DRV-104', name: 'Sanjay Mehta', phone: '+91 98251 99000', rating: 4.6, vehicleNo: 'GJ-01-GH-3344', distanceKm: 1.9, location: { lat: 23.0220, lng: 72.5720 } }
];

const DEFAULT_DELIVERY_REQUESTS = [
  {
    requestId: '#DEL-1029',
    orderId: 'ORD-9842',
    providerEmail: 'menxoxo50@gmail.com',
    providerName: 'Mansuri Kitchen',
    customerName: 'Raj Patel',
    customerPhone: '+91 98765 12345',
    deliveryAddress: { street: '102, Shivalik Residency, CG Road', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    pickupAddress: { street: '4, Ruhan Duplex, Opp Labbaik Park', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
    assignedDriver: {
      driverId: 'DRV-101',
      name: 'Arjun Patel',
      phone: '+91 98251 11223',
      rating: 4.9,
      vehicleNo: 'GJ-01-AB-1029',
      location: { lat: 23.0275, lng: 72.5680 }
    },
    status: 'Out for Delivery',
    distanceKm: 1.2,
    etaMinutes: 8,
    amount: 240,
    itemCount: 2,
    candidateDrivers: [
      { driverId: 'DRV-101', name: 'Arjun Patel', phone: '+91 98251 11223', rating: 4.9, distanceKm: 0.4, status: 'Accepted' },
      { driverId: 'DRV-102', name: 'Rahul Sharma', phone: '+91 98251 44556', rating: 4.8, distanceKm: 0.8, status: 'Offered' }
    ],
    requestedAt: new Date(Date.now() - 25 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 20 * 60 * 1000),
    pickedUpAt: new Date(Date.now() - 10 * 60 * 1000)
  },
  {
    requestId: '#DEL-1028',
    orderId: 'ORD-9841',
    providerEmail: 'menxoxo50@gmail.com',
    providerName: 'Mansuri Kitchen',
    customerName: 'Priya Sharma',
    customerPhone: '+91 98765 67890',
    deliveryAddress: { street: '405, Sapphire Towers, Paldi', city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 },
    pickupAddress: { street: '4, Ruhan Duplex, Opp Labbaik Park', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
    assignedDriver: {
      driverId: 'DRV-102',
      name: 'Rahul Sharma',
      phone: '+91 98251 44556',
      rating: 4.8,
      vehicleNo: 'GJ-01-CD-4589',
      location: { lat: 23.0290, lng: 72.5640 }
    },
    status: 'Driver Assigned',
    distanceKm: 0.8,
    etaMinutes: 5,
    amount: 150,
    itemCount: 1,
    candidateDrivers: [
      { driverId: 'DRV-102', name: 'Rahul Sharma', phone: '+91 98251 44556', rating: 4.8, distanceKm: 0.8, status: 'Accepted' }
    ],
    requestedAt: new Date(Date.now() - 12 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    requestId: '#DEL-1027',
    orderId: 'ORD-9840',
    providerEmail: 'menxoxo50@gmail.com',
    providerName: 'Mansuri Kitchen',
    customerName: 'Amit Trivedi',
    customerPhone: '+91 98765 99887',
    deliveryAddress: { street: '12, Shanti Heights, Navrangpura', city: 'Ahmedabad', lat: 23.0380, lng: 72.5580 },
    pickupAddress: { street: '4, Ruhan Duplex, Opp Labbaik Park', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
    assignedDriver: { driverId: '', name: '', phone: '', rating: 4.8, vehicleNo: '', location: { lat: 23.0300, lng: 72.5650 } },
    status: 'Searching Drivers',
    distanceKm: 2.1,
    etaMinutes: 15,
    amount: 180,
    itemCount: 1,
    candidateDrivers: [
      { driverId: 'DRV-103', name: 'Vikram Singh', phone: '+91 98251 77889', rating: 4.7, distanceKm: 1.2, status: 'Offered' },
      { driverId: 'DRV-104', name: 'Sanjay Mehta', phone: '+91 98251 99000', rating: 4.6, distanceKm: 1.9, status: 'Offered' }
    ],
    requestedAt: new Date(Date.now() - 3 * 60 * 1000)
  },
  {
    requestId: '#DEL-1020',
    orderId: 'ORD-9801',
    providerEmail: 'menxoxo50@gmail.com',
    providerName: 'Mansuri Kitchen',
    customerName: 'Neha Gupta',
    customerPhone: '+91 98765 11223',
    deliveryAddress: { street: '801, Zodiac Enclave, Satellite', city: 'Ahmedabad', lat: 23.0280, lng: 72.5100 },
    pickupAddress: { street: '4, Ruhan Duplex, Opp Labbaik Park', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
    assignedDriver: {
      driverId: 'DRV-101',
      name: 'Arjun Patel',
      phone: '+91 98251 11223',
      rating: 4.9,
      vehicleNo: 'GJ-01-AB-1029',
      location: { lat: 23.0280, lng: 72.5100 }
    },
    status: 'Delivered',
    distanceKm: 3.5,
    etaMinutes: 0,
    amount: 320,
    itemCount: 3,
    candidateDrivers: [
      { driverId: 'DRV-101', name: 'Arjun Patel', phone: '+91 98251 11223', rating: 4.9, distanceKm: 0.4, status: 'Accepted' }
    ],
    requestedAt: new Date(Date.now() - 120 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 115 * 60 * 1000),
    pickedUpAt: new Date(Date.now() - 95 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 65 * 60 * 1000)
  }
];

// @desc    Get all delivery requests for provider
// @route   GET /api/delivery/requests
const getDeliveryRequests = async (req, res) => {
  try {
    const userEmail = req.query.email || req.headers['x-provider-email'] || 'menxoxo50@gmail.com';

    if (await isDbConnected()) {
      let requests = await DeliveryRequest.find({ providerEmail: userEmail }).sort({ requestedAt: -1 });

      if (requests.length === 0) {
        requests = await DeliveryRequest.insertMany(DEFAULT_DELIVERY_REQUESTS);
      }

      return res.json({
        success: true,
        requests,
        source: 'database'
      });
    } else {
      return res.json({
        success: true,
        requests: DEFAULT_DELIVERY_REQUESTS,
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error fetching delivery requests:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message, requests: DEFAULT_DELIVERY_REQUESTS });
  }
};

// @desc    Create new delivery dispatch request when food is ready
// @route   POST /api/delivery/dispatch
const createDeliveryRequest = async (req, res) => {
  try {
    const { orderId, customerName, customerPhone, deliveryAddress, amount, itemCount, email } = req.body;
    const providerEmail = email || req.query.email || 'menxoxo50@gmail.com';
    const requestId = `#DEL-${Math.floor(1000 + Math.random() * 9000)}`;

    // Select closest available driver
    const closestDriver = NEARBY_AVAILABLE_DRIVERS[0];

    const newRequestData = {
      requestId,
      orderId: orderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      providerEmail,
      providerName: 'Mansuri Kitchen',
      customerName: customerName || 'Raj Patel',
      customerPhone: customerPhone || '+91 98765 12345',
      deliveryAddress: deliveryAddress || { street: '102, Shivalik Residency, CG Road', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
      pickupAddress: { street: '4, Ruhan Duplex, Opp Labbaik Park', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
      assignedDriver: {
        driverId: closestDriver.driverId,
        name: closestDriver.name,
        phone: closestDriver.phone,
        rating: closestDriver.rating,
        vehicleNo: closestDriver.vehicleNo,
        location: closestDriver.location
      },
      status: 'Searching Drivers',
      distanceKm: closestDriver.distanceKm,
      etaMinutes: Math.round(closestDriver.distanceKm * 6) + 5,
      amount: amount || 240,
      itemCount: itemCount || 1,
      candidateDrivers: NEARBY_AVAILABLE_DRIVERS.map(d => ({
        driverId: d.driverId,
        name: d.name,
        phone: d.phone,
        rating: d.rating,
        distanceKm: d.distanceKm,
        status: d.driverId === closestDriver.driverId ? 'Offered' : 'Offered'
      })),
      requestedAt: new Date()
    };

    if (await isDbConnected()) {
      const request = await DeliveryRequest.create(newRequestData);
      
      // Sync status in Order document
      if (orderId) {
        await Order.findOneAndUpdate(
          { $or: [{ orderId }, { _id: orderId }] },
          { $set: { status: 'Ready' } }
        );
      }

      return res.json({
        success: true,
        message: 'Delivery request created! Finding nearby drivers...',
        request
      });
    }

    return res.json({
      success: true,
      message: 'Delivery request created! Finding nearby drivers...',
      request: newRequestData
    });
  } catch (error) {
    console.error('Error creating delivery dispatch request:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Driver accepts delivery request
// @route   POST /api/delivery/accept
const acceptDeliveryRequest = async (req, res) => {
  try {
    const { requestId, driverId } = req.body;
    const selectedDriver = NEARBY_AVAILABLE_DRIVERS.find(d => d.driverId === driverId) || NEARBY_AVAILABLE_DRIVERS[0];

    if (await isDbConnected()) {
      const request = await DeliveryRequest.findOneAndUpdate(
        { requestId },
        { 
          $set: { 
            status: 'Driver Assigned', 
            assignedDriver: selectedDriver,
            acceptedAt: new Date() 
          } 
        },
        { new: true }
      );

      return res.json({
        success: true,
        message: `Delivery accepted by ${selectedDriver.name}!`,
        request
      });
    }

    return res.json({
      success: true,
      message: `Delivery accepted by ${selectedDriver.name}!`
    });
  } catch (error) {
    console.error('Error accepting delivery request:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update delivery status lifecycle
// @route   POST /api/delivery/status
const updateDeliveryStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    const statusUpdates = { status };
    if (status === 'Picked Up') statusUpdates.pickedUpAt = new Date();
    if (status === 'Delivered') statusUpdates.deliveredAt = new Date();

    if (await isDbConnected()) {
      const request = await DeliveryRequest.findOneAndUpdate(
        { requestId },
        { $set: statusUpdates },
        { new: true }
      );

      // Sync with Order collection if delivered
      if (request && status === 'Delivered') {
        await Order.findOneAndUpdate(
          { $or: [{ orderId: request.orderId }, { _id: request.orderId }] },
          { $set: { status: 'Completed' } }
        );
      }

      return res.json({
        success: true,
        message: `Delivery status updated to ${status}!`,
        request
      });
    }

    return res.json({
      success: true,
      message: `Delivery status updated to ${status}!`
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update driver real-time GPS location
// @route   POST /api/delivery/location
const updateDriverLocation = async (req, res) => {
  try {
    const { requestId, lat, lng } = req.body;

    if (await isDbConnected()) {
      const request = await DeliveryRequest.findOneAndUpdate(
        { requestId },
        { $set: { 'assignedDriver.location': { lat, lng } } },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Driver location updated in real-time!',
        location: { lat, lng }
      });
    }

    return res.json({
      success: true,
      message: 'Driver location updated in real-time!',
      location: { lat, lng }
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Get nearby available drivers
// @route   GET /api/delivery/drivers/nearby
const getNearbyDrivers = async (req, res) => {
  try {
    return res.json({
      success: true,
      drivers: NEARBY_AVAILABLE_DRIVERS
    });
  } catch (error) {
    console.error('Error fetching nearby drivers:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message, drivers: NEARBY_AVAILABLE_DRIVERS });
  }
};

module.exports = {
  getDeliveryRequests,
  createDeliveryRequest,
  acceptDeliveryRequest,
  updateDeliveryStatus,
  updateDriverLocation,
  getNearbyDrivers
};
