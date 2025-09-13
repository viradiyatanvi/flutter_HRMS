const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { canManageTickets } = require('../middleware/helpdeskAuth');
const HelpdeskTicket = require('../models/HelpdeskTicket');
const HelpdeskCategory = require('../models/HelpdeskCategory');
const User = require('../models/User');
const router = express.Router();

// Get all tickets with filtering options
router.get('/tickets', authenticateJWT, canManageTickets, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      category, 
      priority, 
      assignedTo,
      createdBy,
      startDate,
      endDate 
    } = req.query;

    let query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (priority && priority !== 'All') {
      query.priority = priority;
    }

    if (assignedTo && assignedTo !== 'All') {
      query.assignedTo = assignedTo;
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const tickets = await HelpdeskTicket.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await HelpdeskTicket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ticket statistics
router.get('/stats', authenticateJWT, canManageTickets, async (req, res) => {
  try {
    const totalTickets = await HelpdeskTicket.countDocuments();
    const openTickets = await HelpdeskTicket.countDocuments({ status: 'Open' });
    const inProgressTickets = await HelpdeskTicket.countDocuments({ status: 'In Progress' });
    const resolvedTickets = await HelpdeskTicket.countDocuments({ status: 'Resolved' });

    // Tickets by category
    const ticketsByCategory = await HelpdeskTicket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Tickets by priority
    const ticketsByPriority = await HelpdeskTicket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      ticketsByCategory,
      ticketsByPriority
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign ticket to staff member
router.put('/tickets/:id/assign', authenticateJWT, canManageTickets, async (req, res) => {
  try {
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({ message: 'Assignee is required' });
    }

    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({ message: 'Assignee not found' });
    }

    const ticket = await HelpdeskTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.assignedTo = assignedTo;
    ticket.assignedAt = new Date();
    ticket.status = 'In Progress';

    await ticket.save();

    await ticket.populate('assignedTo', 'firstName lastName email');
    await ticket.populate('createdBy', 'firstName lastName email');

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ticket status
router.put('/tickets/:id/status', authenticateJWT, canManageTickets, async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const ticket = await HelpdeskTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;

    if (status === 'Resolved' || status === 'Closed') {
      ticket.resolvedAt = new Date();
      ticket.resolutionNotes = resolutionNotes || '';
    }

    await ticket.save();

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to ticket
router.post('/tickets/:id/comment', authenticateJWT, canManageTickets, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const ticket = await HelpdeskTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.comments.push({
      user: req.user._id,
      comment
    });

    await ticket.save();

    await ticket.populate('comments.user', 'firstName lastName');

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all categories
router.get('/categories', authenticateJWT, canManageTickets, async (req, res) => {
  try {
    const categories = await HelpdeskCategory.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create category
router.post('/categories', authenticateJWT, canManageTickets, async (req, res) => {
  try {
    const { name, description, assignedDepartment, defaultAssignee } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existingCategory = await HelpdeskCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new HelpdeskCategory({
      name,
      description,
      assignedDepartment,
      defaultAssignee
    });

    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update category
router.put('/categories/:id', authenticateJWT, canManageTickets, async (req, res) => {
  try {
    const { name, description, isActive, assignedDepartment, defaultAssignee } = req.body;

    const category = await HelpdeskCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name && name !== category.name) {
      const existingCategory = await HelpdeskCategory.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category name already exists' });
      }
      category.name = name;
    }

    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (assignedDepartment !== undefined) category.assignedDepartment = assignedDepartment;
    if (defaultAssignee !== undefined) category.defaultAssignee = defaultAssignee;

    await category.save();
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;