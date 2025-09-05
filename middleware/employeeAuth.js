const { authenticateJWT } = require('./auth');

const isEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const allowedAccessLevels = ['Employee', 'Team Manager', 'HR Manager', 'Admin'];
  if (!allowedAccessLevels.includes(req.user.role.accessLevel)) {
    return res.status(403).json({ message: 'Access denied. Employee privileges required.' });
  }
  
  next();
};

const isOwnData = (req, res, next) => {
  const requestedUserId = req.params.userId;
  
  if (req.user.role.accessLevel === 'Admin' || req.user.role.accessLevel === 'HR Manager') {
    return next();
  }
  
  if (requestedUserId && requestedUserId !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Access denied. You can only access your own data.' });
  }
  
  next();
};

module.exports = { isEmployee, isOwnData };