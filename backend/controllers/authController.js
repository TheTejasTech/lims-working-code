const User = require('../models/User');
const Role = require('../models/Role');
const RefreshToken = require('../models/RefreshToken');
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshCookieOptions,
} = require('../utils/tokenUtils');

const formatUserResponse = (user) => ({
  _id: user._id,
  userId: user.userId,
  userName: user.userName,
  userCategory: user.userCategory,
  department: user.department,
  emailId: user.emailId,
  contactNo: user.contactNo,
  designation: user.designation,
  employeeId: user.employeeId,
  profilePhoto: user.profilePhoto,
  isSamplePrep: user.isSamplePrep,
  openDispatchRights: user.openDispatchRights,
  userInitial: user.userInitial,
  role: user.role,
});

const createRefreshTokenRecord = async (userId, token, req) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({
    user: userId,
    token,
    expiresAt,
    createdByIp: req.ip,
  });
  return token;
};

const revokeRefreshToken = async (token) => {
  const record = await RefreshToken.findOne({ token, revokedAt: null });
  if (record) {
    record.revokedAt = new Date();
    await record.save();
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ success: false, message: 'User ID and password required' });
    }

    const user = await User.findOne({ userId: userId.trim() })
      .select('+password')
      .populate('role');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    await createRefreshTokenRecord(user._id, refreshToken, req);

    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    return res.json({
      success: true,
      accessToken,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const stored = await RefreshToken.findOne({
      token,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!stored) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findById(stored.user).populate('role');
    if (!user || user.isDisabled) {
      await revokeRefreshToken(token);
      return res.status(401).json({ success: false, message: 'User not found or disabled' });
    }

    const newRefreshToken = generateRefreshToken();
    stored.revokedAt = new Date();
    stored.replacedByToken = newRefreshToken;
    await stored.save();
    await createRefreshTokenRecord(user._id, newRefreshToken, req);

    const accessToken = generateAccessToken(user._id);
    res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

    return res.json({
      success: true,
      accessToken,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return res.status(500).json({ success: false, message: 'Server error during token refresh' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) await revokeRefreshToken(token);

    res.clearCookie('refreshToken', { path: '/api/auth' });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  return res.json({ success: true, user: formatUserResponse(req.user) });
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { userId, userName, password, emailId, contactNo, department, designation, employeeId } =
      req.body;

    if (!userId || !userName || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID, name, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const exists = await User.findOne({ userId: userId.trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'User ID already taken' });
    }

    let role = await Role.findOne({ roleName: 'Standard User' });
    if (!role) {
      const { buildDefaultPages } = require('../../shared/constants');
      const pages = buildDefaultPages().map((p) => ({
        ...p,
        canView: ['dashboard', 'samples', 'customers', 'workshop'].includes(p.pageName),
      }));
      role = await Role.create({
        roleName: 'Standard User',
        roleDescription: 'Default role for registered users',
        dashboard: '/dashboard',
        pages,
      });
    }

    const user = await User.create({
      userId: userId.trim(),
      userName,
      password,
      role: role._id,
      userCategory: 'standard',
      emailId,
      contactNo,
      department,
      designation,
      employeeId,
      userInitial: userName.substring(0, 3).toUpperCase(),
      remoteLogin: true,
    });

    const populated = await User.findById(user._id).populate('role');
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken();
    await createRefreshTokenRecord(user._id, refreshToken, req);
    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      user: formatUserResponse(populated),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { login, refresh, logout, getMe, register, formatUserResponse };
