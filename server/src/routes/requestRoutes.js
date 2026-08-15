const express = require('express');
const router = express.Router();
const { createRequest, getRequests } = require('../controllers/requestController');

router.post('/', createRequest);
router.get('/', getRequests);

module.exports = router;
