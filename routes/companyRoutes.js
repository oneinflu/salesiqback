const express = require('express');
const router = express.Router();
const { 
  createCompanyAndWebsite, 
  getCompanies, 
  getCompanyById,
  getCompanyWebsites,
  getWidgetConfig
} = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/widget-config', getWidgetConfig);

// Protected routes
router.use(protect);

router.post('/', createCompanyAndWebsite);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.get('/:id/websites', getCompanyWebsites);

module.exports = router;
