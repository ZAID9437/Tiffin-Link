const express = require('express');
const router = express.Router();
const { getTiffins, createTiffin, updateTiffin, deleteTiffin } = require('../controllers/tiffinController');

router.get('/', getTiffins);
router.post('/', createTiffin);
router.put('/:id', updateTiffin);
router.delete('/:id', deleteTiffin);

module.exports = router;
