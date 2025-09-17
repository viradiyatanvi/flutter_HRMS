const express = require('express');
const Payroll = require('../models/Payroll');
const PayrollSetting = require('../models/PayrollSetting');
const User = require('../models/User');
const { authenticateJWT, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all payroll records (Admin only)
router.get('/', authenticateJWT, authorize([{ module: 'Payroll', permission: 'manage' }]), async (req, res) => {
  try {
    const { page = 1, limit = 10, month, year, status } = req.query;
    
    let filter = {};
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (status) filter.status = status;
    
    const payrolls = await Payroll.find(filter)
      .populate('employee', 'firstName lastName email')
      .populate('generatedBy', 'firstName lastName')
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

// Generate payroll for employee
router.post('/generate', authenticateJWT, authorize([{ module: 'Payroll', permission: 'create' }]), async (req, res) => {
  try {
    const { employeeId, month, year, salaryStructure, deductions, bonuses, notes } = req.body;
    const existingPayroll = await Payroll.findOne({ 
      employee: employeeId, 
      month: parseInt(month), 
      year: parseInt(year) 
    });
    
    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already generated for this period' });
    }
    
    const payroll = new Payroll({
      employee: employeeId,
      month: parseInt(month),
      year: parseInt(year),
      salaryStructure,
      deductions,
      bonuses,
      notes,
      generatedBy: req.user._id,
      status: 'Generated'
    });
    
    await payroll.save();
    await payroll.populate('employee', 'firstName lastName email');
    
    res.status(201).json(payroll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payroll
router.put('/:id', authenticateJWT, authorize([{ module: 'Payroll', permission: 'edit' }]), async (req, res) => {
  try {
    const { salaryStructure, deductions, bonuses, status, paymentDate, notes } = req.body;
    
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }
    
    if (salaryStructure) payroll.salaryStructure = salaryStructure;
    if (deductions) payroll.deductions = deductions;
    if (bonuses) payroll.bonuses = bonuses;
    if (status) payroll.status = status;
    if (paymentDate) payroll.paymentDate = paymentDate;
    if (notes) payroll.notes = notes;
    
    await payroll.save();
    await payroll.populate('employee', 'firstName lastName email');
    
    res.json(payroll);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark payroll as paid
router.patch('/:id/mark-paid', authenticateJWT, authorize([{ module: 'Payroll', permission: 'edit' }]), async (req, res) => {
  try {
    const { paymentDate, paymentMethod } = req.body;
    
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }
    
    payroll.status = 'Paid';
    payroll.paymentDate = paymentDate || new Date();
    payroll.paymentMethod = paymentMethod || 'Bank Transfer';
    
    await payroll.save();
    
    res.json({ message: 'Payroll marked as paid', payroll });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete payroll
router.delete('/:id', authenticateJWT, authorize([{ module: 'Payroll', permission: 'delete' }]), async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }
    
    if (payroll.status === 'Paid') {
      return res.status(400).json({ message: 'Cannot delete paid payroll' });
    }
    
    await Payroll.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Payroll deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payroll settings
router.get('/settings', authenticateJWT, authorize([{ module: 'Payroll', permission: 'manage' }]), async (req, res) => {
  try {
    const settings = await PayrollSetting.findOne();
    res.json(settings || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payroll settings
router.put('/settings/update', authenticateJWT, authorize([{ module: 'Payroll', permission: 'manage' }]), async (req, res) => {
  try {
    const settings = await PayrollSetting.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );
    
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate salary slips in bulk
router.post('/generate-bulk', authenticateJWT, authorize([{ module: 'Payroll', permission: 'create' }]), async (req, res) => {
  try {
    const { month, year, employeeIds } = req.body;
    
    const results = {
      success: [],
      errors: []
    };
    
    for (const employeeId of employeeIds) {
      try {
        const existingPayroll = await Payroll.findOne({ 
          employee: employeeId, 
          month: parseInt(month), 
          year: parseInt(year) 
        });
        
        if (existingPayroll) {
          results.errors.push({
            employee: employeeId,
            message: 'Payroll already exists for this period'
          });
          continue;
        }
        
        const employee = await User.findById(employeeId).populate('profile');
        
        if (!employee || !employee.profile) {
          results.errors.push({
            employee: employeeId,
            message: 'Employee or profile not found'
          });
          continue;
        }
        
        const basicSalary = employee.profile.basicSalary || 0;
        
        const payroll = new Payroll({
          employee: employeeId,
          month: parseInt(month),
          year: parseInt(year),
          salaryStructure: {
            basic: basicSalary,
            hra: basicSalary * 0.4,
            conveyance: 1600,
            medicalAllowance: 1250,
            specialAllowance: basicSalary * 0.2 
          },
          deductions: {
            pf: basicSalary * 0.12, 
            esi: basicSalary * 0.0075, 
            professionalTax: 200
          },
          generatedBy: req.user._id,
          status: 'Generated'
        });
        
        await payroll.save();
        results.success.push(employeeId);
      } catch (error) {
        results.errors.push({
          employee: employeeId,
          message: error.message
        });
      }
    }
    
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;