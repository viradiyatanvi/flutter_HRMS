const express = require('express');
const Payroll = require('../models/Payroll');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const router = express.Router();

// Get user's payroll history
router.get('/my-payrolls', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 12, year } = req.query;
    
    let filter = { employee: req.user._id };
    if (year) filter.year = parseInt(year);
    
    const payrolls = await Payroll.find(filter)
      .select('-generatedBy -bankDetails')
      .sort({ year: -1, month: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payroll.countDocuments(filter);
    
    res.json({
      payrolls,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific payroll slip
router.get('/payslip/:id', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .select('-generatedBy -bankDetails');
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    
    if (payroll.employee.toString() !== req.user._id.toString() && 
        !['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(payroll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download payslip as PDF
router.get('/payslip/:id/download', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId');
    
    if (!payroll) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    
    // Check if user is authorized to view this payslip
    if (payroll.employee._id.toString() !== req.user._id.toString() && 
        !['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${payroll.month}-${payroll.year}.pdf`);
    
    res.json({
      message: 'PDF generation would happen here',
      payroll: {
        employee: payroll.employee,
        month: payroll.month,
        year: payroll.year,
        netSalary: payroll.netSalary
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payroll summary for dashboard
router.get('/summary', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Get current month payroll
    const currentPayroll = await Payroll.findOne({
      employee: req.user._id,
      month: currentMonth,
      year: currentYear
    });
    
    // Get yearly summary
    const yearlySummary = await Payroll.aggregate([
      { $match: { employee: req.user._id, year: currentYear, status: 'Paid' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalEarnings' },
          totalDeductions: { $sum: '$totalDeductions' },
          netSalary: { $sum: '$netSalary' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      currentPayroll,
      yearlySummary: yearlySummary[0] || { totalEarnings: 0, totalDeductions: 0, netSalary: 0, count: 0 }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;