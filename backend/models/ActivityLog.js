const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    enum: [
      'user_login', 'user_logout', 'user_created', 'user_updated',
      'user_deleted', 'assessment_created', 'assessment_updated',
      'assessment_deleted', 'assessment_submitted', 'assessment_evaluated',
      'settings_updated', 'password_changed'
    ],
    required: true
  },
  details: { type: String, required: true },
  ip: { type: String, default: 'unknown' },
  userAgent: { type: String, default: 'unknown' }
}, {
  timestamps: true
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);