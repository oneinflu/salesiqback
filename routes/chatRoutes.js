const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// GET /api/chats/history/:visitorId
router.get('/history/:visitorId', chatController.getHistory);

// POST /api/chats/:visitorId/message
router.post('/:visitorId/message', chatController.sendMessage);

// PUT /api/chats/:chatId/status
router.put('/:chatId/status', chatController.updateChatStatus);

// GET /api/chats (All chats)
router.get('/', chatController.getAllChats);

module.exports = router;
