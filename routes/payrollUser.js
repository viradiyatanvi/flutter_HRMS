const express = require('express');
const Payroll = require('../models/Payroll');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const PDFDocument =require('pdfkit');
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
// router.get('/payslip/:id/download', authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const payroll = await Payroll.findById(req.params.id)
//       .populate('employee', 'firstName lastName employeeId');
    
//     if (!payroll) {
//       return res.status(404).json({ message: 'Payslip not found' });
//     }
    
//     // Check if user is authorized to view this payslip
//     if (payroll.employee._id.toString() !== req.user._id.toString() && 
//         !['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
    
//     res.setHeader('Content-Type', 'application/pdf');
//     res.setHeader('Content-Disposition', `attachment; filename=payslip-${payroll.month}-${payroll.year}.pdf`);
    
//     res.json({
//       message: 'PDF generation would happen here',
//       payroll: {
//         employee: payroll.employee,
//         month: payroll.month,
//         year: payroll.year,
//         netSalary: payroll.netSalary
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


router.get('/payslip/:id/download', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employee', 'firstName lastName employeeId designation department');

    if (!payroll) {
      return res.status(404).json({ message: 'Payslip not found' });
    }

    // Check authorization
    if (payroll.employee._id.toString() !== req.user._id.toString() && 
        !['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Create PDF document
    const doc = new PDFDocument();
    
    // Set response headers for PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip-${payroll.month}-${payroll.year}-${payroll.employee.employeeId}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('PAYSLIP', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Employee: ${payroll.employee.firstName} ${payroll.employee.lastName}`);
    doc.text(`Employee ID: ${payroll.employee.employeeId}`);
    doc.text(`Designation: ${payroll.employee.designation || 'N/A'}`);
    doc.text(`Department: ${payroll.employee.department || 'N/A'}`);
    doc.moveDown();
    
    doc.text(`Period: ${payroll.month}/${payroll.year}`);
    doc.text(`Payment Date: ${payroll.paymentDate ? payroll.paymentDate.toDateString() : 'N/A'}`);
    doc.moveDown();

    // Earnings section
    doc.fontSize(14).text('EARNINGS', { underline: true });
    doc.fontSize(12);
    doc.text(`Basic Salary: ₹${payroll.salaryStructure.basic.toFixed(2)}`);
    doc.text(`HRA: ₹${payroll.salaryStructure.hra.toFixed(2)}`);
    doc.text(`Conveyance: ₹${payroll.salaryStructure.conveyance.toFixed(2)}`);
    doc.text(`Medical Allowance: ₹${payroll.salaryStructure.medicalAllowance.toFixed(2)}`);
    doc.text(`Special Allowance: ₹${payroll.salaryStructure.specialAllowance.toFixed(2)}`);
    doc.text(`Other Allowances: ₹${payroll.salaryStructure.otherAllowances.toFixed(2)}`);
    doc.text(`Total Earnings: ₹${payroll.totalEarnings.toFixed(2)}`, { align: 'right' });
    doc.moveDown();

    // Deductions section
    doc.fontSize(14).text('DEDUCTIONS', { underline: true });
    doc.fontSize(12);
    doc.text(`TDS: ₹${payroll.deductions.tds.toFixed(2)}`);
    doc.text(`PF: ₹${payroll.deductions.pf.toFixed(2)}`);
    doc.text(`ESI: ₹${payroll.deductions.esi.toFixed(2)}`);
    doc.text(`Professional Tax: ₹${payroll.deductions.professionalTax.toFixed(2)}`);
    doc.text(`Loan: ₹${payroll.deductions.loan.toFixed(2)}`);
    doc.text(`Other Deductions: ₹${payroll.deductions.otherDeductions.toFixed(2)}`);
    doc.text(`Total Deductions: ₹${payroll.totalDeductions.toFixed(2)}`, { align: 'right' });
    doc.moveDown();

    // Net Salary
    doc.fontSize(16).text(`NET SALARY: ₹${payroll.netSalary.toFixed(2)}`, { align: 'center', bold: true });
    doc.moveDown();

    // Footer
    doc.fontSize(10).text('This is a computer generated payslip and does not require signature.', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (err) {
    console.error('Payslip download error:', err);
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