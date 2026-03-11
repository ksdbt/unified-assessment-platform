/**
 * XAI Engine (Explainable AI)
 * Automated Transparent Decision Support
 * 
 * Transforms Anomaly Metrics into Human-Readable Risk Justifications.
 */
class XAIEngine {
    /**
     * Generates a narrative explanation for a risk score.
     * @param {Object} metrics - metrics object containing tabSwitches, copyPastes, etc.
     * @param {Number} score - total risk score calculated.
     */
    async generateJustification(metrics, score) {
        const { tabSwitches = 0, copyPastes = 0, timeDeviation = 0, ipChanges = 0, perQuestionRisk = 0 } = metrics;

        const factors = [];

        if (tabSwitches > 5) {
            factors.push(`Frequent browser tab switching (${tabSwitches} instances) suggests external resource lookup.`);
        } else if (tabSwitches > 0) {
            factors.push(`Minor tab switching (${tabSwitches} instances) detected.`);
        }

        if (copyPastes > 0) {
            factors.push(`Unusual clipboard activity (${copyPastes} pastes) indicates potential source code or text injection.`);
        }

        if (timeDeviation > 1) {
            factors.push(`Significant response time deviation compared to peer averages (Speed/Anomalous Pattern).`);
        }

        if (ipChanges > 0) {
            factors.push(`Multiple geolocation signatures detected via IP mismatch.`);
        }

        if (perQuestionRisk > 20) {
            factors.push(`Impossibly fast response times on critical questions detected.`);
        }

        let summary = "The integrity of this session is verified.";
        if (score >= 70) {
            summary = "CRITICAL: Multiple high-confidence fraud indicators were detected simultaneously.";
        } else if (score >= 30) {
            summary = "WARNING: Moderate behavioral anomalies observed. Close monitoring recommended.";
        }

        return {
            summary,
            factors,
            fullNarrative: factors.length > 0 ? `${summary} Factors include: ${factors.join(' ')}` : summary,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = new XAIEngine();
