const express = require('express');
const router = express.Router();
const { 
  createCompanyAndWebsite, 
  getCompanies, 
  getCompanyWebsites 
} = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.post('/', createCompanyAndWebsite);
router.get('/', getCompanies);
router.get('/:id/websites', getCompanyWebsites);

module.exports = router;
