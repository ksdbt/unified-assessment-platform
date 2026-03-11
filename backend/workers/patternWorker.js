const { parentPort } = require('worker_threads');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment from parent or .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('[Worker] Connected to DB');
    } catch (err) {
        console.error('[Worker] DB Connection Failed:', err);
    }
};

const runTask = async () => {
    await connectDB();
    const PatternAnalysisEngine = require('../services/PatternAnalysisEngine');

    console.log('[Worker] Starting Pattern Analysis...');
    await PatternAnalysisEngine.detectRapidSubmissionClusters();
    await PatternAnalysisEngine.detectImpossibleTravel();
    console.log('[Worker] Analysis Complete.');
};

runTask().then(() => {
    if (parentPort) parentPort.postMessage('done');
    else process.exit(0);
}).catch(err => {
    console.error('[Worker] Fatal Error:', err);
    process.exit(1);
});
