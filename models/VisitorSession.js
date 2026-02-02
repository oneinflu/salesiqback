const mongoose = require('mongoose');

const visitorSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  companyId: {
    type: String,
    required: true,
    index: true
  },
  websiteId: {
    type: String
  },
  visitorId: {
    type: String,
    required: true,
    index: true
  },
  ipAddress: String,
  country: String,
  city: String,
  region: String,
  device: String,
  browser: String,
  os: String,
  pageUrl: String,
  sessionStart: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true // Useful for querying active sessions
  }
}, { timestamps: true });

// Compound index for finding active sessions by company
visitorSessionSchema.index({ companyId: 1, isActive: 1 });

module.exports = mongoose.model('VisitorSession', visitorSessionSchema);
