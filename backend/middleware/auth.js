const User = require('../models/User');
const { verifyAccessToken } = require('../utils/tokenUtils');

const protect = async (req, res, next) => {
  try {
    let token =
      req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized — no token' });
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId)
      .select('-password')
      .populate('role');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    if (!user.remoteLogin) {
      const clientIp = req.ip || req.connection?.remoteAddress;
      const allowedIps = (process.env.ALLOWED_LAB_IPS || '').split(',').filter(Boolean);
      if (allowedIps.length && !allowedIps.includes(clientIp)) {
        return res.status(403).json({
          success: false,
          message: 'Remote login not permitted for this account',
        });
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid or expired token',
    });
  }
};

module.exports = { protect };
