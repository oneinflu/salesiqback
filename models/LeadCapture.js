const mongoose = require('mongoose');

const leadCaptureSchema = new mongoose.Schema({
  websiteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Website',
    required: false, // Optional for manual leads or if not tied to a website
    index: true
  },
  chatId: {
    type: String,
    required: false, // Not required if manually added
    index: true
  },
  sessionId: {
    type: String,
    required: false,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: String,
  phone: String,
  company: String,
  role: String,
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'customer', 'lost'],
    default: 'new'
  },
  source: {
    type: String,
    enum: ['website', 'linkedin', 'referral', 'manual'],
    default: 'website'
  },
  notes: String,
  lastContacted: Date,
  capturedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('LeadCapture', leadCaptureSchema);
