const mongoose = require('mongoose');

const websiteSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  widgetConfig: {
    primaryColor: String,
    position: {
      type: String,
      enum: ['left', 'right'],
      default: 'right'
    }
  },
  webhookUrl: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Website', websiteSchema);
