const jwt = require('jsonwebtoken');
const UserModel = require('../models/user');
const auditLogger = require('../services/auditLogger');
const Notification = require('../models/Notification');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });
};

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, instituteCode } = req.body;

    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin registration is not allowed' });
    }

    const user = await UserModel.createUser({ name, email, password, role, instituteCode });

    await auditLogger.logActivity(
      req,
      'USER_CREATED',
      `New ${role} registered: ${name}`,
      { name, email, role, instituteCode }
    );

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        instituteCode: user.instituteCode
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await UserModel.getUserByEmail(email, true); // includePassword = true
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    const isMatch = await UserModel.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is suspended' });
    }

    await auditLogger.logActivity(
      req,
      'USER_LOGIN',
      `${user.role} logged in: ${user.name}`,
      { email: user.email, role: user.role }
    );

    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        instituteCode: user.instituteCode,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await UserModel.getUserById(req.user.id);
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        instituteCode: user.instituteCode,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address, department, specialization, experience, bio } = req.body;

    const user = await UserModel.updateUser(req.user.id, {
      name,
      profile: {
        ...(req.user.profile || {}),
        phone,
        address,
        department,
        specialization,
        experience,
        bio
      }
    });

    await auditLogger.logActivity(
      req,
      'USER_UPDATED',
      `Profile updated: ${user.name}`,
      { changedFields: ['profile'] }
    );

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        instituteCode: user.instituteCode,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.getUserById(req.user.id, true);
    const isMatch = await UserModel.comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedNew = await UserModel.hashPassword(newPassword);
    await UserModel.updateUser(user.id, { password: hashedNew });

    await auditLogger.logActivity(
      req,
      'PASSWORD_CHANGED',
      `Password changed: ${user.name}`,
      { userId: user.id }
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/auth/typing-baseline
exports.saveTypingBaseline = async (req, res) => {
  try {
    const { mean, stdDev, samples } = req.body;

    const user = await UserModel.updateUser(req.user.id, {
      typingBaseline: { mean, stdDev, samples }
    });

    await auditLogger.logActivity(
      req,
      'TYPING_BASELINE_UPDATED',
      `Typing baseline saved for user: ${user.name}`,
      { samples }
    );

    res.json({ success: true, message: 'Typing baseline saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};