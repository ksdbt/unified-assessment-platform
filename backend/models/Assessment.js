const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mcq', 'multiple_choice', 'short_answer', 'long_answer'],
    required: true
  },
  question: { type: String, required: true },
  options: [String],
  correctAnswer: String,
  correctAnswers: [String],
  points: { type: Number, required: true, min: 1 }
});

const assessmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  subject: { type: String, required: true },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instructorName: { type: String, required: true },
  type: {
    type: String,
    enum: ['quiz', 'exam', 'assignment'],
    required: true
  },
  duration: { type: Number, required: true, min: 1 },
  totalQuestions: { type: Number, default: 0 },
  passingScore: { type: Number, required: true, min: 0, max: 100 },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'flagged'],
    default: 'draft'
  },
  scheduledDate: Date,
  deadline: Date,
  questions: [questionSchema],
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [String]
}, {
  timestamps: true
});

// Auto-calculate totalQuestions before save
assessmentSchema.pre('save', function(next) {
  this.totalQuestions = this.questions.length;
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);