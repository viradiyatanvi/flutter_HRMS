const { authenticateJWT } = require('./auth');

const canManageTickets = (req, res, next) => {
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

    const allowedAccessLevels = ['Admin', 'HR Manager', 'Team Manager'];
    if (!allowedAccessLevels.includes(req.user.role.accessLevel)) {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied. Admin/Manager privileges required.'
      });
    }

    next();
  } catch (err) {
    console.error('canManageTickets middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error in canManageTickets middleware.'
    });
  }
};

const isTicketOwnerOrManager = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required.'
      });
    }

    const Ticket = require('../models/HelpdeskTicket');
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.'
      });
    }

    // Admin/HR/Manager can access any ticket
    if (['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return next();
    }

    if (ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own tickets.'
      });
    }

    next();
  } catch (err) {
    console.error('isTicketOwnerOrManager middleware error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error in isTicketOwnerOrManager middleware.'
    });
  }
};

module.exports = { canManageTickets, isTicketOwnerOrManager };