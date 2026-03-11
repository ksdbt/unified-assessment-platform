const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const ExamSession = require('../models/ExamSession');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/auth');

// Helper to hash objects
const generateHash = (data) => {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// @route   POST /api/telemetry/event
// @desc    Record a telemetry event and append to cryptographic audit log
// @access  Private (Student)
router.post('/event', protect, async (req, res) => {
    try {
        const { assessmentId, action, details } = req.body;
        const userId = req.user.id; // From protect middleware

        // Find or create ExamSession
        let session = await ExamSession.findOne({ assessmentId, userId });

        if (!session) {
            session = new ExamSession({
                assessmentId,
                userId,
                startTime: new Date()
            });
            await session.save();
        }

        // Apply Integrity Score Penalties
        let penalty = 0;
        if (action === 'TAB_SWITCH') {
            penalty = 5;
            session.telemetry.tabSwitches += 1;
        } else if (action === 'COPY_PASTE') {
            penalty = 10;
            session.telemetry.clipboardEvents += 1;
        }

        if (penalty > 0) {
            session.integrityScore = Math.max(0, session.integrityScore - penalty);
            if (session.integrityScore < 50) session.riskLevel = 'HIGH';
            else if (session.integrityScore < 80) session.riskLevel = 'MEDIUM';
            await session.save();
        }

        // Process Audit Log
        const lastLog = await AuditLog.findOne({ assessmentId, userId }).sort({ timestamp: -1 });
        const previousHash = lastLog ? lastLog.currentHash : 'GENESIS_BLOCK';

        const logEntryData = {
            assessmentId,
            userId,
            action,
            details,
            timestamp: new Date().toISOString(),
            previousHash
        };

        const currentHash = generateHash(logEntryData);

        const newLog = new AuditLog({
            ...logEntryData,
            currentHash
        });

        await newLog.save();

        res.status(200).json({ success: true, riskLevel: session.riskLevel, integrityScore: session.integrityScore });
    } catch (error) {
        console.error('Telemetry Event Error:', error);
        res.status(500).json({ message: 'Server error processing telemetry event' });
    }
});

// @route   POST /api/telemetry/submit-exam
// @desc    Finalize exam, calculate Exam DNA hash
// @access  Private (Student)
router.post('/submit-exam', protect, async (req, res) => {
    try {
        const { assessmentId, submissionId, typingCadence, submissionTimings } = req.body;
        const userId = req.user.id;

        const session = await ExamSession.findOne({ assessmentId, userId });
        if (!session) {
            return res.status(404).json({ message: 'Exam session not found' });
        }

        session.submissions = submissionId;
        session.endTime = new Date();
        session.telemetry.typingCadence = typingCadence || [];
        session.telemetry.submissionTimings = submissionTimings || [];

        // Calculate Exam DNA based on typing latency variance, focus time, and timings
        const baseFingerprintString = JSON.stringify({
            tabSwitches: session.telemetry.tabSwitches,
            clipboardEvents: session.telemetry.clipboardEvents,
            cadence: session.telemetry.typingCadence.map(c => c.averageLatency),
            timings: session.telemetry.submissionTimings.map(t => t.timeTakenMs)
        });

        session.examDna = generateHash(baseFingerprintString);
        await session.save();

        // Final log entry
        const lastLog = await AuditLog.findOne({ assessmentId, userId }).sort({ timestamp: -1 });
        const previousHash = lastLog ? lastLog.currentHash : 'GENESIS_BLOCK';
        const currentHash = generateHash({ action: 'EXAM_SUBMITTED', assessmentId, userId, previousHash });

        await AuditLog.create({
            assessmentId,
            userId,
            action: 'EXAM_SUBMITTED',
            details: { examDna: session.examDna },
            previousHash,
            currentHash
        });

        res.status(200).json({ success: true, examDna: session.examDna });
    } catch (error) {
        console.error('Exam Submission Error:', error);
        res.status(500).json({ message: 'Server error submitting exam telemetry' });
    }
});

module.exports = router;
