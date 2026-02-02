const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true // Markdown or HTML
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ArticleCategory',
    required: true
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'draft'
  },
  author: {
    type: String, // Could be a User ref in future, string for now
    default: 'System'
  },
  readTime: {
    type: String,
    default: '5 min read'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  publishDate: {
    type: Date
  }
});

module.exports = mongoose.model('Article', articleSchema);
