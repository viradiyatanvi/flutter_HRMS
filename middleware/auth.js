
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, "HRMS" || 'HRMS', async (err, decoded) => {
      if (err) {
        return res.sendStatus(403);
      }

      try {
        const user = await User.findById(decoded.id).populate({
          path: 'role',
          select: 'permissions accessLevel'
        });
        
        if (!user || !user.isActive) {
          return res.sendStatus(403);
        }
        
        req.user = user;
        next();
      } catch (error) {
        console.error('Error in authentication:', error);
        res.sendStatus(500);
      }
    });
  } else {
    res.sendStatus(401);
  }
};

const authorize = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !req.user.role.permissions) {
      return res.status(403).json({ message: 'Access denied. No permissions found.' });
    }

    const userPermissions = req.user.role.permissions;
    
    const hasPermission = requiredPermissions.every(required => {
      const modulePermission = userPermissions.find(
        perm => perm.module === required.module
      );
      
      if (!modulePermission) return false;
      
      return modulePermission.permissions[required.permission];
    });

    if (!hasPermission) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    next();
  };
};

module.exports = { authenticateJWT, authorize };