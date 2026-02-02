const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  sessionId: {
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
  companyId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    index: true
  },
  closedAt: {
    type: Date
  }
}, { timestamps: true });

// Compound index for active chats by company
chatSchema.index({ companyId: 1, status: 1 });

module.exports = mongoose.model('Chat', chatSchema);
