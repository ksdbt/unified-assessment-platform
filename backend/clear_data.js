const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Models
const User = require('./models/user');
const Assessment = require('./models/Assessment');
const Submission = require('./models/Submission');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const clearData = async () => {
    try {
        console.log('📡 Connecting to MongoDB to clear data...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');

        console.log('🧹 Clearing all collections...');
        await Promise.all([
            User.User.deleteMany({}),
            Assessment.Assessment.deleteMany({}),
            Submission.Submission.deleteMany({}),
            ActivityLog.ActivityLog.deleteMany({}),
            Notification.Notification.deleteMany({})
        ]);

        console.log('✨ Database cleared successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Clearance failed:', err);
        process.exit(1);
    }
};

clearData();
