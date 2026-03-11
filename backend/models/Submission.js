const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assessmentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Assessment',
    required: true
  },
  studentId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: String,
  status: {
    type: String,
    enum: ['pending', 'evaluated', 'flagged'],
    default: 'pending'
  },
  answers: [{
    questionId: String,
    questionText: String,
    answer: mongoose.Schema.Types.Mixed,
    correctAnswer: mongoose.Schema.Types.Mixed,
    isCorrect: Boolean,
    points: {
      type: Number,
      alias: 'marksObtained'
    },
    feedback: String
  }],
  totalScore: {
    type: Number,
    default: 0
  },
  maxScore: Number,
  percentage: Number,
  timeTaken: Number, // in seconds

  // Anomaly Detection
  trustScore: {
    type: Number,
    default: 100
  },
  riskScore: {
    type: Number,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Low'
  },
  behaviorLogs: [{
    event: String,
    timestamp: { type: Date, default: Date.now },
    details: String
  }],
  anomalyMetrics: {
    tabSwitches: { type: Number, default: 0 },
    copyPastes: { type: Number, default: 0 },
    timeDeviation: { type: Number, default: 0 },
    ipChanges: { type: Number, default: 0 },
    questionTimes: { type: Map, of: Number }, // Track time per question
    keystrokeDynamics: { type: Array, default: [] },
    fingerprint: String
  },
  examDNA: String, // Behavioral Signature

  instructorFeedback: String,
  evaluatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  evaluatedAt: Date,
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Gap Analysis 1: Optimized Database Indexing
SubmissionSchema.index({ assessmentId: 1, submittedAt: -1 });
SubmissionSchema.index({ studentId: 1, submittedAt: -1 });
SubmissionSchema.index({ status: 1 });
SubmissionSchema.index({ riskScore: -1 });
SubmissionSchema.index({ 'anomalyMetrics.fingerprint': 1 }); // For collusion detection

const Submission = mongoose.model('Submission', SubmissionSchema);

// --- Compatibility Wrappers ---

const createSubmission = async (data) => {
  return await Submission.create(data);
};

const getSubmissionById = async (id) => {
  return await Submission.findById(id)
    .populate('assessmentId', 'title totalMarks')
    .populate('studentId', 'name email');
};

const listSubmissions = async (filters = {}) => {
  // Support for legacy array filters
  const query = {};
  if (filters.studentId) query.studentId = filters.studentId;
  if (filters.assessmentId) query.assessmentId = filters.assessmentId;
  if (filters.status) query.status = filters.status;
  if (filters.riskLevel) query.riskLevel = filters.riskLevel;
  if (filters.assessmentIds) query.assessmentId = { $in: filters.assessmentIds };
  if (filters.riskLevels) query.riskLevel = { $in: filters.riskLevels };

  return await Submission.find(query).sort('-submittedAt');
};

const updateSubmission = async (id, updates) => {
  return await Submission.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });
};

const countSubmissions = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  return await Submission.countDocuments(query);
};

const getRecentSubmissions = async (sinceMs) => {
  const since = new Date(Date.now() - sinceMs);
  return await Submission.find({ submittedAt: { $gte: since } });
};

module.exports = {
  createSubmission,
  getSubmissionById,
  listSubmissions,
  updateSubmission,
  countSubmissions,
  getRecentSubmissions,
  Submission
};