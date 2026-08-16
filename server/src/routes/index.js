const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const providerRoutes = require('./providerRoutes');
const tiffinRoutes = require('./tiffinRoutes');
const categoryRoutes = require('./categoryRoutes');
const orderRoutes = require('./orderRoutes');
const customerRoutes = require('./customerRoutes');
const reviewRoutes = require('./reviewRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const notificationRoutes = require('./notificationRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const requestRoutes = require('./requestRoutes');
const contactRoutes = require('./contactRoutes');
const settingRoutes = require('./settingRoutes');
const supportRoutes = require('./supportRoutes');
const subscriptionRoutes = require('./subscriptionRoutes');
const otpRoutes = require('./otpRoutes');
const capacityRoutes = require('./capacityRoutes');
const serviceAreaRoutes = require('./serviceAreaRoutes');
const scheduleRoutes = require('./scheduleRoutes');

router.use('/auth', authRoutes);
router.use('/providers', providerRoutes);
router.use('/tiffins', tiffinRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/reviews', reviewRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/settings', settingRoutes);
router.use('/support', supportRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/requests', requestRoutes);
router.use('/contact', contactRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/otp', otpRoutes);
router.use('/capacity', capacityRoutes);
router.use('/service-area', serviceAreaRoutes);
router.use('/schedule', scheduleRoutes);

module.exports = router;

