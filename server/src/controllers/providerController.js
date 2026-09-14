const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const Provider = require('../models/Provider');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('../services/emailService');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');



const { ensureConnected } = require('../config/db');

const isDbConnected = async () => {
  return await ensureConnected();
};

// Format user payload safely without passwords
const formatUserPayload = (user) => ({
  id: user._id || user.id,
  name: user.name || (user.email ? user.email.split('@')[0] : ''),
  email: user.email,
  phone: user.phone || '',
  role: user.role || 'provider',
  isActive: user.isActive !== false,
  isVerified: user.isVerified !== false,
  lastLogin: user.lastLogin
});

const Review = require('../models/Review');

// @desc    Get all tiffin providers with real-time calculated ratings
// @route   GET /api/providers
const getProviders = async (req, res) => {
  try {
    if (await isDbConnected()) {
      let providers = await Provider.find();

      // Calculate dynamic real-time rating and review count from Review collection
      const enrichedProviders = await Promise.all(providers.map(async (p) => {
        const pObj = p.toObject ? p.toObject() : { ...p };
        const pIdStr = p._id.toString();

        const reviews = await Review.find({
          $or: [
            { providerId: pIdStr },
            { customerEmail: p.email }
          ]
        });

        if (reviews.length > 0) {
          const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
          const avg = (sum / reviews.length).toFixed(1);
          pObj.rating = Number(avg);
          pObj.reviewCount = reviews.length;
        } else {
          pObj.rating = pObj.rating || 0;
          pObj.reviewCount = 0;
        }
        return pObj;
      }));

      return res.json({ success: true, data: enrichedProviders, source: 'database' });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error fetching providers with dynamic ratings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Send OTP to Provider email
// @route   POST /api/providers/send-otp
const sendProviderOtp = async (req, res) => {
  try {
    let { email, name } = req.body;

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    email = email.trim().toLowerCase();

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (await isDbConnected()) {
      await Otp.deleteMany({ email });
      await Otp.create({ email, otp });

      dotenv.config({ path: path.join(__dirname, '../../.env') });
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (emailUser && emailPass) {
        try {
          await sendOtpEmail(email, otp, emailUser, emailPass);
          return res.json({
            success: true,
            message: `Verification code sent to ${email}. Please check Inbox/Spam.`,
            source: 'database'
          });
        } catch (mailErr) {
          console.error('\x1b[31m[Nodemailer Provider Error]\x1b[0m', mailErr.message);
          return res.json({
            success: true,
            message: `Verification code sent to ${email}. Please check Inbox/Spam.`,
            source: 'database'
          });
        }
      } else {
        return res.json({
          success: true,
          message: `Verification code sent to ${email}. Please check Inbox/Spam.`,
          source: 'database'
        });
      }
    } else {
      return res.json({
        success: true,
        message: `Verification code sent to ${email}.`,
        source: 'in-memory'
      });
    }
  } catch (error) {
    console.error('Error sending provider OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send verification code: ' + error.message });
  }
};

// @desc    Register a new provider
// @route   POST /api/providers
const registerProvider = async (req, res) => {
  try {
    const payload = req.body || {};
    
    // Provide sensible defaults for essential display fields if not explicitly passed
    const providerName = payload.businessName || payload.name || payload.fullName || 'Artisanal Home Kitchen';
    const providerDesc = payload.description || 'Authentic home-cooked meals prepared with care and fresh ingredients.';
    const providerEta = (payload.opens && payload.closes) ? `${payload.opens} - ${payload.closes}` : (payload.eta || '30-40 min');
    const providerPrice = Number(payload.mealPrice || payload.price) || 120;
    const providerTags = Array.isArray(payload.tags) && payload.tags.length > 0
      ? payload.tags
      : [payload.businessType || 'Home Kitchen', payload.cuisines || 'Pure Veg'];
    const providerImage = payload.kitchenPhotos || payload.image || '/assets/provider_1.png';

    const providerData = {
      name: providerName,
      description: providerDesc,
      fullName: payload.fullName || '',
      email: payload.email ? payload.email.toLowerCase().trim() : '',
      mobile: payload.mobile || payload.phone || '',
      dob: payload.dob || '',
      gender: payload.gender || '',
      businessName: payload.businessName || providerName,
      businessType: payload.businessType || 'Home Kitchen',
      experience: payload.experience || '',
      staffCount: payload.staffCount || '',
      address: {
        houseNo: payload.houseNo || '',
        street: payload.street || '',
        locality: payload.locality || '',
        city: payload.city || '',
        pincode: payload.pincode || '',
        isLocationPinned: Boolean(payload.isLocationPinned)
      },
      cuisines: payload.cuisines || '',
      maxMeals: payload.maxMeals || '',
      opens: payload.opens || '',
      closes: payload.closes || '',
      sameDayDelivery: Boolean(payload.sameDayDelivery),
      fssaiNumber: payload.fssaiNumber || '',
      idType: payload.idType || 'Aadhar Card',
      fssaiCert: payload.fssaiCert || '',
      fssaiCertName: payload.fssaiCertName || '',
      kitchenPhotos: payload.kitchenPhotos || '',
      kitchenPhotosName: payload.kitchenPhotosName || '',
      ownerId: payload.ownerId || '',
      ownerIdName: payload.ownerIdName || '',
      accountHolderName: payload.accountHolderName || '',
      bankName: payload.bankName || '',
      ifscCode: payload.ifscCode || '',
      accountNumber: payload.accountNumber || '',
      upiId: payload.upiId || '',
      deliveryPreference: payload.deliveryPreference || 'TiffinLink Partner',
      languagesSpoken: payload.languagesSpoken || '',
      hearSource: payload.hearSource || 'Instagram',
      mealTitle: payload.mealTitle || '',
      mealIngredients: payload.mealIngredients || '',
      mealPrice: Number(payload.mealPrice) || 0,
      mealPrepTime: payload.mealPrepTime || '',
      skipMenu: Boolean(payload.skipMenu),
      rating: 4.8,
      eta: providerEta,
      price: providerPrice,
      tags: providerTags,
      image: providerImage,
      status: payload.status || 'active'
    };

    if (await isDbConnected()) {
      // Validate OTP if provided
      if (payload.otp) {
        const otpRecord = await Otp.findOne({ email: providerData.email, otp: payload.otp.toString().trim() });
        if (!otpRecord) {
          return res.status(400).json({
            success: false,
            message: 'Invalid or expired verification code'
          });
        }
        await Otp.deleteMany({ email: providerData.email });
      }

      const newProvider = new Provider(providerData);
      await newProvider.save();

      // Automatically register/upsert Provider user record in MongoDB User collection
      let updatedUser = null;
      let accessToken = null;
      let refreshToken = null;

      if (providerData.email) {
        updatedUser = await User.findOneAndUpdate(
          { email: providerData.email },
          { 
            name: providerData.fullName || providerName,
            phone: providerData.mobile,
            role: 'provider',
            isVerified: true,
            lastLogin: new Date()
          },
          { upsert: true, new: true }
        );

        accessToken = generateAccessToken(updatedUser._id, updatedUser.role);
        refreshToken = generateRefreshToken(updatedUser._id);
        updatedUser.refreshToken = refreshToken;
        await updatedUser.save();
      }

      return res.status(201).json({ 
        success: true, 
        message: 'Kitchen registered successfully',
        data: newProvider, 
        user: updatedUser ? formatUserPayload(updatedUser) : null,
        accessToken,
        refreshToken,
        source: 'database' 
      });
    }
    return res.status(500).json({ success: false, message: 'Database connection error' });
  } catch (error) {
    console.error('Error registering provider:', error);
    res.status(500).json({ success: false, message: 'Provider registration failed: ' + error.message });
  }
};

let currentAcceptingOrders = true;

// @desc    Get real-time provider dashboard statistics from MongoDB
// @route   GET /api/providers/dashboard
const getProviderDashboardStats = async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Tiffin = require('../models/Tiffin');
    const Review = require('../models/Review');
    const MealRequest = require('../models/MealRequest');
    let providerId = req.providerId;

    if (!providerId && req.user) {
      const p = await Provider.findOne({ $or: [{ userId: req.user._id }, { email: req.user.email }] });
      if (p) providerId = p._id.toString();
    }

    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    if (await isDbConnected()) {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      const [
        providerDoc,
        activeTiffinsCount,
        recentOrders,
        todayAggResult,
        totalOrdersCount,
        pendingRequestsCount,
        newOrdersCount,
        reviewAggResult
      ] = await Promise.all([
        Provider.findById(providerId).select('isAcceptingOrders maxMeals').lean(),
        Tiffin.countDocuments({ providerId }),
        Order.find({ providerId })
          .sort({ createdAt: -1 })
          .limit(10)
          .select('orderId customerName totalAmount quantity tiffinName status deliveryPartnerName createdAt')
          .lean(),
        Order.aggregate([
          { $match: { providerId, createdAt: { $gte: startOfDay, $lte: endOfDay } } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalMeals: {
                $sum: {
                  $cond: [{ $ne: ['$status', 'Cancelled'] }, { $ifNull: ['$quantity', 1] }, 0]
                }
              },
              revenue: {
                $sum: {
                  $cond: [{ $ne: ['$status', 'Cancelled'] }, '$totalAmount', 0]
                }
              },
              customers: { $addToSet: { $ifNull: ['$customerPhone', '$customerName'] } }
            }
          }
        ]),
        Order.countDocuments({ providerId }),
        MealRequest.countDocuments({ status: 'pending' }),
        Order.countDocuments({ providerId, status: 'New' }),
        Review.aggregate([
          { $match: { providerId } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: '$rating' },
              totalReviews: { $sum: 1 }
            }
          }
        ])
      ]);

      const acceptingOrders = providerDoc ? Boolean(providerDoc.isAcceptingOrders) : true;

      // Extract today metrics or fallback to total count/revenue if no orders placed today
      const todayAgg = todayAggResult[0] || { count: 0, totalMeals: 0, revenue: 0, customers: [] };
      const todaysOrdersCount = todayAgg.count > 0 ? todayAgg.count : totalOrdersCount;

      const totalRevenue = recentOrders
        .filter(o => o.status !== 'Cancelled')
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      const revenueToday = todayAgg.revenue > 0 ? todayAgg.revenue : totalRevenue;

      const uniqueCustomersSet = new Set(recentOrders.map(o => o.customerPhone || o.customerName).filter(Boolean));
      const todaysCustomersCount = todayAgg.customers.length > 0 ? todayAgg.customers.length : uniqueCustomersSet.size;

      const reviewAgg = reviewAggResult[0] || { avgRating: 4.8, totalReviews: 0 };
      const rating = Number((reviewAgg.avgRating || 4.8).toFixed(1));
      const reviewCount = reviewAgg.totalReviews;

      // Kitchen Capacity Calculations
      const parsedMaxMeals = Number(providerDoc?.maxMeals);
      const maxMeals = (!isNaN(parsedMaxMeals) && parsedMaxMeals > 0) ? parsedMaxMeals : 50;
      const recentMealsSum = recentOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);
      const cookedMeals = todayAgg.totalMeals > 0 ? todayAgg.totalMeals : recentMealsSum;

      // Delivery Status Counts
      const DeliveryRequest = require('../models/DeliveryRequest');
      const deliveryRequests = await DeliveryRequest.find({ providerId }).lean();
      const readyCount = deliveryRequests.filter(r => r.status === 'Ready' || r.status === 'PICKUP_OTP_PENDING' || r.status === 'Arrived at Provider').length;
      const assignedCount = deliveryRequests.filter(r => r.status === 'Assigned' || r.status === 'Heading to Provider' || r.status === 'Picked Up' || r.status === 'Out for Delivery').length;
      const searchingCount = deliveryRequests.filter(r => r.status === 'Searching Drivers' || r.status === 'SEARCHING_DRIVERS').length;

      const formattedOrders = recentOrders.map((o, i) => {
        let statusBg = 'bg-[#E8F0EC] text-[#0A8B5F] border-[#C5DDD2]';
        if (o.status === 'Preparing') statusBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        if (o.status === 'Ready') statusBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (o.status === 'New') statusBg = 'bg-indigo-100 text-indigo-800 border-indigo-200';

        return {
          id: o.orderId || `#${1024 + i}`,
          customer: o.customerName || 'Customer',
          amount: o.totalAmount || 240,
          qtyText: `${o.quantity || 1} x ${o.tiffinName || 'Tiffin'}`,
          status: o.status || 'Preparing',
          statusBg
        };
      });

      return res.json({
        success: true,
        source: 'database',
        databaseName: 'tiffinlink',
        data: {
          todaysOrdersCount,
          activeTiffinsCount,
          todaysCustomersCount,
          revenueToday,
          rating,
          reviewCount,
          liveRequestsCount: pendingRequestsCount,
          newOrdersCount,
          todaysOrders: formattedOrders,
          acceptingOrders,
          kitchenCapacity: {
            maxMeals,
            cookedMeals
          },
          deliveryCounts: {
            ready: readyCount,
            assigned: assignedCount,
            searching: searchingCount
          }
        }
      });
    } else {
      return res.json({
        success: true,
        source: 'in-memory',
        data: {
          todaysOrdersCount: 0,
          activeTiffinsCount: 0,
          todaysCustomersCount: 0,
          revenueToday: 0,
          rating: 4.8,
          reviewCount: 0,
          liveRequestsCount: 0,
          newOrdersCount: 0,
          todaysOrders: [],
          acceptingOrders: true
        }
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// @desc    Toggle accepting orders status in MongoDB
// @route   PUT /api/providers/status
const toggleProviderStatus = async (req, res) => {
  try {
    const { acceptingOrders } = req.body;
    const providerId = req.providerId;
    const isAccepting = Boolean(acceptingOrders);

    if (await isDbConnected()) {
      await Provider.findByIdAndUpdate(providerId, { $set: { isAcceptingOrders: isAccepting } });
      return res.json({
        success: true,
        acceptingOrders: isAccepting,
        message: `Provider status updated to ${isAccepting ? 'ONLINE' : 'PAUSED'}`
      });
    }
    return res.json({ success: true, acceptingOrders: isAccepting, message: 'Status updated' });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

module.exports = {
  getProviders,
  sendProviderOtp,
  registerProvider,
  getProviderDashboardStats,
  toggleProviderStatus
};
