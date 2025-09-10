// const { authenticateJWT } = require('./auth');

// const isEmployee = (req, res, next) => {
//   try {
//     // Step 1: Check if req.user exists
//     if (!req.user) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Authentication required. Please login first.'
//       });
//     }

//     // Step 2: Check if user.role exists and has accessLevel
//     if (!req.user.role || !req.user.role.accessLevel) {
//       return res.status(403).json({
//         success: false,
//         message: 'Role or access level not found for this user.'
//       });
//     }

//     // Step 3: Check allowed access levels
//     const allowedAccessLevels = ['Employee', 'Team Manager', 'HR Manager', 'Admin'];
//     if (!allowedAccessLevels.includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ 
//         success: false,
//         message: 'Access denied. Employee privileges required.'
//       });
//     }

//     next();
//   } catch (err) {
//     console.error('isEmployee middleware error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error in isEmployee middleware.'
//     });
//   }
// };

// const isOwnData = (req, res, next) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ 
//         success: false,
//         message: 'Authentication required.'
//       });
//     }

//     if (!req.user.role || !req.user.role.accessLevel) {
//       return res.status(403).json({
//         success: false,
//         message: 'Role or access level not found for this user.'
//       });
//     }

//     const requestedUserId = req.params.userId;

//     // Admin & HR Manager can access anyone's data
//     if (['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
//       return next();
//     }

//     if (requestedUserId && requestedUserId !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied. You can only access your own data.'
//       });
//     }

//     next();
//   } catch (err) {
//     console.error('isOwnData middleware error:', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Server error in isOwnData middleware.'
//     });
//   }
// };

// module.exports = { isEmployee, isOwnData };



const { authenticateJWT } = require('./auth');

const isEmployee = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. Please login first.'
      });
    }

    if (!req.user.role || !req.user.role.accessLevel) {
      return res.status(403).json({
        success: false,
        message: 'Role or access level not found for this user.'
      });
    }

    const allowedAccessLevels = ['Employee', 'Team Manager', 'HR Manager', 'Admin', 'Finance'];
    if (!allowedAccessLevels.includes(req.user.role.accessLevel)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Employee privileges required.'
      });
    }

    next();
  } catch (err) {
    console.error('isEmployee middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error in isEmployee middleware.'
    });
  }
};

const isOwnData = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!req.user.role || !req.user.role.accessLevel) {
      return res.status(403).json({
        success: false,
        message: 'Role or access level not found for this user.'
      });
    }

    const requestedUserId = req.params.userId;

    if (['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return next();
    }

    if (req.user.role.accessLevel === 'Team Manager') {
      return next();
    }

    if (requestedUserId && requestedUserId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own data.'
      });
    }

    next();
  } catch (err) {
    console.error('isOwnData middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error in isOwnData middleware.'
    });
  }
};

module.exports = { isEmployee, isOwnData };