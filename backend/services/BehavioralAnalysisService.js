/**
 * Behavioral Analysis Service
 * Phase 2 Innovation: Keystroke Fingerprinting & Hardware Identification
 * Gap Analysis 3: Anomaly Detection Enhancements
 */
class BehavioralAnalysisService {
    /**
     * Calculates a similarity score between current session keystrokes and a baseline.
     * Compare with baseline patterns for impersonation detection.
     */
    analyzeKeystrokeDynamics(timings, baselineStdDev = null) {
        if (!timings || timings.length < 10) return { score: 0, reason: 'Insufficient data' };

        const dwells = timings.map(t => t.dwell);
        const mean = dwells.reduce((a, b) => a + b, 0) / dwells.length;
        const variance = dwells.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / dwells.length;
        const stdDev = Math.sqrt(variance);

        // 1. Robotic detection (Phase 2)
        if (stdDev < 5) {
            return { score: 80, reason: 'Highly consistent typing (Robotic pattern)' };
        }

        // 2. Impersonation detection 
        // If current session volatility (StdDev) differs by > 50% from the baseline, flag it
        if (baselineStdDev && Math.abs(stdDev - baselineStdDev) > (baselineStdDev * 0.5)) {
            return {
                score: 60,
                reason: `Typing volatility (StdDev: ${stdDev.toFixed(1)}ms) deviates significantly from user baseline`,
                potentialImpersonation: true
            };
        }

        // 3. Regular outliers
        const outliers = dwells.filter(d => d > 1000 || d < 20).length;
        const outlierRate = outliers / dwells.length;

        if (outlierRate > 0.3) {
            return { score: 50, reason: 'Irregular typing patterns (Possible automation/stress)' };
        }

        return { score: 10, reason: 'Natural typing pattern' };
    }

    /**
     * Hardware Fingerprint Check
     * Flags if same fingerprint is used by multiple student IDs (Collusion)
     */
    async checkFingerprintCollusion(fingerprint, currentStudentId, SubmissionModel) {
        if (!fingerprint || fingerprint === 'fingerprint_error') return 0;

        const otherUsers = await SubmissionModel.find({
            'anomalyMetrics.fingerprint': fingerprint,
            studentId: { $ne: currentStudentId }
        }).distinct('studentId');

        if (otherUsers.length > 0) {
            return {
                score: 70,
                reason: `Fingerprint shared with other accounts: ${otherUsers.join(', ')}`
            };
        }

        return { score: 0, reason: 'Unique hardware fingerprint' };
    }

    /**
     * Global Risk Aggregator
     */
    async aggregateRisk(telemetry, submission, SubmissionModel, userBaseline = null) {
        const results = [];

        // 1. Keystroke Analysis
        const ks = this.analyzeKeystrokeDynamics(telemetry.keystrokeDynamics, userBaseline ? userBaseline.stdDev : null);
        if (ks.score > 0) results.push(ks);

        // 2. Fingerprint Check
        const fp = await this.checkFingerprintCollusion(telemetry.fingerprint, submission.studentId, SubmissionModel);
        if (fp.score > 0) results.push(fp);

        // 3. Tab Switches (Existing logic enhancement)
        if (telemetry.tabSwitches > 5) {
            results.push({ score: 60, reason: `Excessive tab switching (${telemetry.tabSwitches})` });
        }

        const totalRisk = Math.min(100, results.reduce((sum, r) => sum + r.score, 0));
        return { totalRisk, findings: results };
    }
}

module.exports = new BehavioralAnalysisService();
