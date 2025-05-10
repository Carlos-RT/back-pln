import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  correct: {
    type: Number,
    required: true,
  },
  answers: [
    {
      question: String,
      selected: String,
      correct: String,
      isCorrect: Boolean,
      options: [String],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

export default QuizResult;