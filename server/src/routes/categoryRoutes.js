const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../controllers/categoryController');

// Optional auth on GET so provider gets isolated categories, and customers can view public categories
router.get('/', (req, res, next) => {
  if (req.headers.authorization || req.cookies?.token || req.cookies?.tiffinlink_token) {
    return protect(req, res, next);
  }
  next();
}, getCategories);

router.post('/', protect, requireProvider, createCategory);
router.put('/:id', protect, requireProvider, updateCategory);
router.delete('/:id', protect, requireProvider, deleteCategory);

module.exports = router;
