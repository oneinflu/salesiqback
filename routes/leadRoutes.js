const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

// GET /api/leads
router.get('/', leadController.getAllLeads);

// POST /api/leads
router.post('/', leadController.createLead);

// PUT /api/leads/:id
router.put('/:id', leadController.updateLead);

module.exports = router;
