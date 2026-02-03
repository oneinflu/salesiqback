const express = require('express');
const router = express.router ? express.Router() : express();
const { loginAdmin, registerAdmin } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

const expressRouter = express.Router();

expressRouter.post('/login', loginAdmin);
expressRouter.post('/register', registerAdmin); // Can be protected if needed: protect, registerAdmin

module.exports = expressRouter;
