import express from 'express';
import { generateQuiz, saveQuizResult } from '../controllers/quizController.js';

const router = express.Router();

// Ruta para obtener las preguntas del quiz
router.post('/', generateQuiz);

// Ruta para guardar los resultados del quiz
router.post('/results', saveQuizResult);

export { router };
