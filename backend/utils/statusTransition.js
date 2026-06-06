const { VALID_STATUS_TRANSITIONS } = require('../../shared/constants');

const canTransition = (currentStatus, newStatus) => {
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
};

const validateStatusTransition = (req, res, next) => {
  const { status: newStatus } = req.body;
  if (!newStatus) return next();

  const current = req.sample?.status || req.body._currentStatus;
  if (!current) return next();

  if (!canTransition(current, newStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status transition: ${current} → ${newStatus}`,
    });
  }
  next();
};

module.exports = { canTransition, validateStatusTransition };
