// routes/chatRoutes.js
import express from 'express';
import {
  registerUser,
  loginUser,
  handleChat,
  getHistory
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Auth
router.post('/register', registerUser);
router.post('/login', loginUser);

// Chat
router.post('/', authenticate, handleChat);
router.get('/history', authenticate, getHistory);

export { router };
