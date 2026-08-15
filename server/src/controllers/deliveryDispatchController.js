const DeliveryRequest = require('../models/DeliveryRequest');
const Order = require('../models/Order');
const User = require('../models/User');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// Diverse Dynamic Delivery Partners Collection
const NEARBY_AVAILABLE_DRIVERS = [
  { driverId: 'DRV-101', name: 'Rahul Sharma', phone: '+91 98251 44556', rating: 4.9, vehicleNo: 'GJ-01-AB-1029', distanceKm: 0.8, status: 'AVAILABLE', activeDeliveries: 0, vehicle: 'Bike' },
  { driverId: 'DRV-102', name: 'Arjun Patel', phone: '+91 98251 11223', rating: 4.8, vehicleNo: 'GJ-01-CD-4589', distanceKm: 1.2, status: 'AVAILABLE', activeDeliveries: 1, vehicle: 'Scooter' },
  { driverId: 'DRV-103', name: 'Vikram Singh', phone: '+91 98251 77889', rating: 4.7, vehicleNo: 'GJ-01-EF-8890', distanceKm: 1.9, status: 'AVAILABLE', activeDeliveries: 0, vehicle: 'Bike' },
  { driverId: 'DRV-104', name: 'Jayesh Parmar', phone: '+91 98251 99000', rating: 4.85, vehicleNo: 'GJ-01-GH-3344', distanceKm: 1.5, status: 'AVAILABLE', activeDeliveries: 0, vehicle: 'EV Bike' },
  { driverId: 'DRV-105', name: 'Karan Shah', phone: '+91 98123 66778', rating: 4.95, vehicleNo: 'GJ-01-JK-5566', distanceKm: 2.1, status: 'AVAILABLE', activeDeliveries: 0, vehicle: 'Activa' },
  { driverId: 'DRV-106', name: 'Devang Solanki', phone: '+91 99798 22334', rating: 4.75, vehicleNo: 'GJ-01-LM-9900', distanceKm: 2.6, status: 'AVAILABLE', activeDeliveries: 0, vehicle: 'Pulsar' }
];

let dispatchCounter = 0;

const DEFAULT_DELIVERY_REQUESTS = [
  {
    requestId: '#DEL-1029',
    orderId: '#1024',
    providerEmail: 'menxoxo50@gmail.com',
    providerName: 'Xoxo Men Kitchen',
    customerName: 'Raj Patel',
    customerPhone: '+91 98250 12345',
    tiffinName: 'Gujarati Veg Thali × 2',
    deliveryAddress: { street: '402 Sunrise Towers, Navrangpura', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
    assignedDriver: {
      driverId: 'DRV-101',
      name: 'Rahul Sharma',
      phone: '+91 98251 44556',
      rating: 4.9,
      vehicleNo: 'GJ-01-AB-1029',
      location: { lat: 23.0275, lng: 72.5680 }
    },
    status: 'Out for Delivery',
    distanceKm: 3.2,
    etaMinutes: 18,
    amount: 240,
    itemCount: 2,
    pickupOtp: '4821',
    requestedAt: new Date(Date.now() - 35 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 30 * 60 * 1000),
    pickedUpAt: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    requestId: '#DEL-1028',
    orderId: '#1025',
    providerEmail: 'menxoxo50@gmail.com',
    providerName: 'Xoxo Men Kitchen',
    customerName: 'Amit Shah',
    customerPhone: '+91 99798 54321',
    tiffinName: 'Jain Special Thali × 3',
    deliveryAddress: { street: 'B-12 Shrinand Nagar, Vejalpur', city: 'Ahmedabad', lat: 23.0150, lng: 72.5600 },
    pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
    assignedDriver: {
      driverId: 'DRV-102',
      name: 'Arjun Patel',
      phone: '+91 98251 11223',
      rating: 4.8,
      vehicleNo: 'GJ-01-CD-4589',
      location: { lat: 23.0290, lng: 72.5640 }
    },
    status: 'Driver Assigned',
    distanceKm: 4.5,
    etaMinutes: 8,
    amount: 360,
    itemCount: 3,
    pickupOtp: '9102',
    requestedAt: new Date(Date.now() - 15 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 8 * 60 * 1000)
  },
  {
    requestId: '#DEL-1027',
    orderId: '#1026',
    providerEmail: 'menxoxo50@gmail.com',
    providerName: 'Xoxo Men Kitchen',
    customerName: 'Neha Patel',
    customerPhone: '+91 94260 98765',
    tiffinName: 'Kathiyawadi Special Combo × 1',
    deliveryAddress: { street: '701 Iscon Elegance, Prahlad Nagar', city: 'Ahmedabad', lat: 23.0380, lng: 72.5580 },
    pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
    assignedDriver: {
      driverId: 'DRV-103',
      name: 'Vikram Singh',
      phone: '+91 98251 77889',
      rating: 4.7,
      vehicleNo: 'GJ-01-EF-8890',
      location: { lat: 23.0300, lng: 72.5650 }
    },
    status: 'Driver Assigned',
    distanceKm: 2.5,
    etaMinutes: 15,
    amount: 150,
    itemCount: 1,
    pickupOtp: '3341',
    requestedAt: new Date(Date.now() - 5 * 60 * 1000)
  },
  {
    requestId: '#DEL-1020',
    orderId: '#1021',
    providerEmail: 'menxoxo50@gmail.com',
    providerName: 'Xoxo Men Kitchen',
    customerName: 'Vikram Mehta',
    customerPhone: '+91 98980 11223',
    tiffinName: 'Panjabi Deluxe Thali × 2',
    deliveryAddress: { street: 'A-101 Green Acres, Satellite', city: 'Ahmedabad', lat: 23.0280, lng: 72.5100 },
    pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
    assignedDriver: {
      driverId: 'DRV-104',
      name: 'Jayesh Parmar',
      phone: '+91 98251 99000',
      rating: 4.85,
      vehicleNo: 'GJ-01-GH-3344',
      location: { lat: 23.0280, lng: 72.5100 }
    },
    status: 'Delivered',
    distanceKm: 3.5,
    etaMinutes: 0,
    amount: 320,
    itemCount: 2,
    pickupOtp: '7765',
    requestedAt: new Date(Date.now() - 120 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 115 * 60 * 1000),
    pickedUpAt: new Date(Date.now() - 95 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 65 * 60 * 1000)
  }
];

// Helper to step driver GPS coordinates in MongoDB
const updateLiveGpsInDatabase = async (requests) => {
  try {
    for (const req of requests) {
      if (req.status === 'Out for Delivery' || req.status === 'Picked Up') {
        const currentLat = req.assignedDriver?.location?.lat || 23.0280;
        const currentLng = req.assignedDriver?.location?.lng || 72.5670;
        
        const targetLat = req.deliveryAddress?.lat || 23.0225;
        const targetLng = req.deliveryAddress?.lng || 72.5714;

        const nextLat = currentLat + (targetLat - currentLat) * 0.08;
        const nextLng = currentLng + (targetLng - currentLng) * 0.08;

        const currentEta = req.etaMinutes || 18;
        const nextEta = Math.max(2, currentEta - 1);
        const currentDist = req.distanceKm || 3.2;
        const nextDist = Math.max(0.3, Number((currentDist - 0.2).toFixed(1)));

        req.assignedDriver.location = { lat: nextLat, lng: nextLng };
        req.etaMinutes = nextEta;
        req.distanceKm = nextDist;

        await DeliveryRequest.updateOne(
          { _id: req._id },
          {
            $set: {
              'assignedDriver.location': { lat: nextLat, lng: nextLng },
              etaMinutes: nextEta,
              distanceKm: nextDist
            }
          }
        );
      }
    }
  } catch (err) {
    console.error('Error updating live GPS in DB:', err);
  }
};

// @desc    Get all delivery requests for provider
// @route   GET /api/delivery/requests
const getDeliveryRequests = async (req, res) => {
  try {
    const userEmail = req.query.email || req.headers['x-provider-email'] || 'menxoxo50@gmail.com';

    if (await isDbConnected()) {
      let requests = await DeliveryRequest.find({ providerEmail: userEmail }).sort({ requestedAt: -1 });

      if (requests.length === 0) {
        await DeliveryRequest.deleteMany({ providerEmail: userEmail });
        requests = await DeliveryRequest.insertMany(DEFAULT_DELIVERY_REQUESTS);
      }

      await updateLiveGpsInDatabase(requests);

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

// @desc    Create new delivery dispatch request with Dynamic Driver Matching
// @route   POST /api/delivery/dispatch
const createDeliveryRequest = async (req, res) => {
  try {
    const { orderId, customerName, customerPhone, deliveryAddress, amount, itemCount, tiffinName } = req.body;
    const providerEmail = req.body.email || req.query.email || 'menxoxo50@gmail.com';
    const requestId = `#DEL-${Math.floor(1000 + Math.random() * 9000)}`;
    const pickupOtp = String(Math.floor(1000 + Math.random() * 9000));

    const selectedDriver = NEARBY_AVAILABLE_DRIVERS[dispatchCounter % NEARBY_AVAILABLE_DRIVERS.length];
    dispatchCounter++;

    const newRequestData = {
      requestId,
      orderId: orderId || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      providerEmail,
      providerName: 'Xoxo Men Kitchen',
      customerName: customerName || 'Raj Patel',
      customerPhone: customerPhone || '+91 98765 12345',
      tiffinName: tiffinName || 'Gujarati Special Thali × 1',
      deliveryAddress: typeof deliveryAddress === 'object' ? deliveryAddress : { street: deliveryAddress || 'Ahmedabad', city: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
      pickupAddress: { street: 'Shreeji Tiffin Kitchen, Satellite', city: 'Ahmedabad', lat: 23.0300, lng: 72.5650 },
      assignedDriver: {
        driverId: selectedDriver.driverId,
        name: selectedDriver.name,
        phone: selectedDriver.phone,
        rating: selectedDriver.rating,
        vehicleNo: selectedDriver.vehicleNo,
        location: { lat: 23.0280, lng: 72.5670 }
      },
      status: 'Driver Assigned',
      distanceKm: selectedDriver.distanceKm,
      etaMinutes: 12,
      amount: amount || 240,
      itemCount: itemCount || 1,
      pickupOtp,
      requestedAt: new Date(),
      acceptedAt: new Date()
    };

    if (await isDbConnected()) {
      const request = await DeliveryRequest.create(newRequestData);
      
      if (orderId) {
        await Order.findOneAndUpdate(
          { $or: [{ orderId }, { _id: orderId }] },
          { $set: { status: 'Ready', deliveryStatus: 'Assigned', deliveryPartnerName: selectedDriver.name, deliveryPartnerPhone: selectedDriver.phone } }
        );
      }

      return res.json({
        success: true,
        message: `Delivery request created! Automatically assigned to ${selectedDriver.name}.`,
        request
      });
    }

    return res.json({
      success: true,
      message: `Delivery request created! Automatically assigned to ${selectedDriver.name}.`,
      request: newRequestData
    });
  } catch (error) {
    console.error('Error creating delivery dispatch request:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Manually assign driver to delivery request
// @route   POST /api/delivery/assign
const assignDriver = async (req, res) => {
  try {
    const { requestId, driverId } = req.body;
    
    let selectedDriver = NEARBY_AVAILABLE_DRIVERS.find(d => d.driverId === driverId);
    if (!selectedDriver) {
      selectedDriver = NEARBY_AVAILABLE_DRIVERS[dispatchCounter % NEARBY_AVAILABLE_DRIVERS.length];
      dispatchCounter++;
    }

    if (await isDbConnected()) {
      const request = await DeliveryRequest.findOneAndUpdate(
        { $or: [{ requestId }, { _id: requestId }] },
        { 
          $set: { 
            status: 'Driver Assigned', 
            assignedDriver: selectedDriver,
            acceptedAt: new Date() 
          } 
        },
        { new: true }
      );

      if (request?.orderId) {
        await Order.findOneAndUpdate(
          { $or: [{ orderId: request.orderId }, { _id: request.orderId }] },
          { $set: { status: 'Ready', deliveryStatus: 'Assigned', deliveryPartnerName: selectedDriver.name, deliveryPartnerPhone: selectedDriver.phone } }
        );
      }

      return res.json({
        success: true,
        message: `Delivery partner ${selectedDriver.name} assigned successfully!`,
        request
      });
    }

    return res.json({
      success: true,
      message: `Delivery partner ${selectedDriver.name} assigned successfully!`
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
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
        { $or: [{ requestId }, { _id: requestId }] },
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

// @desc    Confirm order pickup with server OTP validation & transaction logging
// @route   POST /api/delivery/confirm-pickup
const confirmPickup = async (req, res) => {
  try {
    const { requestId, otp, bypassOtp } = req.body;
    const providerEmail = req.body.email || req.query.email || 'menxoxo50@gmail.com';

    if (await isDbConnected()) {
      const existing = await DeliveryRequest.findOne({ $or: [{ requestId }, { _id: requestId }] });
      
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Delivery request not found.' });
      }

      // Concurrent update protection: Reject if already picked up or out for delivery
      if (['Picked Up', 'Out for Delivery', 'Delivered'].includes(existing.status)) {
        return res.status(400).json({ 
          success: false, 
          message: `This order has already been picked up (Status: ${existing.status}). Duplicate pickup rejected.` 
        });
      }

      // OTP Verification Logic
      if (!bypassOtp) {
        if (!otp || String(otp).trim() === '') {
          return res.status(400).json({ success: false, message: 'Invalid pickup code. Please enter the OTP provided by delivery partner.' });
        }
        if (existing.pickupOtp && String(existing.pickupOtp) !== String(otp).trim()) {
          return res.status(400).json({ success: false, message: 'Invalid pickup code. Please check the code and try again.' });
        }
      }

      const serverTimestamp = new Date();

      const request = await DeliveryRequest.findOneAndUpdate(
        { _id: existing._id },
        { 
          $set: { 
            status: 'Picked Up', 
            pickedUpAt: serverTimestamp,
            verifiedBy: providerEmail,
            verificationMethod: bypassOtp ? 'NO_OTP_FALLBACK' : 'SMS_OTP'
          } 
        },
        { new: true }
      );

      if (existing.orderId) {
        await Order.findOneAndUpdate(
          { $or: [{ orderId: existing.orderId }, { _id: existing.orderId }] },
          { 
            $set: { 
              status: 'Ready', 
              deliveryStatus: 'Picked Up',
              pickedUpAt: serverTimestamp 
            } 
          }
        );
      }

      return res.json({
        success: true,
        message: `✓ Pickup confirmed! Order ${existing.orderId || existing.requestId} handed over to ${existing.assignedDriver?.name || 'delivery partner'}.`,
        request,
        timestamp: serverTimestamp
      });
    }

    return res.json({
      success: true,
      message: '✓ Pickup confirmed! Handed over to delivery partner.',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error confirming pickup:', error);
    res.status(500).json({ success: false, message: 'Pickup could not be confirmed: ' + error.message });
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
        { $or: [{ requestId }, { _id: requestId }] },
        { $set: statusUpdates },
        { new: true }
      );

      if (request && status === 'Delivered') {
        await Order.findOneAndUpdate(
          { $or: [{ orderId: request.orderId }, { _id: request.orderId }] },
          { $set: { status: 'Completed', deliveryStatus: 'Delivered' } }
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
        { $or: [{ requestId }, { _id: requestId }] },
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

// @desc    Retry delivery assignment
// @route   POST /api/delivery/retry
const retryDelivery = async (req, res) => {
  try {
    const { requestId } = req.body;

    if (await isDbConnected()) {
      const request = await DeliveryRequest.findOneAndUpdate(
        { $or: [{ requestId }, { _id: requestId }] },
        { $set: { status: 'Searching Drivers' } },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Re-initiated driver search for delivery!',
        request
      });
    }

    return res.json({ success: true, message: 'Re-initiated driver search for delivery!' });
  } catch (error) {
    console.error('Error retrying delivery:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Cancel delivery request
// @route   POST /api/delivery/cancel
const cancelDelivery = async (req, res) => {
  try {
    const { requestId, reason } = req.body;

    if (await isDbConnected()) {
      const request = await DeliveryRequest.findOneAndUpdate(
        { $or: [{ requestId }, { _id: requestId }] },
        { $set: { status: 'Cancelled', cancellationReason: reason || 'Provider cancelled delivery' } },
        { new: true }
      );

      return res.json({
        success: true,
        message: 'Delivery assignment cancelled.',
        request
      });
    }

    return res.json({ success: true, message: 'Delivery assignment cancelled.' });
  } catch (error) {
    console.error('Error cancelling delivery:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Simulate sending Pickup OTP via SMS to delivery driver mobile
// @route   POST /api/delivery/send-otp-sms
const sendPickupOtpSms = async (req, res) => {
  try {
    const { requestId } = req.body;
    let request = null;

    if (await isDbConnected()) {
      request = await DeliveryRequest.findOne({ $or: [{ requestId }, { _id: requestId }] });
    }

    const driverPhone = request?.assignedDriver?.phone || '+91 98251 44556';
    const otp = request?.pickupOtp || '4821';

    console.log(`[SMS GATEWAY] Sent Pickup OTP ${otp} via SMS to Driver mobile ${driverPhone}`);

    return res.json({
      success: true,
      message: `Pickup OTP (${otp}) sent via SMS to driver mobile (${driverPhone})!`,
      driverPhone,
      otpSent: true
    });
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

module.exports = {
  getDeliveryRequests,
  createDeliveryRequest,
  assignDriver,
  acceptDeliveryRequest,
  confirmPickup,
  sendPickupOtpSms,
  updateDeliveryStatus,
  updateDriverLocation,
  getNearbyDrivers,
  retryDelivery,
  cancelDelivery
};
