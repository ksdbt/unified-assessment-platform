const UserModel = require('../models/user');
const Assessment = require('../models/Assessment');
const SubmissionModel = require('../models/Submission');
const ActivityLog = require('../models/ActivityLog');
const PlatformSettings = require('../models/PlatformSettings');
const LoggingEngine = require('../services/LoggingEngine');
const PatternAnalysisEngine = require('../services/PatternAnalysisEngine');
const Notification = require('../models/Notification');
const cryptoUtils = require('../utils/cryptoUtils');
const TransparencyLedger = require('../services/TransparencyLedger');

// @route GET /api/admin/stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      allUsers,
      allAssessments,
      allSubmissions,
      recentLogs
    ] = await Promise.all([
      UserModel.listUsers({}),
      Assessment.listAssessments({}),
      SubmissionModel.listSubmissions({}),
      ActivityLog.listLogs({}, 1, 10).then(r => r.logs)
    ]);

    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.isActive).length;
    const totalStudents = allUsers.filter(u => u.role === 'student').length;
    const totalInstructors = allUsers.filter(u => u.role === 'instructor').length;
    const totalAdmins = allUsers.filter(u => u.role === 'admin').length;

    const totalAssessments = allAssessments.length;
    const activeAssessments = allAssessments.filter(a => a.status === 'active').length;

    const totalSubmissions = allSubmissions.length;
    const evaluatedSubmissions = allSubmissions.filter(s => s.status === 'evaluated').length;

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        roles: { students: totalStudents, instructors: totalInstructors, admins: totalAdmins },
        assessments: { total: totalAssessments, active: activeAssessments },
        submissions: { total: totalSubmissions, evaluated: evaluatedSubmissions },
        recentActivity: recentLogs
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/admin/logs
exports.getActivityLogs = async (req, res) => {
  try {
    const { period, action, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filters = {};
    if (action) filters.action = action;

    if (period) {
      const now = new Date();
      let start;
      if (period === '1h') start = new Date(now - 60 * 60 * 1000);
      else if (period === '24h') start = new Date(now - 24 * 60 * 60 * 1000);
      else if (period === '7d') start = new Date(now - 7 * 24 * 60 * 60 * 1000);
      else if (period === '30d') start = new Date(now - 30 * 24 * 60 * 60 * 1000);
      if (start) filters.createdAtGte = start.toISOString();
    }

    if (startDate && endDate) {
      filters.createdAtGte = new Date(startDate).toISOString();
      filters.createdAtLte = new Date(endDate).toISOString();
    }

    const { logs, total } = await ActivityLog.listLogs(filters, parseInt(page), parseInt(limit));
    res.json({ success: true, data: logs, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/admin/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
  try {
    const oldSettings = await PlatformSettings.getSettings();
    const settings = await PlatformSettings.upsertSettings(req.body);

    // Gap Analysis 4: Delta Logging (Granular State Tracking)
    const delta = cryptoUtils.calculateDelta(oldSettings || {}, req.body);

    await ActivityLog.createLog({
      user: req.user.name,
      userId: req.user.id,
      role: req.user.role,
      action: 'settings_updated',
      details: 'Platform settings updated',
      metadata: { delta },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/admin/logs/verify
exports.verifyLogIntegrity = async (req, res) => {
  try {
    const result = await LoggingEngine.verifyIntegrity();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/admin/suspicious
exports.getSuspiciousActivity = async (req, res) => {
  try {
    await PatternAnalysisEngine.runAnalysis();

    const highRiskSubmissions = await SubmissionModel.Submission.find({
      riskLevel: { $in: ['Medium', 'High'] }
    })
      .populate('studentId', 'name')
      .populate('assessmentId', 'title')
      .sort('-createdAt');

    const alerts = await Notification.listNotificationsByType(
      ['warning', 'error'],
      'ANOMALY|PATTERN|HIGH RISK'
    );

    res.json({
      success: true,
      data: { highRiskSubmissions, alerts }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/admin/replay/:submissionId
exports.getSessionReplay = async (req, res) => {
  try {
    const submission = await SubmissionModel.getSubmissionById(req.params.submissionId);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    res.json({
      success: true,
      data: {
        id: submission.id,
        behaviorLogs: submission.behaviorLogs,
        riskScore: submission.riskScore,
        riskLevel: submission.riskLevel,
        anomalyMetrics: submission.anomalyMetrics,
        studentName: submission.studentName,
        submittedAt: submission.submittedAt,
        assessmentId: submission.assessmentId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/admin/seed-demo
exports.seedDemoData = async (req, res) => {
  try {
    // 1. Create a Student and an Admin
    const student = await UserModel.createUser({
      name: 'Demo Student',
      email: 'student@uap.com',
      password: 'password123',
      role: 'student'
    });

    const admin = await UserModel.createUser({
      name: 'Demo Admin',
      email: 'admin@uap.com',
      password: 'admin123',
      role: 'admin'
    });

    // 2. Create an Assessment
    const assessment = await Assessment.createAssessment({
      title: 'Final Exam (Demo)',
      description: 'Demo assessment for s',
      duration: 60,
      totalMarks: 100,
      instructorId: admin.id,
      status: 'active',
      questions: [
        { text: 'Question 1', type: 'mcq', options: ['A', 'B'], answer: 'A' }
      ]
    });

    // 3. Create a High Risk Submission (Anomaly Engine Demo)
    await SubmissionModel.createSubmission({
      assessmentId: assessment.id,
      studentId: student.id,
      studentName: student.name,
      status: 'evaluated',
      totalScore: 50,
      maxScore: 100,
      percentage: 50,
      riskScore: 95,
      riskLevel: 'High',
      anomalyMetrics: {
        tabSwitches: 15,
        copyPastes: 8,
        timeDeviation: 2,
        ipChanges: 1
      },
      behaviorLogs: [
        { event: 'TAB_SWITCH', timestamp: new Date(), details: 'Switched to search engine' },
        { event: 'COPY_PASTE', timestamp: new Date(), details: 'Pasted 500 chars' }
      ]
    });

    // 4. Inject Suspicious Pattern Alerts
    await Notification.createManyNotifications([
      {
        recipient: admin.id,
        message: '[PATTERN: CHEATING_RING_DETECTED] Assessment Final Exam had 5 submissions within 2 mins.',
        type: 'error',
        onModel: 'User',
        relatedId: admin.id
      },
      {
        recipient: admin.id,
        message: '[PATTERN: IMPOSSIBLE_TRAVEL] User john_doe logged in from NY and London within 5 mins.',
        type: 'warning',
        onModel: 'User',
        relatedId: admin.id
      }
    ]);

    // 5. TAMPER with the Audit Log (Integrity Engine Demo)
    // First, let a real log be created via LoggingEngine
    const logEntry = await LoggingEngine.log({
      user: { name: admin.name, id: admin.id, role: admin.role },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Seed-Script' }
    }, 'ADMIN_VIEW_STATS', 'Admin viewed dashboard');

    // Now maliciously change it in the model directly (bypassing the engine)
    if (logEntry && logEntry.id) {
      await ActivityLog.updateLogForTamper(logEntry.id, {
        details: 'MALICIOUS_TAMPERED_DETAILS_BY_HACKER'
      });
    }

    res.json({ success: true, message: 'Demo data seeded successfully' });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/admin/ledger
exports.getLedger = async (req, res) => {
  try {
    const data = TransparencyLedger.getLedger();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/admin/ledger/publish
exports.publishLedger = async (req, res) => {
  try {
    const { date } = req.body;
    const dateStr = date || new Date().toISOString().split('T')[0];
    const entry = await TransparencyLedger.publishDailyRoot(dateStr);
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};