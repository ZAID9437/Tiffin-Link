const Tiffin = require('../models/Tiffin');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const defaultInitialTiffins = [
  {
    name: 'Gujarati Home Thali',
    description: 'Authentic Kathiyawadi style thali with 2 sabzi, 4 rotis, dal, rice, buttermilk & sweet.',
    price: 120,
    category: 'Gujarati',
    foodType: 'Veg',
    capacity: 30,
    available: 24,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    area: 'Navrangpura, Satellite, Vastrapur',
    ingredients: 'Paneer, Bhindi, Wheat Flour, Tuver Dal, Desi Ghee',
    ordersToday: 24,
    rating: 4.9,
    status: 'Active',
    image: '/assets/provider_1.png'
  },
  {
    name: 'Jain Special Thali',
    description: 'Pure Jain preparation without onion, garlic, or root vegetables cooked in ghee.',
    price: 140,
    category: 'Jain',
    foodType: 'Jain',
    capacity: 20,
    available: 20,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    area: 'Paldi, Vasna, Ellisbridge',
    ingredients: 'Paneer, Dudhi, Wheat Flour, Moong Dal, Pure Ghee',
    ordersToday: 20,
    rating: 4.8,
    status: 'Sold Out',
    image: '/assets/provider_3.png'
  },
  {
    name: 'Kathiyawadi Special Combo',
    description: 'Baingan bharta, sev tamatar, bajra rotla with fresh butter and jaggery.',
    price: 150,
    category: 'Kathiyawadi',
    foodType: 'Veg',
    capacity: 25,
    available: 12,
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    area: 'SG Highway, Prahlad Nagar',
    ingredients: 'Eggplant, Bajra, Sev, Garlic, Pure Ghee',
    ordersToday: 13,
    rating: 4.7,
    status: 'Paused',
    image: '/assets/provider_2.png'
  }
];

// @desc    Get tiffins from MongoDB (provider-scoped or public)
// @route   GET /api/tiffins
const getTiffins = async (req, res) => {
  try {
    const providerId = req.providerId || req.query.providerId;
    let query = {};
    if (providerId) {
      query.providerId = providerId;
    } else {
      query.status = 'Active';
    }

    if (await isDbConnected()) {
      const tiffins = await Tiffin.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, data: tiffins, source: 'database', databaseName: 'tiffinlink' });
    } else {
      return res.json({ success: true, data: [], source: 'in-memory' });
    }
  } catch (error) {
    console.error('Error fetching tiffins:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create a new tiffin in MongoDB
// @route   POST /api/tiffins
const createTiffin = async (req, res) => {
  try {
    const providerId = req.providerId;
    if (!providerId) {
      return res.status(403).json({ success: false, message: 'Provider authorization required' });
    }

    const { name, description, price, category, foodType, capacity, days, area, ingredients, image, status } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Please provide tiffin name and price' });
    }

    const tiffinData = {
      providerId,
      name: name.trim(),
      description: description || 'Authentic home-cooked thali prepared daily.',
      price: Number(price),
      category: category || 'Gujarati',
      foodType: foodType || 'Veg',
      capacity: Number(capacity) || 30,
      available: Number(capacity) || 30,
      days: Array.isArray(days) ? days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      area: area || 'All Localities',
      ingredients: ingredients || 'Fresh veggies, Whole wheat flour, Ghee',
      ordersToday: 0,
      rating: 4.8,
      status: status || 'Active',
      image: image || '/assets/provider_4.png'
    };

    if (await isDbConnected()) {
      const newTiffin = new Tiffin(tiffinData);
      await newTiffin.save();
      return res.status(201).json({ 
        success: true, 
        message: 'Tiffin stored successfully in MongoDB', 
        data: newTiffin, 
        source: 'database' 
      });
    } else {
      return res.status(201).json({ 
        success: true, 
        message: 'Tiffin created (in-memory)', 
        data: { _id: 'tif_' + Date.now(), ...tiffinData }, 
        source: 'in-memory' 
      });
    }
  } catch (error) {
    console.error('Error creating tiffin:', error);
    res.status(500).json({ success: false, message: 'Failed to save tiffin to MongoDB: ' + error.message });
  }
};

// @desc    Update a tiffin in MongoDB
// @route   PUT /api/tiffins/:id
const updateTiffin = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (await isDbConnected()) {
      const updated = await Tiffin.findOneAndUpdate({ _id: id, providerId }, req.body, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Tiffin not found or unauthorized' });
      }
      return res.json({ success: true, message: 'Tiffin updated in MongoDB', data: updated });
    }
    return res.json({ success: true, message: 'Tiffin updated (in-memory)', data: req.body });
  } catch (error) {
    console.error('Error updating tiffin:', error);
    res.status(500).json({ success: false, message: 'Failed to update tiffin' });
  }
};

// @desc    Delete a tiffin from MongoDB
// @route   DELETE /api/tiffins/:id
const deleteTiffin = async (req, res) => {
  try {
    const { id } = req.params;
    const providerId = req.providerId;
    if (await isDbConnected()) {
      const deleted = await Tiffin.findOneAndDelete({ _id: id, providerId });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Tiffin not found or unauthorized' });
      }
      return res.json({ success: true, message: 'Tiffin deleted from MongoDB' });
    }
    return res.json({ success: true, message: 'Tiffin deleted (in-memory)' });
  } catch (error) {
    console.error('Error deleting tiffin:', error);
    res.status(500).json({ success: false, message: 'Failed to delete tiffin' });
  }
};

module.exports = {
  getTiffins,
  createTiffin,
  updateTiffin,
  deleteTiffin
};
