// const express = require('express');
// const { authenticateJWT } = require('../middleware/auth');
// const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
// const Payslip = require('../models/Payslip');
// const User = require('../models/User');
// const router = express.Router();

// // Get own payslips
// router.get('/',authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { page = 1, limit = 12 } = req.query;
    
//     const payslips = await Payslip.find({ user: userId })
//       .sort({ year: -1, month: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);
    
//     const total = await Payslip.countDocuments({ user: userId });
    
//     res.json({
//       payslips,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get specific user's payslips (for admins/HR)
// router.get('/user/:userId',authenticateJWT, isEmployee, isOwnData, async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const { page = 1, limit = 12 } = req.query;
    
//     const payslips = await Payslip.find({ user: userId })
//       .sort({ year: -1, month: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);
    
//     const total = await Payslip.countDocuments({ user: userId });
    
//     res.json({
//       payslips,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get specific payslip
// router.get('/detail/:id',authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const payslip = await Payslip.findById(req.params.id);
    
//     if (!payslip) {
//       return res.status(404).json({ message: 'Payslip not found' });
//     }
    
//     if (payslip.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
//     res.json(payslip);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get latest payslip
// router.get('/latest', authenticateJWT,isEmployee, async (req, res) => {
//   try {
//     const userId = req.user._id;
    
//     const payslip = await Payslip.findOne({ user: userId })
//       .sort({ year: -1, month: -1 });
    
//     if (!payslip) {
//       return res.status(404).json({ message: 'No payslips found' });
//     }
    
//     res.json(payslip);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get latest payslip for specific user (for admins/HR)
// router.get('/latest/:userId',authenticateJWT, isEmployee, isOwnData, async (req, res) => {
//   try {
//     const userId = req.params.userId;
    
//     const payslip = await Payslip.findOne({ user: userId })
//       .sort({ year: -1, month: -1 });
    
//     if (!payslip) {
//       return res.status(404).json({ message: 'No payslips found' });
//     }
    
//     res.json(payslip);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// router.post('/create',authenticateJWT, async (req, res) => {
//   try {
//     if (!['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
//     }

//     const { userId, month, year, basicSalary, components, paymentDate, status } = req.body;
    
//     if (!userId || !month || !year || !basicSalary) {
//       return res.status(400).json({ message: 'User ID, month, year, and basic salary are required' });
//     }
    
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     const existingPayslip = await Payslip.findOne({ 
//       user: userId, 
//       month: parseInt(month), 
//       year: parseInt(year) 
//     });
    
//     if (existingPayslip) {
//       return res.status(400).json({ 
//         message: 'Payslip already exists for this user and period' 
//       });
//     }
    
//     let totalEarnings = 0;
//     let totalDeductions = 0;
    
//     if (components && Array.isArray(components)) {
//       components.forEach(component => {
//         if (component.type === 'Earning') {
//           totalEarnings += component.amount;
//         } else if (component.type === 'Deduction') {
//           totalDeductions += component.amount;
//         }
//       });
//     }
    
//     const netSalary = basicSalary + totalEarnings - totalDeductions;
    
//     const payslip = new Payslip({
//       user: userId,
//       month: parseInt(month),
//       year: parseInt(year),
//       basicSalary,
//       components: components || [],
//       totalEarnings,
//       totalDeductions,
//       netSalary,
//       paymentDate: paymentDate || new Date(),
//       status: status || 'Generated'
//     });
    
//     await payslip.save();
    
//     await payslip.populate('user', 'firstName lastName email');
    
//     res.status(201).json(payslip);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;


const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const Payslip = require('../models/Payslip');
const User = require('../models/User');
const router = express.Router();

// Get all payslips (for admin)
router.get('/admin/all', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { page = 1, limit = 50, search, employee, month, year, status } = req.query;
    
    let filter = {};
    
    // Search filter
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filter.user = { $in: users.map(u => u._id) };
    }
    
    // Employee filter
    if (employee) {
      filter.user = employee;
    }
    
    // Month filter
    if (month) {
      filter.month = parseInt(month);
    }
    
    // Year filter
    if (year) {
      filter.year = parseInt(year);
    }
    
    // Status filter
    if (status && status !== 'All') {
      filter.status = status;
    }
    
    const payslips = await Payslip.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ year: -1, month: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Payslip.countDocuments(filter);
    
    res.json({
      payslips,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get own payslips
router.get('/', authenticateJWT, isEmployee, async (req, res) => {
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
router.get('/user/:userId', authenticateJWT, isEmployee, isOwnData, async (req, res) => {
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
router.get('/detail/:id', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const payslip = await Payslip.findById(req.params.id).populate('user', 'firstName lastName email');
    
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    
    // Check if user owns the payslip or is admin/HR
    if (payslip.user._id.toString() !== req.user._id.toString() && 
        !['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get latest payslip
router.get('/latest', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const payslip = await Payslip.findOne({ user: userId })
      .sort({ year: -1, month: -1 })
      .populate('user', 'firstName lastName email');
    
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
router.get('/latest/:userId', authenticateJWT, isEmployee, isOwnData, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const payslip = await Payslip.findOne({ user: userId })
      .sort({ year: -1, month: -1 })
      .populate('user', 'firstName lastName email');
    
    if (!payslip) {
      return res.status(404).json({ message: 'No payslips found' });
    }
    
    res.json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create payslip
router.post('/create', authenticateJWT, async (req, res) => {
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

// Update payslip
router.put('/update/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { userId, month, year, basicSalary, components, paymentDate, status } = req.body;
    
    const payslip = await Payslip.findById(req.params.id);
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    
    if (userId && month && year) {
      const existingPayslip = await Payslip.findOne({ 
        user: userId, 
        month: parseInt(month), 
        year: parseInt(year),
        _id: { $ne: req.params.id }
      });
      
      if (existingPayslip) {
        return res.status(400).json({ 
          message: 'Another payslip already exists for this user and period' 
        });
      }
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
    
    // Update fields
    if (userId) payslip.user = userId;
    if (month) payslip.month = parseInt(month);
    if (year) payslip.year = parseInt(year);
    if (basicSalary) payslip.basicSalary = basicSalary;
    if (components) payslip.components = components;
    if (paymentDate !== undefined) payslip.paymentDate = paymentDate;
    if (status) payslip.status = status;
    
    payslip.totalEarnings = totalEarnings;
    payslip.totalDeductions = totalDeductions;
    payslip.netSalary = netSalary;
    
    await payslip.save();
    await payslip.populate('user', 'firstName lastName email');
    
    res.json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete payslip
router.delete('/delete/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Finance'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const payslip = await Payslip.findById(req.params.id);
    
    if (!payslip) {
      return res.status(404).json({ message: 'Payslip not found' });
    }
    
    await Payslip.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Payslip deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;