const FAQ = require('../models/FAQ');
const FAQCategory = require('../models/FAQCategory');

// --- Categories ---

exports.getCategories = async (req, res) => {
  try {
    const categories = await FAQCategory.find();
    // Optional: Add count of FAQs per category
    const categoriesWithCount = await Promise.all(categories.map(async (cat) => {
      const count = await FAQ.countDocuments({ categoryId: cat._id });
      return { ...cat.toObject(), count };
    }));
    res.json(categoriesWithCount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const category = new FAQCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await FAQCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await FAQCategory.findByIdAndDelete(req.params.id);
    // Optional: Delete or reassign FAQs in this category
    await FAQ.deleteMany({ categoryId: req.params.id });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- FAQs ---

exports.getFAQs = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const query = categoryId && categoryId !== 'all' ? { categoryId } : {};
    const faqs = await FAQ.find(query).sort({ createdAt: -1 });
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createFAQ = async (req, res) => {
  try {
    const faq = new FAQ(req.body);
    await faq.save();
    res.status(201).json(faq);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateFAQ = async (req, res) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(faq);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteFAQ = async (req, res) => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
