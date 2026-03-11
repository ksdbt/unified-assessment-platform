const mongoose = require('mongoose');

const PlatformSettingsSchema = new mongoose.Schema({

  instituteName: {
    type: String,
    default: 'Unified Assessment Platform'
  },
  instituteEmail: {
    type: String,
    default: 'admin@unified.edu'
  },
  supportEmail: {
    type: String,
    default: 'support@unified.edu'
  },
  allowRegistration: {
    type: Boolean,
    default: true
  },
  requireEmailVerification: {
    type: Boolean,
    default: false
  },
  enableNotifications: {
    type: Boolean,
    default: true
  },
  maxFileSize: {
    type: Number,
    default: 10
  },
  sessionTimeout: {
    type: Number,
    default: 60
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  backupFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  proctoringDefaults: {
    tabSwitchLimit: { type: Number, default: 3 },
    lockdownBrowser: { type: Boolean, default: false }
  },
  updatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const PlatformSettings = mongoose.model('PlatformSettings', PlatformSettingsSchema);

// --- Compatibility Wrappers ---

const getSettings = async () => {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }
  return settings;
};

const upsertSettings = async (updates) => {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    return await PlatformSettings.create(updates);
  }
  return await PlatformSettings.findByIdAndUpdate(settings._id, updates, { new: true });
};

module.exports = {
  getSettings,
  upsertSettings,
  PlatformSettings
};