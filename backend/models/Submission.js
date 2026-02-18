const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId },
  type: String,
  answer: mongoose.Schema.Types.Mixed,
  isCorrect: { type: Boolean, default: null },
  points: { type: Number, default: 0 },
  feedback: { type: String, default: null }
});

const submissionSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'evaluated'],
    default: 'pending'
  },
  totalScore: { type: Number, default: null },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, default: null },
  timeTaken: { type: Number, default: null },
  answers: [answerSchema],
  instructorFeedback: { type: String, default: null },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  evaluatedAt: { type: Date, default: null },
  submittedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);