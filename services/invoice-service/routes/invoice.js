const express = require('express');
const router = express.Router();
const { getInvoice } = require('../controllers/invoice');

// GET invoice for a deceased person
router.get('/invoice/:deceasedId', getInvoice);

module.exports = router;
