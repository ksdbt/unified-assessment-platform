const UserModel = require('../models/user');
const ActivityLog = require('../models/ActivityLog');
const cryptoUtils = require('../utils/cryptoUtils');
const LoggingEngine = require('../services/LoggingEngine');

// @route GET /api/users - admin only
exports.getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.listUsers({});
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/users/students
exports.getStudents = async (req, res) => {
  try {
    const students = await UserModel.listUsers({ role: 'student' });
    res.json({ success: true, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/users - admin creates user
exports.createUser = async (req, res) => {
  try {
    const { name, email, role, instituteCode } = req.body;

    const user = await UserModel.createUser({
      name,
      email,
      password: 'Password@123',
      role,
      instituteCode
    });

    await LoggingEngine.log(
      req,
      'user_created',
      `Admin created user: ${name} (${role})`
    );

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        instituteCode: user.instituteCode,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const oldUser = await UserModel.getUserById(id);

    if (oldUser && oldUser.email === 'admin@test.com') {
      return res.status(403).json({ success: false, message: 'The master admin cannot be edited or suspended.' });
    }

    const user = await UserModel.updateUser(id, req.body);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Gap Analysis 4: Delta Logging
    const delta = cryptoUtils.calculateDelta(oldUser || {}, req.body);

    await LoggingEngine.log(
      req,
      'user_updated',
      `Updated user: ${user.name}`,
      { delta }
    );

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await UserModel.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.email === 'admin@test.com') {
      return res.status(403).json({ success: false, message: 'The master admin cannot be deleted.' });
    }

    await LoggingEngine.log(
      req,
      'user_deleted',
      `Deleted user: ${user.name} (${user.role})`
    );

    await UserModel.deleteUser(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/users/instructor/students
exports.getInstructorStudentOverview = async (req, res) => {
  try {
    const Assessment = require('../models/Assessment');
    const SubmissionModel = require('../models/Submission');

    const myAssessments = await Assessment.listAssessments({ instructorId: req.user.id });
    const assessmentIds = myAssessments.map(a => a.id);

    const submissions = assessmentIds.length > 0
      ? await SubmissionModel.listSubmissions({ assessmentIds })
      : [];

    // Get unique student IDs and fetch them in one go
    const studentIds = [...new Set(submissions.map(s => s.studentId?.toString()).filter(Boolean))];
    const studentUsers = await UserModel.User.find({ _id: { $in: studentIds } });
    const studentInfoMap = {};
    studentUsers.forEach(u => {
      studentInfoMap[u._id.toString()] = u;
    });

    const studentMap = {};
    for (const sub of submissions) {
      const sid = sub.studentId?.toString();
      if (!sid) continue;
      if (!studentMap[sid]) {
        const studentUser = studentInfoMap[sid];
        studentMap[sid] = {
          id: sid,
          name: studentUser ? studentUser.name : 'Unknown',
          email: studentUser ? studentUser.email : '',
          avatar: studentUser ? studentUser.avatar : '',
          submissions: []
        };
      }
      studentMap[sid].submissions.push(sub);
    }

    const students = Object.values(studentMap).map(student => {
      const evaluated = student.submissions.filter(s => s.status === 'evaluated');

      // Calculate Trust Score based on Anomaly Metrics
      const averageTrust = student.submissions.length > 0
        ? student.submissions.reduce((acc, s) => acc + (s.trustScore !== undefined ? s.trustScore : (100 - (s.riskScore || 0))), 0) / student.submissions.length
        : 100;

      return {
        ...student,
        totalAssessments: student.submissions.length,
        completedAssessments: evaluated.length,
        averageScore: evaluated.length > 0
          ? Math.round(evaluated.reduce((acc, s) => acc + (s.percentage || 0), 0) / evaluated.length)
          : 0,
        trustScore: Math.round(averageTrust)
      };
    });

    res.json({ success: true, data: students, assessments: myAssessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/users/gemini-key
exports.updateGeminiKey = async (req, res) => {
  try {
    const { geminiKey } = req.body;
    if (!geminiKey) {
      return res.status(400).json({ success: false, message: 'Gemini Key is required' });
    }

    const user = await UserModel.updateUser(req.user.id, { geminiKey });

    await LoggingEngine.log(
      req,
      'gemini_key_updated',
      `Instructor updated their Gemini API Key`
    );

    res.json({ success: true, message: 'Gemini Key updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};