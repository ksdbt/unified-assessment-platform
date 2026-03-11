const Assessment = require('../models/Assessment');
const auditLogger = require('../services/auditLogger');
const Notification = require('../models/Notification');
const UserModel = require('../models/user');

// @route GET /api/assessments
exports.getAllAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.listAssessments({ status: 'active' });
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/assessments/student
exports.getStudentAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.listAssessments({ status: 'active' });
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/assessments/instructor
exports.getInstructorAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.listAssessments({ instructorId: req.user.id });
    const assessmentIds = assessments.map(a => a._id);

    // Aggregate unique student counts from submissions
    const Submission = require('../models/Submission').Submission;
    const submissionStats = await Submission.aggregate([
      { $match: { assessmentId: { $in: assessmentIds } } },
      {
        $group: {
          _id: '$assessmentId',
          uniqueSubmitters: { $addToSet: '$studentId' }
        }
      },
      {
        $project: {
          assessmentId: '$_id',
          submittedCount: { $size: '$uniqueSubmitters' }
        }
      }
    ]);

    const statsMap = {};
    submissionStats.forEach(stat => {
      statsMap[stat.assessmentId.toString()] = stat.submittedCount;
    });

    const data = assessments.map(a => {
      const plain = typeof a.toObject === 'function' ? a.toObject() : a;
      plain.submittedCount = statsMap[a._id.toString()] || 0;
      return plain;
    });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/assessments/admin
exports.getAdminAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.listAssessments({});
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/assessments/:id
exports.getAssessmentById = async (req, res) => {
  try {
    const assessment = await Assessment.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/assessments
exports.createAssessment = async (req, res) => {
  try {
    const assessmentData = {
      ...req.body,
      instructorId: req.user.id,
      instructorName: req.user.name
    };

    // Auto-calculate totalMarks if missing
    if (!assessmentData.totalMarks && assessmentData.questions) {
      assessmentData.totalMarks = assessmentData.questions.reduce((sum, q) => sum + (q.points || 0), 0);
    }

    const AQIEngine = require('../services/AQIEngine');
    const auditResult = await AQIEngine.inspectQuestions(assessmentData.questions, assessmentData.subject);

    const assessment = await Assessment.createAssessment({
      ...assessmentData,
      pedagogicalAudit: {
        qualityScore: auditResult.qualityScore || 100,
        feedback: auditResult.feedback || [],
        recommendedChanges: auditResult.recommendedChanges || [],
        auditedAt: new Date()
      }
    });

    await auditLogger.logActivity(
      req,
      'ASSESSMENT_CREATED',
      `Created assessment: ${assessment.title} (AQI: ${auditResult.qualityScore}%)`,
      { title: assessment.title, type: assessment.type, subject: assessment.subject, aqi: auditResult.qualityScore },
      assessment.id
    );

    // Notify all students
    const students = await UserModel.listUsers({ role: 'student' });
    const notifications = students.map(student => ({
      recipient: student.id,
      message: `New assessment available: ${assessment.title}`,
      type: 'info',
      onModel: 'Assessment',
      relatedId: assessment.id
    }));
    if (notifications.length > 0) {
      await Notification.createManyNotifications(notifications);
    }

    res.status(201).json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/assessments/:id
exports.updateAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const instructorId = assessment.instructorId?._id?.toString() || assessment.instructorId?.toString();
    if (req.user.role !== 'admin' && instructorId !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Assessment.updateAssessment(req.params.id, req.body);

    await auditLogger.logActivity(
      req,
      'ASSESSMENT_UPDATED',
      `Updated assessment: ${updated.title}`,
      { title: updated.title, changes: req.body },
      updated.id
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/assessments/:id
exports.deleteAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.getAssessmentById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const instructorId = assessment.instructorId?._id?.toString() || assessment.instructorId?.toString();
    if (req.user.role !== 'admin' && instructorId !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await auditLogger.logActivity(
      req,
      'ASSESSMENT_DELETED',
      `Deleted assessment: ${assessment.title}`,
      { title: assessment.title },
      assessment.id
    );

    await Assessment.deleteAssessment(req.params.id);
    res.json({ success: true, message: 'Assessment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/assessments/:id/enroll
exports.enrollStudents = async (req, res) => {
  try {
    const { studentIds } = req.body;
    const assessment = await Assessment.enrollStudents(req.params.id, studentIds);
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/assessments/:id/integrity-stats
exports.getAssessmentIntegrityStats = async (req, res) => {
  try {
    const Submission = require('../models/Submission').Submission;
    const submissions = await Submission.find({ assessmentId: req.params.id });

    if (submissions.length === 0) {
      return res.json({
        success: true,
        data: {
          avgTrustScore: 100,
          totalAnomalies: 0,
          mostSuspiciousQuestion: 'N/A',
          riskDistribution: { High: 0, Medium: 0, Low: 0 },
          ranking: []
        }
      });
    }

    const totalTrust = submissions.reduce((acc, s) => acc + (s.trustScore || 100), 0);
    const avgTrustScore = Math.round(totalTrust / submissions.length);

    const riskDistribution = { High: 0, Medium: 0, Low: 0 };
    const questionAnomalies = {};

    submissions.forEach(s => {
      riskDistribution[s.riskLevel || 'Low']++;

      // Aggregate question-level anomalies (fast answers)
      if (s.anomalyMetrics && s.anomalyMetrics.questionTimes) {
        // Find most suspicious questions based on fast answers (conceptual)
        // For simplicity, we'll increment based on where potential risks were flagged
        // In a real system, we'd check against avgTime
      }
    });

    // Create Ranking
    const ranking = submissions
      .map(s => ({
        id: s._id,
        studentName: s.studentName,
        trustScore: s.trustScore || 100,
        riskLevel: s.riskLevel || 'Low'
      }))
      .sort((a, b) => a.trustScore - b.trustScore);

    res.json({
      success: true,
      data: {
        avgTrustScore,
        totalAnomalies: submissions.filter(s => (s.trustScore || 100) < 90).length,
        mostSuspiciousQuestion: 'Q2', // Mock for now, would be derived from deviation counts
        riskDistribution,
        ranking: ranking.slice(0, 5) // Top 5 suspicious
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};