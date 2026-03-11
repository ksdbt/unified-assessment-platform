const SubmissionModel = require('../models/Submission');
const UserModel = require('../models/user');
const Notification = require('../models/Notification');

/**
 * Behavioral Anomaly Detection Engine
 *
 * R = (Ts × W1) + (Cp × W2) + (Td × W3) + (Ip × W4)
 */

const W1 = 5;   // Tab Switches
const W2 = 10;  // Copy-Paste
const W3 = 3;   // Fast Answer (Per Question Risk)
const W4 = 20;  // IP Change

const THRESHOLD_LOW = 30;
const THRESHOLD_MEDIUM = 70;

class AnomalyEngine {

    async calculateRiskScore(submissionId, metrics) {
        try {
            const {
                tabSwitches,
                copyPastes,
                ipMismatch,
                fastAnswerCount, // Changed from perQuestionRisk
                difficulty
            } = metrics;

            const ipFactor = ipMismatch ? 1 : 0;

            // PRECISE FORMULA:
            // TrustScore = 100 - (TabSwitch × 5) - (CopyPaste × 10) - (IPChange × 20) - (FastAnswer × 3)

            const totalPenalty =
                (tabSwitches * W1) +
                (copyPastes * W2) +
                (fastAnswerCount * W3) +
                (ipFactor * W4);

            const trustScore = Math.max(0, 100 - totalPenalty);
            const riskScore = 100 - trustScore;

            let riskLevel = 'Low';
            if (riskScore >= THRESHOLD_MEDIUM) riskLevel = 'High';
            else if (riskScore >= THRESHOLD_LOW) riskLevel = 'Medium';

            const XAIEngine = require('./XAIEngine');
            const justification = await XAIEngine.generateJustification({
                tabSwitches,
                copyPastes,
                fastAnswers: fastAnswerCount,
                ipChanges: ipFactor
            }, riskScore);

            // Update the submission in the database
            const submission = await SubmissionModel.updateSubmission(submissionId, {
                riskScore,
                trustScore,
                riskLevel,
                anomalyJustification: justification.fullNarrative,
                anomalyMetrics: {
                    tabSwitches,
                    copyPastes,
                    fastAnswers: fastAnswerCount,
                    ipChanges: ipFactor,
                    trustScore
                }
            });

            if (riskLevel === 'High') {
                await this.raiseHighRiskAlert(submission);
            }

            return { riskScore, trustScore, riskLevel, justification: justification.fullNarrative };
        } catch (error) {
            console.error('AnomalyEngine Calculation Error:', error);
            return { riskScore: 0, trustScore: 100, riskLevel: 'Error' };
        }
    }

    async raiseHighRiskAlert(submission) {
        try {
            // Fetch assessment to get instructor
            const Assessment = require('../models/Assessment');
            const assessmentId = submission.assessmentId?._id || submission.assessmentId;
            const assessment = await Assessment.getAssessmentById(assessmentId);
            const instructorId = assessment ? assessment.instructorId : null;

            const admins = await UserModel.listUsers({ role: 'admin' });
            const recipients = new Set(admins.map(a => a.id || a._id));
            if (instructorId) recipients.add(instructorId);

            if (recipients.size === 0) return;

            const notifications = Array.from(recipients).map(recipientId => ({
                recipient: recipientId,
                message: `[HIGH RISK] ${submission.studentName} - Assessment: "${assessment?.title || 'Unknown'}" - Risk Score: ${submission.riskScore}`,
                type: 'error',
                onModel: 'Submission',
                relatedId: submission.id
            }));

            await Notification.createManyNotifications(notifications);
            console.log(`HIGH RISK ALERT: Submission ${submission.id} Score: ${submission.riskScore} (Notified ${recipients.size} recipients)`);
        } catch (error) {
            console.error('Failed to raise high risk alert', error);
        }
    }
}

module.exports = new AnomalyEngine();
