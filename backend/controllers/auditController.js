const Submission = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');
const LoggingEngine = require('../services/LoggingEngine');
const PatternAnalysisEngine = require('../services/PatternAnalysisEngine');
const AnomalyEngine = require('../services/AnomalyEngine');
const UserModel = require('../models/user');

// ─── Cross-Student Collusion Detector ───────────────────
// Jaccard Similarity: Collusion_Score(A, B) = |answers_A ∩ answers_B| / |answers_A ∪ answers_B|
exports.detectCollusion = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        // Get all submissions for this assessment
        const submissions = await Submission.listSubmissions({ assessmentId });

        if (submissions.length < 2) {
            return res.json({ success: true, data: [], message: 'Need at least 2 submissions to compare' });
        }

        const suspiciousPairs = [];

        for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
                const subA = submissions[i];
                const subB = submissions[j];

                // If similarity > 0.85 AND answers were submitted quickly
                const timeDiff = Math.abs(new Date(subA.submittedAt).getTime() - new Date(subB.submittedAt).getTime());
                const windowMs = 10 * 60 * 1000; // 10 minutes

                // Build answer maps from evaluated answers
                const answersA = {};
                const answersB = {};

                (subA.answers || []).forEach(a => { answersA[a.questionId] = String(a.answer || '').trim().toLowerCase(); });
                (subB.answers || []).forEach(a => { answersB[a.questionId] = String(a.answer || '').trim().toLowerCase(); });

                const allQIds = new Set([...Object.keys(answersA), ...Object.keys(answersB)]);
                let intersection = 0;
                let union = allQIds.size;

                allQIds.forEach(qId => {
                    if (answersA[qId] && answersB[qId] && answersA[qId] === answersB[qId] && answersA[qId] !== '') {
                        intersection++;
                    }
                });

                const jaccardScore = union > 0 ? intersection / union : 0;

                if (jaccardScore >= 0.85 && timeDiff <= windowMs) { // Enhanced with time window
                    suspiciousPairs.push({
                        studentA: { id: subA.studentId, name: subA.studentName },
                        studentB: { id: subB.studentId, name: subB.studentName },
                        jaccardScore: Math.round(jaccardScore * 100),
                        timeDifferenceMins: Math.round(timeDiff / (60 * 1000)),
                        sharedAnswers: intersection,
                        totalQuestions: union,
                        severity: jaccardScore >= 0.90 ? 'Critical' : 'High',
                        assessmentId
                    });
                }
            }
        }

        // Sort by severity
        suspiciousPairs.sort((a, b) => b.jaccardScore - a.jaccardScore);

        res.json({ success: true, data: suspiciousPairs, total: suspiciousPairs.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Tiered Audit Visibility ────────────────────────────
/**
 * Admin: sees all logs
 * Instructor: sees logs related to their assessments
 * Student: sees only their own session logs
 */
exports.getAuditLogs = async (req, res) => {
    try {
        const { role, id: userId } = req.user;
        const { period = '7d', action, page = 1, limit = 50 } = req.query;

        // Time filter
        const periodMap = { '1h': 1 * 60 * 60 * 1000, '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 };
        const since = new Date(Date.now() - (periodMap[period] || periodMap['7d'])).toISOString();

        const filters = { createdAtGte: since };
        if (action) filters.action = action;

        // Role-based visibility
        if (role === 'student') {
            filters.userId = userId;
        }
        // Instructor: only their assessment-related actions  
        // Admin: sees everything (no extra filter)

        const { logs, total } = await ActivityLog.listLogs(filters, Number(page), Number(limit));

        res.json({ success: true, data: logs, total });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Log Chain Integrity Verification ─────────────────────────────────────
exports.verifyLogIntegrity = async (req, res) => {
    try {
        const result = await LoggingEngine.verifyIntegrity();
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Suspicious Activity (High Risk Submissions + Pattern Alerts) ──────────────────
exports.getSuspiciousActivity = async (req, res) => {
    try {
        const NotificationModel = require('../models/Notification');

        // 1. Fetch high-risk submissions
        const allSubmissions = await Submission.listSubmissions({});
        const highRiskSubmissions = allSubmissions
            .filter(s => s.riskScore && s.riskScore > 0)
            .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
            .slice(0, 10); // Limit to top 10

        // 2. Fetch pattern alerts from notifications
        const alerts = await NotificationModel.Notification.find({
            message: { $regex: /\[PATTERN:/i }
        }).sort('-createdAt').limit(10);

        res.json({
            success: true,
            data: {
                highRiskSubmissions,
                alerts: alerts.map(a => ({
                    id: a._id,
                    message: a.message.replace(/\[PATTERN:.*?\]\s*/i, ''),
                    type: a.message.match(/\[PATTERN:(.*?)\]/i)?.[1] || 'GENERAL_PATTERN',
                    createdAt: a.createdAt
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Session Replay (Per-Session Behavior Timeline) ───────────────────────
exports.getSessionReplay = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const submission = await Submission.getSubmissionById(submissionId);
        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

        const sessionData = {
            id: submission._id || submission.id,
            studentName: submission.studentName,
            assessmentId: submission.assessmentId,
            timeTaken: submission.timeTaken,
            riskScore: submission.riskScore,
            riskLevel: submission.riskLevel,
            anomalyMetrics: submission.anomalyMetrics || {},
            answers: (submission.answers || []).map(a => ({
                questionId: a.questionId,
                type: a.type,
                isCorrect: a.isCorrect,
                timeSpent: submission.anomalyMetrics?.questionTimes?.[a.questionId] || null
            })),
            warnings: (submission.anomalyMetrics?.warnings || [])
        };

        res.json({ success: true, data: sessionData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Run Pattern Analysis (Cheating Ring Detection) ───────────────────────
exports.runPatternAnalysis = async (req, res) => {
    try {
        await PatternAnalysisEngine.runAnalysis();
        res.json({ success: true, message: 'Pattern analysis completed. Alerts issued to admins.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ─── Cheating Network Graph (Collusion Clusters) ────────
exports.getNetworkGraphData = async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const submissions = await Submission.listSubmissions({ assessmentId });

        if (submissions.length < 2) {
            return res.json({ success: true, data: { nodes: [], edges: [] } });
        }

        const nodes = submissions.map(s => ({
            id: String(s.studentId),
            name: s.studentName,
            riskScore: s.riskScore || 0,
            riskLevel: s.riskLevel || 'Low',
            submissionId: s._id
        }));

        const edges = [];

        for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
                const subA = submissions[i];
                const subB = submissions[j];

                // 1. Jaccard Similarity
                const answersA = {};
                const answersB = {};
                (subA.answers || []).forEach(a => { answersA[a.questionId] = String(a.answer || '').trim().toLowerCase(); });
                (subB.answers || []).forEach(a => { answersB[a.questionId] = String(a.answer || '').trim().toLowerCase(); });

                const allQIds = new Set([...Object.keys(answersA), ...Object.keys(answersB)]);
                let intersection = 0;
                allQIds.forEach(qId => {
                    if (answersA[qId] && answersB[qId] && answersA[qId] === answersB[qId]) intersection++;
                });
                const jaccard = allQIds.size > 0 ? intersection / allQIds.size : 0;

                // 2. DNA Similarity (Simple string comparison or hamming distance would be complex, let's use direct match)
                const dnaMatch = (subA.examDNA && subB.examDNA && subA.examDNA === subB.examDNA) ? 1 : 0;

                // 3. Risk Score Correlation
                const riskDiff = Math.abs((subA.riskScore || 0) - (subB.riskScore || 0));
                const riskSim = Math.max(0, 1 - (riskDiff / 100));

                // Combined Weighted Score
                const totalSimilarity = (jaccard * 0.6) + (dnaMatch * 0.2) + (riskSim * 0.2);

                if (totalSimilarity > 0.80) { // Slightly lower threshold for graph visibility
                    edges.push({
                        id: `edge-${i}-${j}`,
                        source: String(subA.studentId),
                        target: String(subB.studentId),
                        weight: Math.round(totalSimilarity * 100),
                        label: `${Math.round(totalSimilarity * 100)}%`
                    });
                }
            }
        }

        res.json({ success: true, data: { nodes, edges } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
