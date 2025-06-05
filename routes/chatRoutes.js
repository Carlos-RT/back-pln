import express from 'express';
import { handleChat } from '../controllers/chatController.js';

const router = express.Router();

// Ruta para conversar con Antonio
router.post('/', handleChat);

export { router };