const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee } = require('../middleware/employeeAuth');
const Attendance = require('../models/Attendance');
const Payslip = require('../models/Payslip');
const Announcement = require('../models/Announcement');
const router = express.Router();

router.get('/',authenticateJWT, isEmployee, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAttendance = await Attendance.findOne({
      user: req.user._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    const recentPayslips = await Payslip.find({
      user: req.user._id
    })
    .sort({ year: -1, month: -1 })
    .limit(3);
    
    const announcements = await Announcement.find({
      isActive: true,
      $or: [
        { targetAudience: 'All' },
        { targetAudience: req.user.role.accessLevel }
      ],
      publishDate: { $lte: new Date() },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    })
    .sort({ publishDate: -1 })
    .limit(5);
    
    res.json({
      todayAttendance,
      recentPayslips,
      announcements
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;