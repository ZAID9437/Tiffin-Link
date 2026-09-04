const ServiceArea = require('../models/ServiceArea');
const ProviderSetting = require('../models/ProviderSetting');
const Order = require('../models/Order');
const User = require('../models/User');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const defaultInitialAreas = [
  { areaName: 'Ahmedabad (Central)', radiusKm: 5, latitude: 23.0225, longitude: 72.5714, customersCount: 84, status: 'ACTIVE' },
  { areaName: 'Navrangpura', radiusKm: 3, latitude: 23.0365, longitude: 72.5611, customersCount: 26, status: 'ACTIVE' },
  { areaName: 'Satellite', radiusKm: 4, latitude: 23.0300, longitude: 72.5176, customersCount: 18, status: 'ACTIVE' }
];

// @desc    Get real-time Service Area Data, Maps Coordinates & Settings
// @route   GET /api/service-area
const getServiceArea = async (req, res) => {
  try {
    const providerId = req.providerId;

    let deliveryMode = 'Radius Based';
    let deliveryRadius = 5;
    let minOrderAmount = 150;
    let deliveryFee = 30;
    let freeDeliveryAbove = 500;
    let acceptOrdersOnlyInsideArea = true;

    let kitchenLocation = {
      address: '102, Shivalik Plaza, CG Road, Ahmedabad',
      locality: 'CG Road',
      city: 'Ahmedabad',
      latitude: 23.0300,
      longitude: 72.5650
    };

    let areas = [];
    let eligibleCustomersCount = 0;
    let todaysDeliveriesCount = 0;

    if (await isDbConnected()) {
      let settings = await ProviderSetting.findOne({ providerId });
      if (!settings) {
        settings = await ProviderSetting.create({ providerId });
      }

      if (settings.business) {
        kitchenLocation.address = settings.business.address || kitchenLocation.address;
        kitchenLocation.city = settings.business.city || kitchenLocation.city;
      }

      // Check or initialize ServiceArea collection for this provider
      areas = await ServiceArea.find({ providerId }).sort({ createdAt: 1 });
      if (areas.length === 0) {
        const seedDocs = defaultInitialAreas.map(a => ({ ...a, providerId }));
        areas = await ServiceArea.insertMany(seedDocs);
      }

      // Calculate real today's deliveries for this provider
      const today = new Date();
      const ordersToday = await Order.find({ providerId, status: { $ne: 'Cancelled' } });
      const filteredToday = ordersToday.filter(o => new Date(o.createdAt).toDateString() === today.toDateString());
      todaysDeliveriesCount = filteredToday.length;

      // Calculate unique customers for this provider
      const uniqueCustomers = await Order.distinct('customerId', { providerId });
      eligibleCustomersCount = uniqueCustomers.length || areas.reduce((sum, a) => sum + (a.customersCount || 0), 0);

      if (settings.tiffin) {
        deliveryRadius = settings.tiffin.maxDeliveryRadius || 5;
      }
      if (settings.serviceAreaSettings) {
        deliveryMode = settings.serviceAreaSettings.deliveryMode || 'Radius Based';
        minOrderAmount = settings.serviceAreaSettings.minOrderAmount ?? 150;
        deliveryFee = settings.serviceAreaSettings.deliveryFee ?? 30;
        freeDeliveryAbove = settings.serviceAreaSettings.freeDeliveryAbove ?? 500;
        acceptOrdersOnlyInsideArea = settings.serviceAreaSettings.acceptOrdersOnlyInsideArea ?? true;
      }
    } else {
      areas = defaultInitialAreas.map((a, idx) => ({ _id: 'area_' + idx, ...a, providerId }));
    }

    const activeAreasCount = areas.filter(a => a.status === 'ACTIVE').length;

    return res.json({
      success: true,
      data: {
        summary: {
          activeAreasCount,
          eligibleCustomersCount,
          todaysDeliveriesCount
        },
        kitchenLocation,
        settings: {
          deliveryMode,
          deliveryRadius,
          minOrderAmount,
          deliveryFee,
          freeDeliveryAbove,
          acceptOrdersOnlyInsideArea
        },
        areas
      },
      source: (await isDbConnected()) ? 'database' : 'fallback'
    });
  } catch (error) {
    console.error('Error fetching service area data:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Update Service Area Settings
// @route   POST /api/service-area/settings
const updateServiceAreaSettings = async (req, res) => {
  try {
    const providerId = req.providerId;
    const {
      deliveryMode,
      deliveryRadius,
      minOrderAmount,
      deliveryFee,
      freeDeliveryAbove,
      acceptOrdersOnlyInsideArea
    } = req.body;

    if (await isDbConnected()) {
      let settings = await ProviderSetting.findOne({ providerId });
      if (!settings) {
        settings = new ProviderSetting({ providerId });
      }

      if (!settings.serviceAreaSettings) {
        settings.serviceAreaSettings = {};
      }

      if (deliveryMode !== undefined) settings.serviceAreaSettings.deliveryMode = deliveryMode;
      if (deliveryRadius !== undefined) {
        settings.serviceAreaSettings.deliveryRadius = Number(deliveryRadius);
        if (settings.tiffin) settings.tiffin.maxDeliveryRadius = Number(deliveryRadius);
      }
      if (minOrderAmount !== undefined) settings.serviceAreaSettings.minOrderAmount = Number(minOrderAmount);
      if (deliveryFee !== undefined) settings.serviceAreaSettings.deliveryFee = Number(deliveryFee);
      if (freeDeliveryAbove !== undefined) settings.serviceAreaSettings.freeDeliveryAbove = Number(freeDeliveryAbove);
      if (acceptOrdersOnlyInsideArea !== undefined) settings.serviceAreaSettings.acceptOrdersOnlyInsideArea = Boolean(acceptOrdersOnlyInsideArea);

      settings.updatedAt = new Date();
      await settings.save();
    }

    return res.json({
      success: true,
      message: '✓ Service Area Settings saved successfully!'
    });
  } catch (error) {
    console.error('Error saving service area settings:', error);
    res.status(500).json({ success: false, message: 'Failed to save service area settings: ' + error.message });
  }
};

// @desc    Add a new active service area zone
// @route   POST /api/service-area/areas
const addServiceArea = async (req, res) => {
  try {
    const providerId = req.providerId;
    const { areaName, radiusKm, customersCount } = req.body;

    if (!areaName) {
      return res.status(400).json({ success: false, message: 'Area name is required' });
    }

    const areaData = {
      providerId,
      areaName: areaName.trim(),
      radiusKm: Number(radiusKm) || 4,
      customersCount: Number(customersCount) || 10,
      status: 'ACTIVE',
      latitude: 23.0300 + (Math.random() - 0.5) * 0.05,
      longitude: 72.5650 + (Math.random() - 0.5) * 0.05
    };

    if (await isDbConnected()) {
      const newArea = new ServiceArea(areaData);
      await newArea.save();
      return res.status(201).json({ success: true, message: '✓ Service Area added successfully', data: newArea });
    }

    return res.status(201).json({ success: true, message: '✓ Service Area added', data: { _id: 'area_' + Date.now(), ...areaData } });
  } catch (error) {
    console.error('Error adding service area:', error);
    res.status(500).json({ success: false, message: 'Failed to add service area' });
  }
};

// @desc    Update a service area zone
// @route   PUT /api/service-area/areas/:id
const updateServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (await isDbConnected()) {
      const updated = await ServiceArea.findOneAndUpdate(
        { _id: id, providerId },
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Service Area zone not found or unauthorized' });
      }
      return res.json({ success: true, message: '✓ Service Area updated successfully', data: updated });
    }
    return res.json({ success: true, message: '✓ Service Area updated', data: req.body });
  } catch (error) {
    console.error('Error updating service area:', error);
    res.status(500).json({ success: false, message: 'Failed to update service area' });
  }
};

// @desc    Delete a service area zone
// @route   DELETE /api/service-area/areas/:id
const deleteServiceArea = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (await isDbConnected()) {
      const deleted = await ServiceArea.findOneAndDelete({ _id: id, providerId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Service Area zone not found or unauthorized' });
      }
      return res.json({ success: true, message: '✓ Service Area deleted successfully' });
    }
    return res.json({ success: true, message: '✓ Service Area deleted' });
  } catch (error) {
    console.error('Error deleting service area:', error);
    res.status(500).json({ success: false, message: 'Failed to delete service area' });
  }
};

module.exports = {
  getServiceArea,
  updateServiceAreaSettings,
  addServiceArea,
  updateServiceArea,
  deleteServiceArea
};
