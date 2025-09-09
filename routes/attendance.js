const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const Attendance = require('../models/Attendance');
const router = express.Router();

// Get all attendance records (admin only)
router.get('/admin/all', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { page = 1, limit = 30, userId, date, status } = req.query;
    
    let query = {};
    
    if (userId) {
      query.user = userId;
    }
    
    if (date) {
      const filterDate = new Date(date);
      const nextDay = new Date(filterDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      query.date = {
        $gte: filterDate,
        $lt: nextDay
      };
    }
    
    // Filter by status
    if (status && status !== 'All') {
      query.status = status;
    }
    
    const attendances = await Attendance.find(query)
      .populate('user', 'firstName lastName email')
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

// Create attendance record (admin only)
router.post('/admin/create', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { userId, date, punchIn, punchOut, status, notes, correctionRequested, correctionReason, correctionStatus } = req.body;
    
    if (!userId || !date || !punchIn) {
      return res.status(400).json({ message: 'User ID, date, and punch in time are required' });
    }
    
    const dateParts = date.split('/');
    if (dateParts.length !== 3) {
      return res.status(400).json({ message: 'Date must be in MM/DD/YYYY format' });
    }
    
    const month = parseInt(dateParts[0]) - 1; 
    const day = parseInt(dateParts[1]);
    const year = parseInt(dateParts[2]);
    
    const attendanceDate = new Date(year, month, day);
    attendanceDate.setHours(0, 0, 0, 0);
    
    const punchInParts = punchIn.split(':');
    if (punchInParts.length < 2) {
      return res.status(400).json({ message: 'Punch in time must be in HH:mm format' });
    }
    
    const punchInHours = parseInt(punchInParts[0]);
    const punchInMinutes = parseInt(punchInParts[1]);
    
    const punchInDate = new Date(attendanceDate);
    punchInDate.setHours(punchInHours, punchInMinutes, 0, 0);
    
    // Parse punchOut time if provided
    let punchOutDate = null;
    if (punchOut) {
      const punchOutParts = punchOut.split(':');
      if (punchOutParts.length < 2) {
        return res.status(400).json({ message: 'Punch out time must be in HH:mm format' });
      }
      
      const punchOutHours = parseInt(punchOutParts[0]);
      const punchOutMinutes = parseInt(punchOutParts[1]);
      
      punchOutDate = new Date(attendanceDate);
      punchOutDate.setHours(punchOutHours, punchOutMinutes, 0, 0);
    }
    
    const nextDay = new Date(attendanceDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const existingAttendance = await Attendance.findOne({
      user: userId,
      date: {
        $gte: attendanceDate,
        $lt: nextDay
      }
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance record already exists for this user and date' });
    }
    
    let totalHours = 0;
    if (punchOutDate) {
      totalHours = (punchOutDate.getTime() - punchInDate.getTime()) / (1000 * 60 * 60);
    }
    
    const attendance = new Attendance({
      user: userId,
      date: attendanceDate,
      punchIn: punchInDate,
      punchOut: punchOutDate,
      totalHours,
      status: status || 'Present',
      notes: notes || '',
      correctionRequested: correctionRequested || false,
      correctionReason: correctionReason || '',
      correctionStatus: correctionStatus || 'Pending'
    });
    
    await attendance.save();
    await attendance.populate('user', 'firstName lastName email');
    
    res.status(201).json(attendance);
  } catch (err) {
    console.error('Error creating attendance:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Update attendance record (admin only)
// router.put('/admin/:id', authenticateJWT, async (req, res) => {
//   try {
//     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
//     }

//     const { date, punchIn, punchOut, status, notes, correctionRequested, correctionReason, correctionStatus } = req.body;
    
//     const attendance = await Attendance.findById(req.params.id);
    
//     if (!attendance) {
//       return res.status(404).json({ message: 'Attendance record not found' });
//     }
    
//     if (date) {
//       const attendanceDate = new Date(date);
//       attendanceDate.setHours(0, 0, 0, 0);
//       attendance.date = attendanceDate;
//     }
    
//     if (punchIn) attendance.punchIn = new Date(punchIn);
//     if (punchOut !== undefined) {
//       attendance.punchOut = punchOut ? new Date(punchOut) : null;
//     }
    
//     if (status) attendance.status = status;
//     if (notes !== undefined) attendance.notes = notes;
//     if (correctionRequested !== undefined) attendance.correctionRequested = correctionRequested;
//     if (correctionReason !== undefined) attendance.correctionReason = correctionReason;
//     if (correctionStatus) attendance.correctionStatus = correctionStatus;
    
//     if (punchIn || punchOut !== undefined) {
//       if (attendance.punchOut) {
//         const punchInTime = new Date(attendance.punchIn).getTime();
//         const punchOutTime = new Date(attendance.punchOut).getTime();
//         attendance.totalHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);
//       } else {
//         attendance.totalHours = 0;
//       }
//     }
    
//     await attendance.save();
//     await attendance.populate('user', 'firstName lastName email');
    
//     res.json(attendance);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// Update attendance record (admin only)
router.put('/admin/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { date, punchIn, punchOut, status, notes, correctionRequested, correctionReason, correctionStatus } = req.body;
    
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Handle date update
    if (date) {
      // Parse the date string (assuming format MM/DD/YYYY)
      const dateParts = date.split('/');
      if (dateParts.length !== 3) {
        return res.status(400).json({ message: 'Date must be in MM/DD/YYYY format' });
      }
      
      const month = parseInt(dateParts[0]) - 1;
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      const attendanceDate = new Date(year, month, day);
      attendanceDate.setHours(0, 0, 0, 0);
      attendance.date = attendanceDate;
    }
    
    // Handle punchIn time
    if (punchIn) {
      const punchInParts = punchIn.split(':');
      if (punchInParts.length < 2) {
        return res.status(400).json({ message: 'Punch in time must be in HH:mm format' });
      }
      
      const punchInHours = parseInt(punchInParts[0]);
      const punchInMinutes = parseInt(punchInParts[1]);
      
      const punchInDate = new Date(attendance.date);
      punchInDate.setHours(punchInHours, punchInMinutes, 0, 0);
      attendance.punchIn = punchInDate;
    }
    
    // Handle punchOut time
    if (punchOut !== undefined) {
      if (punchOut) {
        const punchOutParts = punchOut.split(':');
        if (punchOutParts.length < 2) {
          return res.status(400).json({ message: 'Punch out time must be in HH:mm format' });
        }
        
        const punchOutHours = parseInt(punchOutParts[0]);
        const punchOutMinutes = parseInt(punchOutParts[1]);
        
        const punchOutDate = new Date(attendance.date);
        punchOutDate.setHours(punchOutHours, punchOutMinutes, 0, 0);
        attendance.punchOut = punchOutDate;
      } else {
        attendance.punchOut = null;
      }
    }
    
    // Update other fields
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;
    if (correctionRequested !== undefined) attendance.correctionRequested = correctionRequested;
    if (correctionReason !== undefined) attendance.correctionReason = correctionReason;
    if (correctionStatus) attendance.correctionStatus = correctionStatus;
    
    // Recalculate total hours
    if (attendance.punchIn && attendance.punchOut) {
      const punchInTime = new Date(attendance.punchIn).getTime();
      const punchOutTime = new Date(attendance.punchOut).getTime();
      attendance.totalHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);
    } else {
      attendance.totalHours = 0;
    }
    
    await attendance.save();
    await attendance.populate('user', 'firstName lastName email');
    
    res.json(attendance);
  } catch (err) {
    console.error('Error updating attendance:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Delete attendance record (admin only)
router.delete('/admin/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Punch in
router.post('/punch-in',authenticateJWT, isEmployee, async (req, res) => {
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
router.post('/punch-out',authenticateJWT, isEmployee, async (req, res) => {
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

// Get attendance logs
router.get('/logs',authenticateJWT, isEmployee, async (req, res) => {
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
router.get('/logs/:userId',authenticateJWT, isEmployee, isOwnData, async (req, res) => {
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

router.post('/correction-request/:id',authenticateJWT, isEmployee, async (req, res) => {
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