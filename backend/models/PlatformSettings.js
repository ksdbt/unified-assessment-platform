const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
  instituteName: { type: String, default: 'Unified Assessment Platform' },
  instituteEmail: { type: String, default: 'admin@unified.edu' },
  supportEmail: { type: String, default: 'support@unified.edu' },
  logoUrl: { type: String, default: null },
  allowRegistration: { type: Boolean, default: true },
  requireEmailVerification: { type: Boolean, default: false },
  enableNotifications: { type: Boolean, default: true },
  maxFileSize: { type: Number, default: 10 },
  sessionTimeout: { type: Number, default: 60 },
  maintenanceMode: { type: Boolean, default: false },
  backupFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);