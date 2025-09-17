// const express = require('express');
// const { authenticateJWT } = require('../middleware/auth');
// const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
// const Attendance = require('../models/Attendance');
// const router = express.Router();

// // Get all attendance records (admin only)
// router.get('/admin/all', authenticateJWT, async (req, res) => {
//   try {
//     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
//     }

//     const { page = 1, limit = 30, userId, date, status } = req.query;
    
//     let query = {};
    
//     if (userId) {
//       query.user = userId;
//     }
    
//     if (date) {
//       const filterDate = new Date(date);
//       const nextDay = new Date(filterDate);
//       nextDay.setDate(nextDay.getDate() + 1);
      
//       query.date = {
//         $gte: filterDate,
//         $lt: nextDay
//       };
//     }
    
//     // Filter by status
//     if (status && status !== 'All') {
//       query.status = status;
//     }
    
//     const attendances = await Attendance.find(query)
//       .populate('user', 'firstName lastName email')
//       .sort({ date: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);
    
//     const total = await Attendance.countDocuments(query);
    
//     res.json({
//       attendances,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Create attendance record (admin only)
// router.post('/admin/create', authenticateJWT, async (req, res) => {
//   try {
//     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
//     }

//     const { userId, date, punchIn, punchOut, status, notes, correctionRequested, correctionReason, correctionStatus } = req.body;
    
//     if (!userId || !date || !punchIn) {
//       return res.status(400).json({ message: 'User ID, date, and punch in time are required' });
//     }
    
//     const dateParts = date.split('/');
//     if (dateParts.length !== 3) {
//       return res.status(400).json({ message: 'Date must be in MM/DD/YYYY format' });
//     }
    
//     const month = parseInt(dateParts[0]) - 1; 
//     const day = parseInt(dateParts[1]);
//     const year = parseInt(dateParts[2]);
    
//     const attendanceDate = new Date(year, month, day);
//     attendanceDate.setHours(0, 0, 0, 0);
    
//     const punchInParts = punchIn.split(':');
//     if (punchInParts.length < 2) {
//       return res.status(400).json({ message: 'Punch in time must be in HH:mm format' });
//     }
    
//     const punchInHours = parseInt(punchInParts[0]);
//     const punchInMinutes = parseInt(punchInParts[1]);
    
//     const punchInDate = new Date(attendanceDate);
//     punchInDate.setHours(punchInHours, punchInMinutes, 0, 0);
    
//     // Parse punchOut time if provided
//     let punchOutDate = null;
//     if (punchOut) {
//       const punchOutParts = punchOut.split(':');
//       if (punchOutParts.length < 2) {
//         return res.status(400).json({ message: 'Punch out time must be in HH:mm format' });
//       }
      
//       const punchOutHours = parseInt(punchOutParts[0]);
//       const punchOutMinutes = parseInt(punchOutParts[1]);
      
//       punchOutDate = new Date(attendanceDate);
//       punchOutDate.setHours(punchOutHours, punchOutMinutes, 0, 0);
//     }
    
//     const nextDay = new Date(attendanceDate);
//     nextDay.setDate(nextDay.getDate() + 1);
    
//     const existingAttendance = await Attendance.findOne({
//       user: userId,
//       date: {
//         $gte: attendanceDate,
//         $lt: nextDay
//       }
//     });
    
//     if (existingAttendance) {
//       return res.status(400).json({ message: 'Attendance record already exists for this user and date' });
//     }
    
//     let totalHours = 0;
//     if (punchOutDate) {
//       totalHours = (punchOutDate.getTime() - punchInDate.getTime()) / (1000 * 60 * 60);
//     }
    
//     const attendance = new Attendance({
//       user: userId,
//       date: attendanceDate,
//       punchIn: punchInDate,
//       punchOut: punchOutDate,
//       totalHours,
//       status: status || 'Present',
//       notes: notes || '',
//       correctionRequested: correctionRequested || false,
//       correctionReason: correctionReason || '',
//       correctionStatus: correctionStatus || 'Pending'
//     });
    
//     await attendance.save();
//     await attendance.populate('user', 'firstName lastName email');
    
//     res.status(201).json(attendance);
//   } catch (err) {
//     console.error('Error creating attendance:', err);
//     res.status(500).json({ message: 'Server error: ' + err.message });
//   }
// });

// // Update attendance record (admin only)
// // router.put('/admin/:id', authenticateJWT, async (req, res) => {
// //   try {
// //     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
// //       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
// //     }

// //     const { date, punchIn, punchOut, status, notes, correctionRequested, correctionReason, correctionStatus } = req.body;
    
// //     const attendance = await Attendance.findById(req.params.id);
    
// //     if (!attendance) {
// //       return res.status(404).json({ message: 'Attendance record not found' });
// //     }
    
// //     if (date) {
// //       const attendanceDate = new Date(date);
// //       attendanceDate.setHours(0, 0, 0, 0);
// //       attendance.date = attendanceDate;
// //     }
    
// //     if (punchIn) attendance.punchIn = new Date(punchIn);
// //     if (punchOut !== undefined) {
// //       attendance.punchOut = punchOut ? new Date(punchOut) : null;
// //     }
    
// //     if (status) attendance.status = status;
// //     if (notes !== undefined) attendance.notes = notes;
// //     if (correctionRequested !== undefined) attendance.correctionRequested = correctionRequested;
// //     if (correctionReason !== undefined) attendance.correctionReason = correctionReason;
// //     if (correctionStatus) attendance.correctionStatus = correctionStatus;
    
// //     if (punchIn || punchOut !== undefined) {
// //       if (attendance.punchOut) {
// //         const punchInTime = new Date(attendance.punchIn).getTime();
// //         const punchOutTime = new Date(attendance.punchOut).getTime();
// //         attendance.totalHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);
// //       } else {
// //         attendance.totalHours = 0;
// //       }
// //     }
    
// //     await attendance.save();
// //     await attendance.populate('user', 'firstName lastName email');
    
// //     res.json(attendance);
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ message: 'Server error' });
// //   }
// // });


// // Update attendance record (admin only)
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
    
//     // Handle date update
//     if (date) {
//       const dateParts = date.split('/');
//       if (dateParts.length !== 3) {
//         return res.status(400).json({ message: 'Date must be in MM/DD/YYYY format' });
//       }
      
//       const month = parseInt(dateParts[0]) - 1;
//       const day = parseInt(dateParts[1]);
//       const year = parseInt(dateParts[2]);
      
//       const attendanceDate = new Date(year, month, day);
//       attendanceDate.setHours(0, 0, 0, 0);
//       attendance.date = attendanceDate;
//     }
    
//     // Handle punchIn time
//     if (punchIn) {
//       const punchInParts = punchIn.split(':');
//       if (punchInParts.length < 2) {
//         return res.status(400).json({ message: 'Punch in time must be in HH:mm format' });
//       }
      
//       const punchInHours = parseInt(punchInParts[0]);
//       const punchInMinutes = parseInt(punchInParts[1]);
      
//       const punchInDate = new Date(attendance.date);
//       punchInDate.setHours(punchInHours, punchInMinutes, 0, 0);
//       attendance.punchIn = punchInDate;
//     }
    
//     // Handle punchOut time
//     if (punchOut !== undefined) {
//       if (punchOut) {
//         const punchOutParts = punchOut.split(':');
//         if (punchOutParts.length < 2) {
//           return res.status(400).json({ message: 'Punch out time must be in HH:mm format' });
//         }
        
//         const punchOutHours = parseInt(punchOutParts[0]);
//         const punchOutMinutes = parseInt(punchOutParts[1]);
        
//         const punchOutDate = new Date(attendance.date);
//         punchOutDate.setHours(punchOutHours, punchOutMinutes, 0, 0);
//         attendance.punchOut = punchOutDate;
//       } else {
//         attendance.punchOut = null;
//       }
//     }
    
//     // Update other fields
//     if (status) attendance.status = status;
//     if (notes !== undefined) attendance.notes = notes;
//     if (correctionRequested !== undefined) attendance.correctionRequested = correctionRequested;
//     if (correctionReason !== undefined) attendance.correctionReason = correctionReason;
//     if (correctionStatus) attendance.correctionStatus = correctionStatus;
    
//     // Recalculate total hours
//     if (attendance.punchIn && attendance.punchOut) {
//       const punchInTime = new Date(attendance.punchIn).getTime();
//       const punchOutTime = new Date(attendance.punchOut).getTime();
//       attendance.totalHours = (punchOutTime - punchInTime) / (1000 * 60 * 60);
//     } else {
//       attendance.totalHours = 0;
//     }
    
//     await attendance.save();
//     await attendance.populate('user', 'firstName lastName email');
    
//     res.json(attendance);
//   } catch (err) {
//     console.error('Error updating attendance:', err);
//     res.status(500).json({ message: 'Server error: ' + err.message });
//   }
// });

// // Delete attendance record (admin only)
// router.delete('/admin/:id', authenticateJWT, async (req, res) => {
//   try {
//     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
//     }

//     const attendance = await Attendance.findById(req.params.id);
    
//     if (!attendance) {
//       return res.status(404).json({ message: 'Attendance record not found' });
//     }
    
//     await Attendance.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Attendance record deleted successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });
// // Punch in
// router.post('/punch-in',authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     // already punched in today
//     const existingAttendance = await Attendance.findOne({
//       user: req.user._id,
//       date: {
//         $gte: today,
//         $lt: tomorrow
//       }
//     });
    
//     if (existingAttendance) {
//       return res.status(400).json({ message: 'You have already punched in today' });
//     }
    
//     // Create new attendance
//     const attendance = new Attendance({
//       user: req.user._id,
//       date: new Date(),
//       punchIn: new Date(),
//       status: 'Present'
//     });
    
//     await attendance.save();
//     res.status(201).json(attendance);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Punch out
// router.post('/punch-out',authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
    
//     const tomorrow = new Date(today);
//     tomorrow.setDate(tomorrow.getDate() + 1);
    
//     const attendance = await Attendance.findOne({
//       user: req.user._id,
//       date: {
//         $gte: today,
//         $lt: tomorrow
//       }
//     });
    
//     if (!attendance) {
//       return res.status(400).json({ message: 'You need to punch in first' });
//     }
    
//     if (attendance.punchOut) {
//       return res.status(400).json({ message: 'You have already punched out today' });
//     }
    
//     attendance.punchOut = new Date();
    
//     const punchInTime = new Date(attendance.punchIn).getTime();
//     const punchOutTime = new Date(attendance.punchOut).getTime();
//     attendance.totalHours = (punchOutTime - punchInTime) / (1000 * 60 * 60); 
    
//     await attendance.save();
//     res.json(attendance);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get attendance logs
// router.get('/logs',authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { page = 1, limit = 30, month, year } = req.query;
    
//     let query = { user: userId };
    
//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 1);
//       query.date = { $gte: startDate, $lt: endDate };
//     }
    
//     const attendances = await Attendance.find(query)
//       .sort({ date: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);
    
//     const total = await Attendance.countDocuments(query);
    
//     res.json({
//       attendances,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // specific user's attendance (for admins/HR)
// router.get('/logs/:userId',authenticateJWT, isEmployee, isOwnData, async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const { page = 1, limit = 30, month, year } = req.query;
    
//     let query = { user: userId };
    
//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1);
//       const endDate = new Date(year, month, 1);
//       query.date = { $gte: startDate, $lt: endDate };
//     }
    
//     const attendances = await Attendance.find(query)
//       .sort({ date: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);
    
//     const total = await Attendance.countDocuments(query);
    
//     res.json({
//       attendances,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// router.post('/correction-request/:id',authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const { reason } = req.body;
    
//     const attendance = await Attendance.findById(req.params.id);
    
//     if (!attendance) {
//       return res.status(404).json({ message: 'Attendance record not found' });
//     }
    
//     if (attendance.user.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Access denied' });
//     }
    
//     attendance.correctionRequested = true;
//     attendance.correctionReason = reason;
//     attendance.correctionStatus = 'Pending';
    
//     await attendance.save();
//     res.json(attendance);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;





const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const Attendance = require('../models/Attendance');
const router = express.Router();

// Helper function to convert date to IST
function toIST(date) {
  return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
}

// Helper function to get start of day in IST
function getStartOfDayIST(date = new Date()) {
  const istDate = toIST(date);
  istDate.setHours(0, 0, 0, 0);
  return new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000)); // Convert back to UTC for storage
}

// Helper function to get end of day in IST
function getEndOfDayIST(date = new Date()) {
  const istDate = toIST(date);
  istDate.setHours(23, 59, 59, 999);
  return new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000)); // Convert back to UTC for storage
}

// Helper function to format time in IST
function formatTimeIST(date) {
  if (!date) return null;
  const istDate = toIST(date);
  return istDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

// Helper function to format date in IST
function formatDateIST(date) {
  const istDate = toIST(date);
  return istDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Helper function to create date from Indian format string (DD/MM/YYYY)
function parseIndianDate(dateString) {
  const dateParts = dateString.split('/');
  if (dateParts.length !== 3) {
    throw new Error('Date must be in DD/MM/YYYY format');
  }
  
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const year = parseInt(dateParts[2]);
  
  // Create date in IST timezone
  const istDate = new Date(year, month, day, 0, 0, 0, 0);
  // Convert to UTC for storage
  return new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
}

// Helper function to create datetime from Indian date and time strings
function parseIndianDateTime(dateString, timeString) {
  const dateParts = dateString.split('/');
  const timeParts = timeString.split(':');
  
  if (dateParts.length !== 3) {
    throw new Error('Date must be in DD/MM/YYYY format');
  }
  
  if (timeParts.length < 2) {
    throw new Error('Time must be in HH:mm format');
  }
  
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const year = parseInt(dateParts[2]);
  const hours = parseInt(timeParts[0]);
  const minutes = parseInt(timeParts[1]);
  
  // Create date in IST timezone
  const istDate = new Date(year, month, day, hours, minutes, 0, 0);
  // Convert to UTC for storage
  return new Date(istDate.getTime() - (5.5 * 60 * 60 * 1000));
}

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
      try {
        const filterDate = parseIndianDate(date);
        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        query.date = {
          $gte: filterDate,
          $lt: nextDay
        };
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
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
    
    // Format dates and times for response
    const formattedAttendances = attendances.map(attendance => {
      const obj = attendance.toObject();
      obj.formattedDate = formatDateIST(attendance.date);
      obj.formattedPunchIn = formatTimeIST(attendance.punchIn);
      obj.formattedPunchOut = formatTimeIST(attendance.punchOut);
      return obj;
    });
    
    const total = await Attendance.countDocuments(query);
    
    res.json({
      attendances: formattedAttendances,
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
    
    try {
      const attendanceDate = parseIndianDate(date);
      const punchInDate = parseIndianDateTime(date, punchIn);
      
      let punchOutDate = null;
      if (punchOut) {
        punchOutDate = parseIndianDateTime(date, punchOut);
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
        // Calculate hours in IST
        const punchInIST = new Date(punchInDate.getTime() + (5.5 * 60 * 60 * 1000));
        const punchOutIST = new Date(punchOutDate.getTime() + (5.5 * 60 * 60 * 1000));
        totalHours = (punchOutIST.getTime() - punchInIST.getTime()) / (1000 * 60 * 60);
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
      
      // Format response for IST
      const response = attendance.toObject();
      response.formattedDate = formatDateIST(attendance.date);
      response.formattedPunchIn = formatTimeIST(attendance.punchIn);
      response.formattedPunchOut = formatTimeIST(attendance.punchOut);
      
      res.status(201).json(response);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
  } catch (err) {
    console.error('Error creating attendance:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

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
    
    try {
      // Handle date update
      if (date) {
        attendance.date = parseIndianDate(date);
      }
      
      // Handle punchIn time
      if (punchIn) {
        const currentDate = formatDateIST(attendance.date);
        attendance.punchIn = parseIndianDateTime(currentDate, punchIn);
      }
      
      // Handle punchOut time
      if (punchOut !== undefined) {
        if (punchOut) {
          const currentDate = formatDateIST(attendance.date);
          attendance.punchOut = parseIndianDateTime(currentDate, punchOut);
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
      
      // Recalculate total hours in IST
      if (attendance.punchIn && attendance.punchOut) {
        const punchInIST = new Date(attendance.punchIn.getTime() + (5.5 * 60 * 60 * 1000));
        const punchOutIST = new Date(attendance.punchOut.getTime() + (5.5 * 60 * 60 * 1000));
        attendance.totalHours = (punchOutIST.getTime() - punchInIST.getTime()) / (1000 * 60 * 60);
      } else {
        attendance.totalHours = 0;
      }
      
      await attendance.save();
      await attendance.populate('user', 'firstName lastName email');
      
      // Format response for IST
      const response = attendance.toObject();
      response.formattedDate = formatDateIST(attendance.date);
      response.formattedPunchIn = formatTimeIST(attendance.punchIn);
      response.formattedPunchOut = formatTimeIST(attendance.punchOut);
      
      res.json(response);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }
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
router.post('/punch-in', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const todayStart = getStartOfDayIST();
    const todayEnd = getEndOfDayIST();
    
    // Check if already punched in today
    const existingAttendance = await Attendance.findOne({
      user: req.user._id,
      date: {
        $gte: todayStart,
        $lt: todayEnd
      }
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'You have already punched in today' });
    }
    
    // Create new attendance with current IST time
    const now = new Date();
    const attendanceDate = getStartOfDayIST(); // Store as start of day in IST
    
    const attendance = new Attendance({
      user: req.user._id,
      date: attendanceDate,
      punchIn: now, // Store in UTC
      status: 'Present'
    });
    
    await attendance.save();
    
    // Format response for IST
    const response = attendance.toObject();
    response.formattedDate = formatDateIST(attendance.date);
    response.formattedPunchIn = formatTimeIST(attendance.punchIn);
    
    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Punch out
router.post('/punch-out', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const todayStart = getStartOfDayIST();
    const todayEnd = getEndOfDayIST();
    
    const attendance = await Attendance.findOne({
      user: req.user._id,
      date: {
        $gte: todayStart,
        $lt: todayEnd
      }
    });
    
    if (!attendance) {
      return res.status(400).json({ message: 'You need to punch in first' });
    }
    
    if (attendance.punchOut) {
      return res.status(400).json({ message: 'You have already punched out today' });
    }
    
    attendance.punchOut = new Date();
    
    // Calculate total hours in IST
    const punchInIST = new Date(attendance.punchIn.getTime() + (5.5 * 60 * 60 * 1000));
    const punchOutIST = new Date(attendance.punchOut.getTime() + (5.5 * 60 * 60 * 1000));
    attendance.totalHours = (punchOutIST.getTime() - punchInIST.getTime()) / (1000 * 60 * 60);
    
    await attendance.save();
    
    // Format response for IST
    const response = attendance.toObject();
    response.formattedDate = formatDateIST(attendance.date);
    response.formattedPunchIn = formatTimeIST(attendance.punchIn);
    response.formattedPunchOut = formatTimeIST(attendance.punchOut);
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance logs
router.get('/logs', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 30, month, year } = req.query;
    
    let query = { user: userId };
    
    if (month && year) {
      // Create date range in IST
      const startDate = parseIndianDate(`01/${month}/${year}`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Format dates and times for response
    const formattedAttendances = attendances.map(attendance => {
      const obj = attendance.toObject();
      obj.formattedDate = formatDateIST(attendance.date);
      obj.formattedPunchIn = formatTimeIST(attendance.punchIn);
      obj.formattedPunchOut = formatTimeIST(attendance.punchOut);
      return obj;
    });
    
    const total = await Attendance.countDocuments(query);
    
    res.json({
      attendances: formattedAttendances,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific user's attendance (for admins/HR)
router.get('/logs/:userId', authenticateJWT, isEmployee, isOwnData, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { page = 1, limit = 30, month, year } = req.query;
    
    let query = { user: userId };
    
    if (month && year) {
      // Create date range in IST
      const startDate = parseIndianDate(`01/${month}/${year}`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      
      query.date = { $gte: startDate, $lt: endDate };
    }
    
    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Format dates and times for response
    const formattedAttendances = attendances.map(attendance => {
      const obj = attendance.toObject();
      obj.formattedDate = formatDateIST(attendance.date);
      obj.formattedPunchIn = formatTimeIST(attendance.punchIn);
      obj.formattedPunchOut = formatTimeIST(attendance.punchOut);
      return obj;
    });
    
    const total = await Attendance.countDocuments(query);
    
    res.json({
      attendances: formattedAttendances,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Correction request
router.post('/correction-request/:id', authenticateJWT, isEmployee, async (req, res) => {
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
    
    // Format response for IST
    const response = attendance.toObject();
    response.formattedDate = formatDateIST(attendance.date);
    response.formattedPunchIn = formatTimeIST(attendance.punchIn);
    response.formattedPunchOut = formatTimeIST(attendance.punchOut);
    
    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;