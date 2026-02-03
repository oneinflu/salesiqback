const express = require('express');
const router = express.router ? express.Router() : express();
const { loginAdmin, registerAdmin, getMe } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

const expressRouter = express.Router();

expressRouter.post('/login', loginAdmin);
expressRouter.post('/register', registerAdmin);
expressRouter.get('/me', protect, getMe);

module.exports = expressRouter;
