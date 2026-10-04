const Category = require('../models/Category');
const { ensureConnected } = require('../config/db');

const isDbConnected = async () => await ensureConnected();

// @desc    Get all categories from MongoDB
// @route   GET /api/categories
const getCategories = async (req, res) => {
  try {
    const providerId = req.providerId || req.query.providerId || (req.user && req.user.id);
    if (await isDbConnected()) {
      let query = {};
      if (providerId) {
        // Query categories belonging to this provider or default unassigned categories
        query = {
          $or: [
            { providerId: String(providerId) },
            { providerId: null },
            { providerId: { $exists: false } }
          ]
        };
      }
      const categories = await Category.find(query).sort({ createdAt: -1 });
      return res.json({ success: true, data: categories, source: 'database', databaseName: 'tiffinlink' });
    } else {
      return res.json({ success: true, data: [], source: 'in-memory' });
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
    const providerId = req.providerId || (req.user && req.user.id) || req.body.providerId;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide category name' });
    }

    const catData = {
      name: name.trim(),
      description: description || '',
      status: status || 'Active',
      image: image || '',
      providerId: providerId ? String(providerId) : undefined
    };

    if (await isDbConnected()) {
      const existingQuery = { 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
      };
      if (providerId) {
        existingQuery.providerId = String(providerId);
      }
      const existing = await Category.findOne(existingQuery);
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
    const providerId = req.providerId || (req.user && req.user.id);
    
    if (await isDbConnected()) {
      const filter = { _id: id };
      if (providerId) {
        // Enforce provider ownership if category has a providerId
        filter.$or = [
          { providerId: String(providerId) },
          { providerId: null },
          { providerId: { $exists: false } }
        ];
      }
      const updated = await Category.findOneAndUpdate(filter, req.body, { new: true });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
      }
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
    const providerId = req.providerId || (req.user && req.user.id);
    
    if (await isDbConnected()) {
      const filter = { _id: id };
      if (providerId) {
        filter.$or = [
          { providerId: String(providerId) },
          { providerId: null },
          { providerId: { $exists: false } }
        ];
      }
      const deleted = await Category.findOneAndDelete(filter);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Category not found or unauthorized' });
      }
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
