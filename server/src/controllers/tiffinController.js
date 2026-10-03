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

const Review = require('../models/Review');

// @desc    Get tiffins from MongoDB (provider-scoped or public) with live ratings
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
      const tiffins = await Tiffin.find(query).sort({ createdAt: -1 }).lean();

      // Batch fetch reviews in a single query to eliminate N+1 database queries
      const allReviews = providerId
        ? await Review.find({ providerId }).select('tiffinId tiffinName rating').lean()
        : [];

      const reviewMap = {};
      allReviews.forEach(r => {
        const key = r.tiffinId || r.tiffinName;
        if (key) {
          if (!reviewMap[key]) reviewMap[key] = { sum: 0, count: 0 };
          reviewMap[key].sum += Number(r.rating) || 5;
          reviewMap[key].count += 1;
        }
      });

      const enrichedTiffins = tiffins.map(t => {
        const keyId = t._id.toString();
        const keyName = t.name;
        const revData = reviewMap[keyId] || reviewMap[keyName];

        if (revData && revData.count > 0) {
          return {
            ...t,
            rating: Number((revData.sum / revData.count).toFixed(1)),
            reviewCount: revData.count
          };
        }
        return {
          ...t,
          rating: t.rating || 0,
          reviewCount: t.reviewCount || 0
        };
      });

      return res.json({ success: true, data: enrichedTiffins, source: 'database', databaseName: 'tiffinlink' });
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

    const { name, description, price, category, foodType, mealType, capacity, days, area, ingredients, items, image, status, startTime, endTime, orderCutoff, monthlyPrice, weeklyPrice, isSubscriptionOnly } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide tiffin name' });
    }

    const tiffinData = {
      providerId,
      name: name.trim(),
      description: description || 'Authentic home-cooked thali prepared daily.',
      price: price !== undefined && price !== '' ? Number(price) : (monthlyPrice ? Math.round(Number(monthlyPrice) / 26) : 140),
      monthlyPrice: monthlyPrice ? Number(monthlyPrice) : 3640,
      weeklyPrice: weeklyPrice ? Number(weeklyPrice) : 899,
      isSubscriptionOnly: isSubscriptionOnly !== undefined ? Boolean(isSubscriptionOnly) : true,
      category: category || 'Gujarati',
      foodType: foodType || 'Veg',
      mealType: mealType || 'Lunch',
      startTime: startTime || '12:00 PM',
      endTime: endTime || '02:00 PM',
      orderCutoff: orderCutoff || '10:00 AM',
      capacity: Number(capacity) || 40,
      available: Number(capacity) || 40,
      days: Array.isArray(days) ? days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      area: area || 'All Localities',
      ingredients: ingredients || 'Fresh veggies, Whole wheat flour, Ghee',
      items: Array.isArray(items) ? items : [],
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
