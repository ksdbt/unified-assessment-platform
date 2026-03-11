const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const UserModel = require('../models/user');
const LoggingEngine = require('./LoggingEngine');

/**
 * Log an activity and check for anomalies
 */
exports.logActivity = async (req, action, details, metadata = {}, resourceId = null) => {
    try {
        const logEntry = await LoggingEngine.log(req, action, details, metadata, resourceId);

        if (logEntry) {
            checkAnomalies(logEntry);
        }

        return logEntry;
    } catch (error) {
        console.error('Audit Logging Failed:', error);
    }
};

/**
 * Rule-Based Anomaly Detection
 */
const checkAnomalies = async (logEntry) => {
    try {
        // 1. Rapid Submission Detection
        if (logEntry.action === 'ASSESSMENT_SUBMITTED') {
            const { durationTaken, totalDuration } = logEntry.metadata || {};
            if (durationTaken && totalDuration && durationTaken < (totalDuration * 0.1)) {
                // Fetch instructor for this assessment
                const Assessment = require('../models/Assessment');
                const assessment = await Assessment.getAssessmentById(logEntry.resourceId);
                const instructorId = assessment ? assessment.instructorId : null;

                await raiseAlert(
                    'RAPID_SUBMISSION_DETECTED',
                    `User ${logEntry.user} submitted assessment in ${Math.round(durationTaken / 60)} mins (Total: ${totalDuration} mins). Potential cheating.`,
                    instructorId
                );
            }
        }

        // 2. Repeated Authentication Failures
        if (logEntry.action === 'LOGIN_FAILED') {
            const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
            const { total } = await ActivityLog.listLogs({
                action: 'LOGIN_FAILED',
                ip: logEntry.ip,
                createdAtGte: since
            }, 1, 1000);

            if (total >= 5) {
                await raiseAlert(
                    'BRUTE_FORCE_ATTEMPT',
                    `5+ Failed login attempts detected from IP: ${logEntry.ip}`
                );
            }
        }
    } catch (error) {
        console.error('Anomaly Detection Error:', error);
    }
};

/**
 * Raise an alert to all Admins and optionally a specific Instructor via Notification
 */
const raiseAlert = async (type, message, instructorId = null) => {
    try {
        const admins = await UserModel.listUsers({ role: 'admin' });
        const recipients = new Set(admins.map(a => a.id));
        if (instructorId) recipients.add(instructorId);

        if (recipients.size === 0) return;

        const notifications = Array.from(recipients).map(recipientId => ({
            recipient: recipientId,
            message: `[ANOMALY: ${type}] ${message}`,
            type: 'warning',
            onModel: 'User',
            relatedId: recipientId // Self-reference or related user
        }));

        await Notification.createManyNotifications(notifications);
        console.log(`ANOMALY ALERT: ${type} - ${message} (Sent to ${recipients.size} users)`);
    } catch (error) {
        console.error('Alert Generation Failed:', error);
    }
};
// Gap Analysis 2: Continuous Background Verification (Self-Healing Audit Trail)
const startSelfHealingMonitor = () => {
    console.log('[Audit] Launching Self-Healing Monitor...');
    // Run integrity check every 15 minutes
    setInterval(async () => {
        try {
            console.log('[Audit] Background Integrity Check Started...');
            const result = await LoggingEngine.verifyIntegrity();
            if (!result.valid) {
                await raiseAlert(
                    'AUDIT_LOG_TAMPERING_DETECTED',
                    `CRITICAL: Tampering detected at sequence index ${result.brokenIndex}. Audit trail may be compromised.`
                );
            }
        } catch (err) {
            console.error('[Audit] Monitor failed:', err);
        }
    }, 15 * 60 * 1000);
};

// Start the monitor if in production or specifically enabled
if (process.env.NODE_ENV !== 'test') {
    startSelfHealingMonitor();
}
