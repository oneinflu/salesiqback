const Article = require('../models/Article');
const ArticleCategory = require('../models/ArticleCategory');

// --- Categories ---

exports.getCategories = async (req, res) => {
  try {
    const categories = await ArticleCategory.find();
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const count = await Article.countDocuments({ categoryId: cat._id });
      return { ...cat.toObject(), count };
    }));
    res.json(categoriesWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = new ArticleCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await ArticleCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await ArticleCategory.findByIdAndDelete(req.params.id);
    await Article.deleteMany({ categoryId: req.params.id });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- Articles ---

exports.getArticles = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const query = categoryId && categoryId !== 'all' ? { categoryId } : {};
    const articles = await Article.find(query).sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createArticle = async (req, res) => {
  try {
    const article = new Article(req.body);
    await article.save();
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateArticle = async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(article);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteArticle = async (req, res) => {
  try {
    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
