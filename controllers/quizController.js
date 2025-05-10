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
            'Eres un asistente que genera 5 preguntas de opción múltiple sobre un tema específico. Las preguntas deben ser claras y con 4 opciones de respuesta, incluyendo una opción correcta.',
        },
        {
          role: 'user',
          content: `Genera 5 preguntas de opción múltiple sobre ${topic}. Cada pregunta debe tener 4 opciones de respuesta, de las cuales una debe ser correcta. Debes analizar la informacion para que puedas establecer la respuesta correcta, no solamente marcar cualquier respuesta como correcta.`,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // Aquí procesamos la respuesta para obtener las preguntas y opciones
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

// Función para procesar la respuesta y generar preguntas
const parseQuizResponse = (response) => {
  const questions = [];
  const questionBlocks = response.split('\n\n'); // Separar por bloques de pregunta

  questionBlocks.forEach((block) => {
    const lines = block.split('\n');
    if (lines.length >= 5) {
      const question = lines[0].replace('Pregunta:', '').trim();
      const options = lines.slice(1, 5).map((line) => line.replace('Opción:', '').trim());
      const correct = options[0]; // Suponemos que la primera opción es la correcta (esto puede ajustarse)
      
      questions.push({ question, options, correct });
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
