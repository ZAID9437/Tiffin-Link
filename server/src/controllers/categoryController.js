const Category = require('../models/Category');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

const defaultInitialCategories = [
  { name: 'Gujarati', description: 'Traditional home-style Gujarati meals', status: 'Active', image: '/assets/provider_1.png' },
  { name: 'Jain', description: 'Pure satvik meal options without onion & garlic', status: 'Active', image: '/assets/provider_3.png' },
  { name: 'Kathiyawadi', description: 'Spicy & flavorful traditional Kathiyawadi feast', status: 'Active', image: '/assets/provider_2.png' },
  { name: 'Panjabi', description: 'Rich North-Indian curry thalis prepared in pure butter', status: 'Active', image: '/assets/provider_4.png' },
  { name: 'South Indian', description: 'Dosa, Idli & Sambhar daily combos', status: 'Active', image: '/assets/food_south_indian.png' },
  { name: 'Fitness / Diet', description: 'High-protein salad & lean thali options', status: 'Active', image: '/assets/provider_5.png' }
];

// @desc    Get all categories from MongoDB
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    if (await isDbConnected()) {
      let categories = await Category.find().sort({ createdAt: -1 });
      if (categories.length === 0) {
        await Category.insertMany(defaultInitialCategories);
        categories = await Category.find().sort({ createdAt: -1 });
      }
      return res.json({ success: true, data: categories, source: 'database', databaseName: 'tiffinlink' });
    } else {
      return res.json({ success: true, data: defaultInitialCategories, source: 'in-memory' });
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// @desc    Create a new category in MongoDB
// @route   POST /api/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, status, image } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide category name' });
    }

    const catData = {
      name: name.trim(),
      description: description || 'Delicious home-cooked meal category.',
      status: status || 'Active',
      image: image || '/assets/provider_1.png'
    };

    if (await isDbConnected()) {
      const existing = await Category.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).json({ success: false, message: `Category "${name}" already exists` });
      }

      const newCategory = new Category(catData);
      await newCategory.save();
      return res.status(201).json({ 
        success: true, 
        message: 'Category stored successfully', 
        data: newCategory, 
        source: 'database' 
      });
    } else {
      return res.status(201).json({ 
        success: true, 
        message: 'Category created', 
        data: { _id: 'cat_' + Date.now(), ...catData }, 
        source: 'in-memory' 
      });
    }
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Failed to save category: ' + error.message });
  }
};

// @desc    Update a category in MongoDB
// @route   PUT /api/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (await isDbConnected()) {
      const updated = await Category.findByIdAndUpdate(id, req.body, { new: true });
      return res.json({ success: true, message: 'Category updated successfully', data: updated });
    }
    return res.json({ success: true, message: 'Category updated', data: req.body });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};

// @desc    Delete a category from MongoDB
// @route   DELETE /api/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    if (await isDbConnected()) {
      await Category.findByIdAndDelete(id);
      return res.json({ success: true, message: 'Category deleted successfully' });
    }
    return res.json({ success: true, message: 'Category deleted (in-memory)' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Failed to delete category' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
