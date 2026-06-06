/** Role-based access: category check + page-level CRUD rights */

const checkRole = (...allowedCategories) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (allowedCategories.length && !allowedCategories.includes(req.user.userCategory)) {
    return res.status(403).json({ success: false, message: 'Insufficient role privileges' });
  }

  next();
};

const checkPagePermission = (pageName, action = 'canView') => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (req.user.userCategory === 'admin') return next();

  const role = req.user.role;
  if (!role || !role.pages) {
    return res.status(403).json({ success: false, message: 'No permissions configured' });
  }

  const pagePerm = role.pages.find((p) => p.pageName === pageName);
  if (!pagePerm || !pagePerm[action]) {
    return res.status(403).json({
      success: false,
      message: `Permission denied: ${action} on ${pageName}`,
    });
  }

  next();
};

module.exports = { checkRole, checkPagePermission };
