const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema({
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    submissions: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
    },
    startTime: {
        type: Date,
        default: Date.now,
    },
    endTime: {
        type: Date,
    },
    telemetry: {
        tabSwitches: { type: Number, default: 0 },
        focusLostCount: { type: Number, default: 0 },
        clipboardEvents: { type: Number, default: 0 },
        typingCadence: [
            {
                questionId: String,
                interKeyDelays: [Number], // array of ms between keystrokes
                averageLatency: Number,
            }
        ],
        submissionTimings: [
            {
                questionId: String,
                timeTakenMs: Number,
            }
        ]
    },
    integrityScore: {
        type: Number,
        default: 100, // Starts at 100, penalties applied
    },
    riskLevel: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH'],
        default: 'LOW'
    },
    examDna: {
        type: String, // SHA-256 hash of behavioral fingerprint
    }
});

module.exports = mongoose.model('ExamSession', examSessionSchema);
