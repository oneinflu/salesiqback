const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  visitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['visitor', 'agent', 'system'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
