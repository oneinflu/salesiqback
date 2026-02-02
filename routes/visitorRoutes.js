const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

// GET /api/visitors
router.get('/', visitorController.getAllVisitors);

// GET /api/visitors/:id
router.get('/:id', visitorController.getVisitor);

// GET /api/visitors/:id/sessions
router.get('/:id/sessions', visitorController.getVisitorSessions);

module.exports = router;
