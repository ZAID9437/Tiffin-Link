const express = require('express');
const router = express.Router();
const { protect, requireProvider } = require('../middleware/authMiddleware');
const { getTiffins, createTiffin, updateTiffin, deleteTiffin } = require('../controllers/tiffinController');

router.get('/', (req, res, next) => {
  // Optional auth: if header present, run protect to extract providerId if present
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
}, getTiffins);

router.post('/', protect, requireProvider, createTiffin);
router.put('/:id', protect, requireProvider, updateTiffin);
router.delete('/:id', protect, requireProvider, deleteTiffin);

module.exports = router;
