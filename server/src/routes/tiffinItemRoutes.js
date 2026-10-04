const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const {
  getItemsByTiffin,
  createTiffinItem,
  updateTiffinItem,
  deleteTiffinItem,
  bulkSaveTiffinItems
} = require('../controllers/tiffinItemController');

// GET /api/tiffin-items?tiffinId=xxx — public read (for customer view)
router.get('/', (req, res, next) => {
  if (req.headers.authorization) return protect(req, res, next);
  next();
}, getItemsByTiffin);

// GET /api/tiffin-items/tiffin/:tiffinId — direct param route
router.get('/tiffin/:tiffinId', (req, res, next) => {
  req.query.tiffinId = req.params.tiffinId;
  if (req.headers.authorization) return protect(req, res, next);
  next();
}, getItemsByTiffin);

// POST /api/tiffin-items — create single item (provider only)
router.post('/', protect, requireProvider, createTiffinItem);

// POST /api/tiffin-items/bulk — bulk save all items for a tiffin
router.post('/bulk', protect, requireProvider, bulkSaveTiffinItems);

// PUT /api/tiffin-items/:id — update item
router.put('/:id', protect, requireProvider, updateTiffinItem);

// DELETE /api/tiffin-items/:id — soft-delete item
router.delete('/:id', protect, requireProvider, deleteTiffinItem);

module.exports = router;
