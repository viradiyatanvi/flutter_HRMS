const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const LeaveType = require('../models/LeaveType');
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveCalculator = require('../utils/leaveCalculator');
const router = express.Router();

// Get all leave types (admin only)
router.get('/admin/leave-types', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { page = 1, limit = 50, isActive } = req.query;
    
    let query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const leaveTypes = await LeaveType.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await LeaveType.countDocuments(query);
    
    res.json({
      leaveTypes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create leave type (admin only)
router.post('/admin/leave-types/create', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { name, description, maxDays, carryForward, maxCarryForwardDays, requiresApproval, isActive, colorCode } = req.body;
    
    if (!name || !maxDays) {
      return res.status(400).json({ message: 'Name and max days are required' });
    }
    
    const existingLeaveType = await LeaveType.findOne({ name });
    if (existingLeaveType) {
      return res.status(400).json({ message: 'Leave type with this name already exists' });
    }
    
    const leaveType = new LeaveType({
      name,
      description,
      maxDays,
      carryForward: carryForward || false,
      maxCarryForwardDays: carryForward ? (maxCarryForwardDays || 0) : 0,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
      isActive: isActive !== undefined ? isActive : true,
      colorCode: colorCode || '#3B82F6'
    });
    
    await leaveType.save();
    res.status(201).json(leaveType);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete leave type (admin only)
router.delete('/admin/leave-types/del/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const leaveType = await LeaveType.findById(req.params.id);
    
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }
    
    const applicationsCount = await LeaveApplication.countDocuments({ 
      leaveType: req.params.id 
    });
    
    if (applicationsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete leave type. It is being used in existing leave applications.' 
      });
    }
    
    const balancesCount = await LeaveBalance.countDocuments({ 
      leaveType: req.params.id 
    });
    
    if (balancesCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete leave type. It is being used in existing leave balances.' 
      });
    }
    
    await LeaveType.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Leave type deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update leave type (admin only)
router.put('/admin/leave-types/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { name, description, maxDays, carryForward, maxCarryForwardDays, requiresApproval, isActive, colorCode } = req.body;
    
    const leaveType = await LeaveType.findById(req.params.id);
    if (!leaveType) {
      return res.status(404).json({ message: 'Leave type not found' });
    }
    
    if (name && name !== leaveType.name) {
      const existingLeaveType = await LeaveType.findOne({ name });
      if (existingLeaveType) {
        return res.status(400).json({ message: 'Leave type with this name already exists' });
      }
      leaveType.name = name;
    }
    
    if (description !== undefined) leaveType.description = description;
    if (maxDays !== undefined) leaveType.maxDays = maxDays;
    if (carryForward !== undefined) leaveType.carryForward = carryForward;
    if (maxCarryForwardDays !== undefined) leaveType.maxCarryForwardDays = maxCarryForwardDays;
    if (requiresApproval !== undefined) leaveType.requiresApproval = requiresApproval;
    if (isActive !== undefined) leaveType.isActive = isActive;
    if (colorCode) leaveType.colorCode = colorCode;
    
    await leaveType.save();
    res.json(leaveType);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all leave applications (admin only)
router.get('/admin/applications', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR/Manager privileges required.' });
    }

    const { page = 1, limit = 50, status, userId, leaveType, startDate, endDate } = req.query;
    
    let query = {};
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (userId) {
      query.user = userId;
    }
    
    if (leaveType) {
      query.leaveType = leaveType;
    }
    
    if (startDate && endDate) {
      query.startDate = { $gte: new Date(startDate) };
      query.endDate = { $lte: new Date(endDate) };
    }
    
    const applications = await LeaveApplication.find(query)
      .populate('user', 'firstName lastName email')
      .populate('leaveType')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await LeaveApplication.countDocuments(query);
    
    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject leave application (admin/manager only)
router.put('/admin/applications/:id/status', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR/Manager privileges required.' });
    }

    const { status, rejectionReason } = req.body;
    
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be either Approved or Rejected' });
    }
    
    const application = await LeaveApplication.findById(req.params.id)
      .populate('user')
      .populate('leaveType');
    
    if (!application) {
      return res.status(404).json({ message: 'Leave application not found' });
    }
    
    if (application.status !== 'Pending') {
      return res.status(400).json({ message: 'Application has already been processed' });
    }
    
    application.status = status;
    application.approvedBy = req.user._id;
    application.approvedAt = new Date();
    
    if (status === 'Rejected' && rejectionReason) {
      application.rejectionReason = rejectionReason;
    }
    
    if (status === 'Approved') {
      await LeaveCalculator.updateLeaveBalance(
        application.user._id,
        application.leaveType._id,
        application.totalDays
      );
    }
    
    await application.save();
    
    await application.populate('approvedBy', 'firstName lastName');
    
    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave balances for all users (admin only)
router.get('/admin/balances', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { page = 1, limit = 50, userId, year = new Date().getFullYear() } = req.query;
    
    let query = { year: parseInt(year) };
    
    if (userId) {
      query.user = userId;
    }
    
    const balances = await LeaveBalance.find(query)
      .populate('user', 'firstName lastName email')
      .populate('leaveType')
      .sort({ 'user.firstName': 1, 'leaveType.name': 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await LeaveBalance.countDocuments(query);
    
    res.json({
      balances,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ===== USER ROUTES =====

// Get available leave types for user
router.get('/leave-types', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find({ isActive: true });
    res.json(leaveTypes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's leave balance
router.get('/balance', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const balances = await LeaveBalance.find({
      user: req.user._id,
      year: parseInt(year)
    }).populate('leaveType');
    
    res.json(balances);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for leave
router.post('/apply', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason, emergencyContact, handoverNotes, attachments } = req.body;
    
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'Leave type, start date, end date, and reason are required' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      return res.status(400).json({ message: 'Start date cannot be after end date' });
    }
    
    if (start < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ message: 'Cannot apply for leave in the past' });
    }
    
    const totalDays = LeaveCalculator.calculateWorkingDays(start, end);
    
    if (totalDays <= 0) {
      return res.status(400).json({ message: 'No working days in the selected period' });
    }
    
    // Check leave balance
    const canApply = await LeaveCalculator.canApplyForLeave(req.user._id, leaveType, totalDays);
    
    if (!canApply) {
      return res.status(400).json({ message: 'Insufficient leave balance' });
    }
    
    const leaveApplication = new LeaveApplication({
      user: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      emergencyContact: emergencyContact || '',
      handoverNotes: handoverNotes || '',
      attachments: attachments || []
    });
    
    await leaveApplication.save();
    
    await leaveApplication.populate('leaveType');
    await leaveApplication.populate('user', 'firstName lastName email');
    
    res.status(201).json(leaveApplication);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's leave applications
router.get('/applications', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, year } = req.query;
    
    let query = { user: req.user._id };
    
    if (status && status !== 'All') {
      query.status = status;
    }
    
    if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year) + 1, 0, 1);
      query.startDate = { $gte: startDate, $lt: endDate };
    }
    
    const applications = await LeaveApplication.find(query)
      .populate('leaveType')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await LeaveApplication.countDocuments(query);
    
    res.json({
      applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific leave application
router.get('/applications/:id', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const application = await LeaveApplication.findById(req.params.id)
      .populate('leaveType')
      .populate('approvedBy', 'firstName lastName')
      .populate('user', 'firstName lastName email');
    
    if (!application) {
      return res.status(404).json({ message: 'Leave application not found' });
    }
    
    if (application.user._id.toString() !== req.user._id.toString() && 
        !['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel leave application
router.put('/applications/:id/cancel', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const application = await LeaveApplication.findById(req.params.id);
    
    if (!application) {
      return res.status(404).json({ message: 'Leave application not found' });
    }
    
    if (application.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (application.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending applications can be cancelled' });
    }
    
    application.status = 'Cancelled';
    await application.save();
    
    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave summary for dashboard
router.get('/summary', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const balances = await LeaveBalance.find({
      user: req.user._id,
      year: currentYear
    }).populate('leaveType');
    
    const pendingCount = await LeaveApplication.countDocuments({
      user: req.user._id,
      status: 'Pending'
    });
    
    const upcomingLeaves = await LeaveApplication.find({
      user: req.user._id,
      status: 'Approved',
      startDate: { $gte: new Date() }
    })
    .populate('leaveType')
    .sort({ startDate: 1 })
    .limit(5);
    
    res.json({
      balances,
      pendingCount,
      upcomingLeaves
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;