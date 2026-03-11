const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'multiple_choice', 'short_answer', 'long_answer', 'coding'],
    required: true
  },
  // MCQ specific
  options: [String],
  correctAnswer: String, // single answer
  correctAnswers: [String], // multiple answers

  // Coding specific
  language: String,
  initialCode: String,
  testCases: [{
    input: String,
    expectedOutput: String,
    isPublic: { type: Boolean, default: true }
  }],

  points: {
    type: Number,
    alias: 'marks',
    default: 1
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  avgTime: { type: Number, default: 0 }, // In seconds
  stdDev: { type: Number, default: 0 },
  submissionCount: { type: Number, default: 0 },
  // Smart Difficulty Learning
  difficultyIndex: { type: Number, default: 0.1 }, // 0 (Easy) to 1 (Hard)
  correctCount: { type: Number, default: 0 },
  totalAttempts: { type: Number, default: 0 }
});

const AssessmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: String,
  subject: String,
  instructorId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  passingScore: {
    type: Number,
    default: 70
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  totalMarks: Number,
  questions: [QuestionSchema],
  enrolledStudents: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  settings: {
    shuffleQuestions: { type: Boolean, default: false },
    proctoring: { type: Boolean, default: true },
    aiEvaluation: { type: Boolean, default: true }
  },
  tags: [String],
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total number of questions
AssessmentSchema.virtual('totalQuestions').get(function () {
  return this.questions ? this.questions.length : 0;
});

// Virtual for calculated total marks if not explicitly set
AssessmentSchema.virtual('calculatedTotalMarks').get(function () {
  return this.questions ? this.questions.reduce((sum, q) => sum + (q.points || 0), 0) : 0;
});

// Virtual for deadline (alias for expiresAt)
AssessmentSchema.virtual('deadline')
  .get(function () { return this.expiresAt; })
  .set(function (val) { this.expiresAt = val; });

// Pre-save hook to ensure totalMarks is calculated
AssessmentSchema.pre('save', async function () {
  if (this.totalMarks === undefined || this.totalMarks === null || this.totalMarks === 0) {
    if (this.questions && Array.isArray(this.questions) && this.questions.length > 0) {
      this.totalMarks = this.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
    }
  }
});

const Assessment = mongoose.model('Assessment', AssessmentSchema);

// --- Compatibility Wrappers ---

const createAssessment = async (data) => {
  return await Assessment.create(data);
};

const getAssessmentById = async (id) => {
  return await Assessment.findById(id).populate('instructorId', 'name email');
};

const listAssessments = async (filters = {}) => {
  return await Assessment.find(filters).sort('-createdAt');
};

const updateAssessment = async (id, updates) => {
  return await Assessment.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });
};

const deleteAssessment = async (id) => {
  return await Assessment.findByIdAndDelete(id);
};

const countAssessments = async (filters = {}) => {
  return await Assessment.countDocuments(filters);
};

const enrollStudents = async (id, studentIds) => {
  return await Assessment.findByIdAndUpdate(
    id,
    { $addToSet: { enrolledStudents: { $each: studentIds } } },
    { new: true }
  );
};

module.exports = {
  createAssessment,
  getAssessmentById,
  listAssessments,
  updateAssessment,
  deleteAssessment,
  countAssessments,
  enrollStudents,
  Assessment
};