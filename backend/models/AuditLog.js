const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
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
    action: {
        type: String,
        required: true,
        enum: [
            'EXAM_STARTED',
            'EXAM_SUBMITTED',
            'TAB_SWITCH',
            'COPY_PASTE',
            'RAPID_SUBMISSION',
            'IDENTITY_VERIFIED',
            'INTEGRITY_COMPUTED'
        ]
    },
    details: {
        type: Object,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    previousHash: {
        type: String,
        required: true,
        default: 'GENESIS_BLOCK' // First entry will use this
    },
    currentHash: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
