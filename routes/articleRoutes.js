const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Categories
router.get('/categories', articleController.getCategories);
router.post('/categories', articleController.createCategory);
router.put('/categories/:id', articleController.updateCategory);
router.delete('/categories/:id', articleController.deleteCategory);

// Articles
router.get('/', articleController.getArticles);
router.post('/', articleController.createArticle);
router.put('/:id', articleController.updateArticle);
router.delete('/:id', articleController.deleteArticle);

module.exports = router;
