const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const Payslip = require('../models/Payslip');
const User = require('../models/User');
const router = express.Router();

// Get own payslips
router.get('/', isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 12 } = req.query;
    
    const payslips = await Payslip.find({ user: userId })
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payslip.countDocuments({ user: userId });
    
    res.json({
      payslips,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific user's payslips (for admins/HR)
router.get('/user/:userId', isEmployee, isOwnData, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 12 } = req.query;
    
    const payslips = await Payslip.find({ user: userId })
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payslip.countDocuments({ user: userId });
    
    res.json({
      payslips,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific payslip
router.get('/detail/:id', isEmployee, async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id);
    
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    
    if (payslip.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get latest payslip
router.get('/latest', isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const payslip = await Payslip.findOne({ user: userId })
      .sort({ year: -1, month: -1 });
    
    if (!payslip) {
      return res.status(404).json({ message: 'No payslips found' });
    }
    
    res.json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get latest payslip for specific user (for admins/HR)
router.get('/latest/:userId', isEmployee, isOwnData, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const payslip = await Payslip.findOne({ user: userId })
      .sort({ year: -1, month: -1 });
    
    if (!payslip) {
      return res.status(404).json({ message: 'No payslips found' });
    }
    
    res.json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/create', async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { userId, month, year, basicSalary, components, paymentDate, status } = req.body;
    
    if (!userId || !month || !year || !basicSalary) {
      return res.status(400).json({ message: 'User ID, month, year, and basic salary are required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const existingPayslip = await Payslip.findOne({ 
      user: userId, 
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    if (existingPayslip) {
      return res.status(400).json({ 
        message: 'Payslip already exists for this user and period' 
      });
    }
    
    let totalEarnings = 0;
    let totalDeductions = 0;
    
    if (components && Array.isArray(components)) {
      components.forEach(component => {
        if (component.type === 'Earning') {
          totalEarnings += component.amount;
        } else if (component.type === 'Deduction') {
          totalDeductions += component.amount;
        }
      });
    }
    
    const netSalary = basicSalary + totalEarnings - totalDeductions;
    
    const payslip = new Payslip({
      user: userId,
      month: parseInt(month),
      year: parseInt(year),
      basicSalary,
      components: components || [],
      totalEarnings,
      totalDeductions,
      netSalary,
      paymentDate: paymentDate || new Date(),
      status: status || 'Generated'
    });
    
    await payslip.save();
    
    await payslip.populate('user', 'firstName lastName email');
    
    res.status(201).json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;