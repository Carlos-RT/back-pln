import OpenAI from 'openai';
import QuizResult from '../models/QuizResult.js';
import dotenv from 'dotenv';

dotenv.config();

// Configurar OpenAI
let openai;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno OPENAI_API_KEY no está definida');
  }

  openai = new OpenAI({ apiKey });
  console.log('✅ OpenAI configurado correctamente');
} catch (error) {
  console.error('Error al inicializar OpenAI:', error);
}

// Generar preguntas del quiz
export const generateQuiz = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'El tema es requerido' });
    }

    if (!openai) {
      return res.status(500).json({
        error: 'No se ha configurado correctamente la API de OpenAI',
        message: 'Error interno del servidor al configurar OpenAI',
      });
    }

    // Generar preguntas con OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente que genera 5 preguntas de opción múltiple sobre un tema específico. Cada pregunta debe tener 4 opciones (A, B, C, D) y debe especificarse claramente cuál es la respuesta correcta en una línea separada con el formato "Respuesta correcta: X".',
        },
        {
          role: 'user',
          content: `Genera 5 preguntas de opción múltiple sobre ${topic}. 
Cada pregunta debe seguir este formato:

Pregunta: ¿Ejemplo?
A. Opción A
B. Opción B
C. Opción C
D. Opción D
Respuesta correcta: C

Haz lo mismo para todas las preguntas.`,
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    console.log('Respuesta de OpenAI:\n', response); // 👈 esta línea nueva
    const questions = parseQuizResponse(response);

    res.json({ questions });
  } catch (error) {
    console.error('Error al generar las preguntas:', error);
    res.status(500).json({
      error: 'Error al generar las preguntas',
      details: error.message,
    });
  }
};

// Nuevo parser que lee la respuesta correcta explícitamente
const parseQuizResponse = (response) => {
  const questions = [];
  const blocks = response.split(/\n(?=Pregunta \d+:)/g); // separa por "Pregunta X:"

  blocks.forEach((block) => {
    const lines = block.trim().split('\n').filter(Boolean);
    if (lines.length < 6) return; // aseguramos que tenga lo necesario

    const questionMatch = lines[0].match(/^Pregunta \d+: (.+)/);
    const correctMatch = lines.find(line => line.startsWith('Respuesta correcta:'));

    if (!questionMatch || !correctMatch) return;

    const questionText = questionMatch[1].trim();

    const options = lines.slice(1, 5).map(line => {
      const match = line.match(/^[A-D]\.\s*(.+)/);
      return match ? match[1].trim() : null;
    }).filter(Boolean);

    const correctLetter = correctMatch.split(':')[1].trim().toUpperCase();
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
    const correctOption = options[correctIndex];

    if (questionText && options.length === 4 && correctOption) {
      questions.push({
        question: questionText,
        options,
        correct: correctOption,
      });
    }
  });

  return questions;
};

// Guardar los resultados del quiz
export const saveQuizResult = async (req, res) => {
  try {
    const { topic, score, total, correct, answers } = req.body;

    if (!topic || score === undefined || total === undefined || correct === undefined || !answers) {
      return res.status(400).json({ error: 'Faltan datos en el resultado del quiz' });
    }

    const quizResult = new QuizResult({
      topic,
      score,
      total,
      correct,
      answers,
    });

    await quizResult.save();

    res.json({ message: 'Resultado guardado exitosamente' });
  } catch (error) {
    console.error('Error al guardar el resultado:', error);
    res.status(500).json({ error: 'Error al guardar el resultado del quiz' });
  }
};
