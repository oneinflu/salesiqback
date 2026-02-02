const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');

// Categories
router.get('/categories', faqController.getCategories);
router.post('/categories', faqController.createCategory);
router.put('/categories/:id', faqController.updateCategory);
router.delete('/categories/:id', faqController.deleteCategory);

// FAQs
router.get('/', faqController.getFAQs);
router.post('/', faqController.createFAQ);
router.put('/:id', faqController.updateFAQ);
router.delete('/:id', faqController.deleteFAQ);

module.exports = router;
