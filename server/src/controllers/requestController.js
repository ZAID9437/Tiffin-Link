const mongoose = require('mongoose');
const MealRequest = require('../models/MealRequest');
const { ensureConnected } = require('../config/db');

const localRequests = [];
const isDbConnected = async () => await ensureConnected();

// @desc    Create a meal request
// @route   POST /api/requests
const createRequest = async (req, res) => {
  try {
    const { customerName, customerPhone, mealType, quantity, date, time, deliveryType, location, distance, budget } = req.body;
    
    if (!mealType || !budget) {
      return res.status(400).json({ success: false, message: 'Please provide mealType and budget' });
    }

    const reqData = {
      customerName: customerName || 'Customer',
      customerPhone: customerPhone || '+91 98765 43210',
      mealType,
      quantity: Number(quantity) || 1,
      date: date || 'Today',
      time: time || '5:00 PM',
      deliveryType: deliveryType || 'Delivery',
      location: location || 'Satellite, Ahmedabad',
      distance: distance || '1.8 km',
      budget: Number(budget),
      status: 'pending',
      createdAt: new Date()
    };

    if (await isDbConnected()) {
      const newRequest = new MealRequest(reqData);
      await newRequest.save();
      return res.status(201).json({ success: true, data: newRequest, source: 'database' });
    } else {
      const mockRequest = {
        _id: 'mr_' + Math.random().toString(36).substr(2, 9),
        ...reqData
      };
      localRequests.push(mockRequest);
      return res.status(201).json({ success: true, data: mockRequest, source: 'in-memory' });
    }
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all pending meal requests
// @route   GET /api/requests
const getRequests = async (req, res) => {
  try {
    if (await isDbConnected()) {
      const requests = await MealRequest.find({ status: 'pending' }).sort({ createdAt: -1 });
      return res.json({ success: true, data: requests, source: 'database' });
    } else {
      const pending = localRequests.filter(r => r.status === 'pending');
      return res.json({ success: true, data: [...pending].reverse(), source: 'in-memory' });
    }
  } catch (error) {
    console.error('Error getting requests:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update request status (accept/decline)
// @route   PUT /api/requests/:id
const updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (await isDbConnected()) {
      const updated = await MealRequest.findByIdAndUpdate(id, { status }, { new: true });
      return res.json({ success: true, data: updated });
    } else {
      const idx = localRequests.findIndex(r => r._id === id);
      if (idx !== -1) {
        localRequests[idx].status = status;
        return res.json({ success: true, data: localRequests[idx] });
      }
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete meal request
// @route   DELETE /api/requests/:id
const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (await isDbConnected()) {
      await MealRequest.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Request deleted' });
    } else {
      const idx = localRequests.findIndex(r => r._id === id);
      if (idx !== -1) {
        localRequests.splice(idx, 1);
      }
      return res.json({ success: true, message: 'Request deleted' });
    }
  } catch (error) {
    console.error('Error deleting request:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createRequest,
  getRequests,
  updateRequest,
  deleteRequest
};
