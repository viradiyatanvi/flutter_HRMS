const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/User');
const router = express.Router();

// Get all calendar events (admin)
router.get('/admin/events', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { page = 1, limit = 50, eventType, department, month, year, search } = req.query;
    
    let filter = {};

    // Event type filter
    if (eventType && eventType !== 'All') {
      filter.eventType = eventType;
    }

    // Department filter
    if (department && department !== 'All') {
      filter.department = department;
    }

    // Month and year filter
    if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      filter.startDate = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await CalendarEvent.find(filter)
      .populate('organizer', 'firstName lastName email')
      .populate('attendees', 'firstName lastName email')
      .sort({ startDate: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CalendarEvent.countDocuments(filter);

    res.json({
      events,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (err) {
    console.error('Error fetching calendar events:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new calendar event
router.post('/admin/events/create', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR/Manager privileges required.' });
    }

    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      isAllDay,
      location,
      attendees,
      department,
      priority,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate
    } = req.body;

    if (!title || !eventType || !startDate) {
      return res.status(400).json({ message: 'Title, event type, and start date are required' });
    }

    const event = new CalendarEvent({
      title,
      description,
      eventType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      isAllDay: isAllDay || false,
      location,
      organizer: req.user._id,
      attendees: attendees || [],
      department: department || 'All',
      priority: priority || 'Medium',
      isRecurring: isRecurring || false,
      recurrencePattern: isRecurring ? recurrencePattern : null,
      recurrenceEndDate: isRecurring && recurrenceEndDate ? new Date(recurrenceEndDate) : null
    });

    await event.save();
    await event.populate('organizer', 'firstName lastName email');
    await event.populate('attendees', 'firstName lastName email');

    res.status(201).json(event);
  } catch (err) {
    console.error('Error creating calendar event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update calendar event
router.put('/admin/events/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager', 'Team Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR/Manager privileges required.' });
    }

    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      isAllDay,
      location,
      attendees,
      department,
      priority,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate,
      isActive
    } = req.body;

    if (title) event.title = title;
    if (description !== undefined) event.description = description;
    if (eventType) event.eventType = eventType;
    if (startDate) event.startDate = new Date(startDate);
    if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : null;
    if (isAllDay !== undefined) event.isAllDay = isAllDay;
    if (location !== undefined) event.location = location;
    if (attendees) event.attendees = attendees;
    if (department) event.department = department;
    if (priority) event.priority = priority;
    if (isRecurring !== undefined) event.isRecurring = isRecurring;
    if (recurrencePattern) event.recurrencePattern = recurrencePattern;
    if (recurrenceEndDate !== undefined) event.recurrenceEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;
    if (isActive !== undefined) event.isActive = isActive;

    await event.save();
    await event.populate('organizer', 'firstName lastName email');
    await event.populate('attendees', 'firstName lastName email');

    res.json(event);
  } catch (err) {
    console.error('Error updating calendar event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete calendar event
router.delete('/admin/events/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const event = await CalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    await CalendarEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting calendar event:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming birthdays
router.get('/admin/birthdays', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { days = 30 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + parseInt(days));

    res.json([]);
  } catch (err) {
    console.error('Error fetching birthdays:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;