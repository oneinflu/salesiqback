const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  socketId: {
    type: String
  },
  name: String,
  email: String,
  phone: String,
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  currentPage: String,
  lastSeen: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ip: String,
  location: {
    country: String,
    city: String,
    region: String,
    timezone: String
  },
  device: {
    type: { type: String }, // e.g. mobile, tablet, desktop
    browser: String,
    os: String
  },
  // Session tracking
  currentSessionStart: {
    type: Date,
    default: Date.now
  },
  totalDurationSeconds: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Visitor', visitorSchema);
