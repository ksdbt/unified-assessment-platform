const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: String,
  userId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  role: String,
  action: {
    type: String,
    required: true
  },
  details: String,
  metadata: mongoose.Schema.Types.Mixed,
  resourceId: String,
  ip: String,
  userAgent: String,

  // Cryptographic Integrity
  previousHash: {
    type: String,
    required: true
  },
  currentHash: {
    type: String,
    required: true
  },
  sequenceIndex: {
    type: Number,
    required: true,
    unique: true
  },
}, {
  timestamps: true
});

// Gap Analysis 1: Optimized Database Indexing
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ ip: 1 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

// --- Compatibility Wrappers ---

const createLog = async (data) => {
  return await ActivityLog.create(data);
};

const getLastLog = async () => {
  return await ActivityLog.findOne().sort('-sequenceIndex');
};

const getAllLogsOrdered = async () => {
  return await ActivityLog.find().sort('sequenceIndex');
};

const listLogs = async (filters = {}, page = 1, limit = 50) => {
  const query = {};
  if (filters.action) query.action = filters.action;
  if (filters.ip) query.ip = filters.ip;
  if (filters.createdAtGte || filters.createdAtLte) {
    query.createdAt = {};
    if (filters.createdAtGte) query.createdAt.$gte = new Date(filters.createdAtGte);
    if (filters.createdAtLte) query.createdAt.$lte = new Date(filters.createdAtLte);
  }

  const total = await ActivityLog.countDocuments(query);
  const logs = await ActivityLog.find(query)
    .sort('-createdAt')
    .skip((page - 1) * limit)
    .limit(limit);

  return { logs, total };
};

const countLogs = async (filters = {}) => {
  return await ActivityLog.countDocuments(filters);
};

const updateLogForTamper = async (id, updates) => {
  return await ActivityLog.findByIdAndUpdate(id, updates, { new: true });
};

module.exports = {
  createLog,
  getLastLog,
  getAllLogsOrdered,
  listLogs,
  countLogs,
  updateLogForTamper,
  ActivityLog
};