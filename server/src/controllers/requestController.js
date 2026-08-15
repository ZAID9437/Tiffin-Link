const mongoose = require('mongoose');
const MealRequest = require('../models/MealRequest');
const { ensureConnected } = require('../config/db');

const localRequests = [];
const isDbConnected = async () => await ensureConnected();

// @desc    Create a meal request
// @route   POST /api/requests
const createRequest = async (req, res) => {
  try {
    const { mealType, date, time, deliveryType, location, budget } = req.body;
    
    if (!mealType || !date || !time || !deliveryType || !location || !budget) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    if (await isDbConnected()) {
      const newRequest = new MealRequest({
        mealType,
        date,
        time,
        deliveryType,
        location,
        budget
      });
      await newRequest.save();
      return res.status(201).json({ success: true, data: newRequest, source: 'database' });
    } else {
      const mockRequest = {
        _id: 'mr_' + Math.random().toString(36).substr(2, 9),
        mealType,
        date,
        time,
        deliveryType,
        location,
        budget: Number(budget),
        createdAt: new Date()
      };
      localRequests.push(mockRequest);
      return res.status(201).json({ success: true, data: mockRequest, source: 'in-memory' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all meal requests
// @route   GET /api/requests
const getRequests = async (req, res) => {
  try {
    if (await isDbConnected()) {
      const requests = await MealRequest.find().sort({ createdAt: -1 });
      return res.json({ success: true, data: requests, source: 'database' });
    } else {
      return res.json({ success: true, data: [...localRequests].reverse(), source: 'in-memory' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  createRequest,
  getRequests
};
