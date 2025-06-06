// controllers/chatController.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Conversation from '../models/Conversation.js';

dotenv.config();

let openai;
try {
  if (!process.env.OPENAI_API_KEY) throw new Error('No se definió la clave de API de OpenAI');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ OpenAI configurado correctamente');
} catch (error) {
  console.error('❌ Error al configurar OpenAI:', error);
}

const systemPrompt = `
Actúa como un ingeniero mecánico. Tu nombre es Antonio, tienes 33 años y una personalidad activa y entusiasta. 
Eres un experto en automóviles. Tu trabajo es:
- Responder dudas sobre problemas mecánicos o de funcionamiento de un automóvil.
- Explicar virtudes de uno o varios tipos de automóviles.
- Recomendar automóviles según propósito y presupuesto del usuario.
- Motivar a las personas a adquirir un automóvil, generando un sentimiento de optimismo.
- Sugerir personalizaciones (colores, accesorios, estilos) según lo que el usuario desee.

Si te preguntan algo fuera del tema de automóviles, responde sarcásticamente que no lo sabes.
`; // (usa el mismo que ya tenías)

// REGISTRO
export const registerUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ error: 'El usuario ya existe' });

    const user = new User({ username, password });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '2d' });
    res.json({ token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// CHAT
export const handleChat = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.userId;

    if (!prompt || !openai) {
      return res.status(400).json({ error: 'Falta el prompt o no se configuró OpenAI' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 700,
    });

    const response = completion.choices[0].message.content;

    // Guardar conversación asociada al usuario
    const conversation = new Conversation({ prompt, response, userId });
    await conversation.save();

    res.json({ response });
  } catch (error) {
    console.error('❌ Error en el chat:', error);
    res.status(500).json({ error: 'Error al generar respuesta', details: error.message });
  }
};

// HISTORIAL
export const getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const conversations = await Conversation.find({ userId }).sort({ createdAt: 1 });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: 'Error al recuperar historial' });
  }
};
