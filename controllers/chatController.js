const Message = require('../models/Message');
const Chat = require('../models/Chat');
const Visitor = require('../models/Visitor'); // Added Visitor model

// Get chat history for a visitor
exports.getHistory = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const messages = await Message.find({ visitorId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all chats (for admin "My Chats" page)
exports.getAllChats = async (req, res) => {
  try {
    const { status } = req.query;
    
    // Build query
    let query = {};
    if (status) {
      if (status === 'active') query.status = 'open';
      else if (status === 'closed') query.status = 'closed';
    }

    const chats = await Chat.find(query)
      .populate('visitorId')
      .sort({ updatedAt: -1 })
      .lean();

    // Enrich with last message and unread count
    const enrichedChats = await Promise.all(chats.map(async (chat) => {
      if (!chat.visitorId) return chat; // Safety check

      const lastMessage = await Message.findOne({ visitorId: chat.visitorId._id })
        .sort({ createdAt: -1 });
      
      const unreadCount = await Message.countDocuments({
        visitorId: chat.visitorId._id,
        sender: 'visitor',
        read: false
      });

      return {
        ...chat,
        lastMessage: lastMessage ? lastMessage.text : '',
        lastMessageAt: lastMessage ? lastMessage.createdAt : chat.updatedAt,
        unreadCount
      };
    }));

    res.json(enrichedChats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Send a message (Agent)
exports.sendMessage = async (req, res) => {
  try {
    const { visitorId } = req.params;
    const { text, sender } = req.body; // sender should be 'agent'

    // Verify visitor exists
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    const message = new Message({
      companyId: visitor.companyId,
      visitorId,
      sender: sender || 'agent',
      text
    });

    await message.save();
    
    // Emit real-time event to visitor and agents
    const io = req.app.get('socketio');
    if (io) {
        io.to(`visitor:${visitorId}`).emit('new-message', message);
        io.to(`company:${visitor.companyId}`).emit('new-message', message);
    }
    
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Chat Status
exports.updateChatStatus = async (req, res) => {
  try {
    const { chatId } = req.params; // This is the _id or chatId? Route param usually maps to _id unless specified
    const { status } = req.body;

    const chat = await Chat.findOneAndUpdate(
        { chatId: chatId }, // Using custom chatId field or _id depending on frontend
        { status }, 
        { new: true }
    );
    
    if (!chat) {
        // Try finding by _id if chatId fail
        const chatById = await Chat.findByIdAndUpdate(chatId, { status }, { new: true });
        if (!chatById) return res.status(404).json({ error: 'Chat not found' });
        return res.json(chatById);
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
