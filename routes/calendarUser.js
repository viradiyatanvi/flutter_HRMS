const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee } = require('../middleware/employeeAuth');
const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/User');
const router = express.Router();

// Get user's calendar events
router.get('/events', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { startDate, endDate, eventType } = req.query;
    const userId = req.user._id;
    const userDepartment = req.user.department || 'All';

    let filter = {
      isActive: true,
      $or: [
        { department: 'All' },
        { department: userDepartment },
        { attendees: userId },
        { organizer: userId }
      ]
    };

    // Date range filter
    if (startDate && endDate) {
      filter.startDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Event type filter
    if (eventType && eventType !== 'All') {
      filter.eventType = eventType;
    }

    const events = await CalendarEvent.find(filter)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort({ startDate: 1 })
      .select('-isActive -reminderSent');

    res.json(events);
  } catch (err) {
    console.error('Error fetching user calendar events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's schedule
router.get('/today', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const userDepartment = req.user.department || 'All';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await CalendarEvent.find({
      isActive: true,
      startDate: { $gte: today, $lt: tomorrow },
      $or: [
        { department: 'All' },
        { department: userDepartment },
        { attendees: userId },
        { organizer: userId }
      ]
    })
    .populate('organizer', 'firstName lastName email')
    .populate('attendees', 'firstName lastName email')
    .sort({ startDate: 1 })
    .select('-isActive -reminderSent');

    res.json(events);
  } catch (err) {
    console.error('Error fetching today\'s schedule:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming events
router.get('/upcoming', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const userDepartment = req.user.department || 'All';
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const events = await CalendarEvent.find({
      isActive: true,
      startDate: { $gte: today, $lte: nextWeek },
      $or: [
        { department: 'All' },
        { department: userDepartment },
        { attendees: userId },
        { organizer: userId }
      ]
    })
    .populate('organizer', 'firstName lastName email')
    .populate('attendees', 'firstName lastName email')
    .sort({ startDate: 1 })
    .select('-isActive -reminderSent')
    .limit(10);

    res.json(events);
  } catch (err) {
    console.error('Error fetching upcoming events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get holidays
router.get('/holidays', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();
    
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31);

    const holidays = await CalendarEvent.find({
      eventType: 'Holiday',
      isActive: true,
      startDate: { $gte: startOfYear, $lte: endOfYear }
    })
    .sort({ startDate: 1 })
    .select('title startDate endDate description');

    res.json(holidays);
  } catch (err) {
    console.error('Error fetching holidays:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get event by ID
router.get('/events/:id', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const userId = req.user._id;
    const userDepartment = req.user.department || 'All';

    const event = await CalendarEvent.findById(req.params.id)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email');

    if (!event || !event.isActive) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.department !== 'All' && 
        event.department !== userDepartment && 
        !event.attendees.includes(userId) && 
        event.organizer._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;