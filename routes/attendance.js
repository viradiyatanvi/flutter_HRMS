const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const Attendance = require('../models/Attendance');
const router = express.Router();

// Punch in
router.post('/punch-in', isEmployee, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // already punched in today
    const existingAttendance = await Attendance.findOne({
      user: req.user._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'You have already punched in today' });
    }
    
    // Create new attendance
    const attendance = new Attendance({
      user: req.user._id,
      date: new Date(),
      punchIn: new Date(),
      status: 'Present'
    });
    
    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Punch out
router.post('/punch-out', isEmployee, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    if (!attendance) {
      return res.status(400).json({ message: 'You need to punch in first' });
    }
    
    if (attendance.punchOut) {
      return res.status(400).json({ message: 'You have already punched out today' });
    }
    
    attendance.punchOut = new Date();
    
    const punchInTime = new Date(attendance.punchIn).getTime();
    const punchOutTime = new Date(attendance.punchOut).getTime();
    attendance.totalHours = (punchOutTime - punchInTime) / (1000 * 60 * 60); 
    
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get own attendance logs
router.get('/logs', isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 30, month, year } = req.query;
    
    let query = { user: userId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Attendance.countDocuments(query);
    
    res.json({
      attendances,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// specific user's attendance (for admins/HR)
router.get('/logs/:userId', isEmployee, isOwnData, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 30, month, year } = req.query;
    
    let query = { user: userId };
    
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Attendance.countDocuments(query);
    
    res.json({
      attendances,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/correction-request/:id', isEmployee, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    if (attendance.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    attendance.correctionRequested = true;
    attendance.correctionReason = reason;
    attendance.correctionStatus = 'Pending';
    
    await attendance.save();
    res.json(attendance);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;