const express = require('express');
const router = express.Router();
const { submitContact, getContactInquiries } = require('../controllers/contactController');

router.post('/', submitContact);
router.get('/', getContactInquiries);

module.exports = router;
