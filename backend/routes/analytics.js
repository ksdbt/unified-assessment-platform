const express = require('express');
const router = express.Router();
const ExamSession = require('../models/ExamSession');
const AuditLog = require('../models/AuditLog');
const { Submission } = require('../models/Submission');
const { protect, authorize } = require('../middleware/auth');

// Jaccard Similarity Helper
const calculateJaccardSimilarity = (set1, set2) => {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
};

// @route   GET /api/analytics/collusion/:assessmentId
// @desc    Calculate collusion network using Jaccard Similarity across submissions
// @access  Private (Instructor/Admin)
router.get('/collusion/:assessmentId', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const { assessmentId } = req.params;

        // Get all submissions for this assessment
        const submissions = await Submission.find({ assessmentId: assessmentId })
            .populate('studentId', 'firstName lastName email name')
            .lean();

        if (!submissions || submissions.length < 2) {
            return res.status(200).json({ nodes: [], links: [] });
        }

        const nodes = [];
        const links = [];

        // Add nodes
        submissions.forEach(sub => {
            if (!sub.studentId) return; // safety check
            nodes.push({
                id: sub.studentId._id.toString(),
                name: sub.studentName || sub.studentId.name || `${sub.studentId.firstName} ${sub.studentId.lastName}`,
                email: sub.studentId.email,
                score: sub.score
            });
        });

        // Compare all pairs to generate links based on identical answers
        for (let i = 0; i < submissions.length; i++) {
            for (let j = i + 1; j < submissions.length; j++) {
                const subA = submissions[i];
                const subB = submissions[j];

                if (!subA.studentId || !subB.studentId) continue;

                const answersA = new Set(subA.answers.map(a => `${a.questionId}-${Array.isArray(a.answer) ? a.answer.join(',') : a.answer}`));
                const answersB = new Set(subB.answers.map(a => `${a.questionId}-${Array.isArray(a.answer) ? a.answer.join(',') : a.answer}`));

                const similarity = calculateJaccardSimilarity(answersA, answersB);

                // If similarity is oddly high (e.g. > 85%), flag as potential collusion
                if (similarity > 0.85) {
                    links.push({
                        source: subA.studentId._id.toString(),
                        target: subB.studentId._id.toString(),
                        similarity: similarity.toFixed(2)
                    });
                }
            }
        }

        res.status(200).json({ nodes, links });
    } catch (error) {
        console.error('Collusion detection error:', error);
        res.status(500).json({ message: 'Server error computing collusion network', error: error.message, stack: error.stack });
    }
});

// @route   GET /api/analytics/audit-logs/:assessmentId/:userId
// @desc    Get the sequential audit logs and the telemetry session details for a student
// @access  Private (Instructor/Admin)
router.get('/audit-logs/:assessmentId/:userId', protect, authorize('admin', 'instructor'), async (req, res) => {
    try {
        const { assessmentId, userId } = req.params;

        const session = await ExamSession.findOne({ assessmentId, userId })
            .populate('userId', 'firstName lastName email');

        if (!session) {
            return res.status(404).json({ message: 'Exam session not found' });
        }

        const logs = await AuditLog.find({ assessmentId, userId }).sort({ timestamp: 1 }).lean();

        // Verify hash sequence for tamper evidence
        let isValidChain = true;
        for (let i = 1; i < logs.length; i++) {
            if (logs[i].previousHash !== logs[i - 1].currentHash) {
                isValidChain = false;
                break;
            }
        }

        res.status(200).json({
            session,
            logs,
            isTamperEvident: !isValidChain,
            chainValid: isValidChain
        });

    } catch (error) {
        console.error('Audit logs fetch error:', error);
        res.status(500).json({ message: 'Server error fetching audit logs' });
    }
});

module.exports = router;
