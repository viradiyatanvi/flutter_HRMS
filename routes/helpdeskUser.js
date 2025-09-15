const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee } = require('../middleware/employeeAuth');
const { isTicketOwnerOrManager } = require('../middleware/helpdeskAuth');
const HelpdeskTicket = require('../models/HelpdeskTicket');
const HelpdeskCategory = require('../models/HelpdeskCategory');
const router = express.Router();

// Get user's tickets
router.get('/tickets', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status 
    } = req.query;

    let query = { createdBy: req.user._id };

    if (status && status !== 'All') {
      query.status = status;
    }

    const tickets = await HelpdeskTicket.find(query)
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

// Create new ticket
router.post('/tickets', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { title, description, category, priority, attachments } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    // Check if category exists
    const categoryExists = await HelpdeskCategory.findOne({ 
      name: category, 
      isActive: true 
    });
    
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const ticket = new HelpdeskTicket({
      title,
      description,
      category,
      priority: priority || 'Medium',
      createdBy: req.user._id,
      attachments: attachments || []
    });

    if (categoryExists.defaultAssignee) {
      ticket.assignedTo = categoryExists.defaultAssignee;
      ticket.assignedAt = new Date();
      ticket.status = 'In Progress';
    }

    await ticket.save();

    await ticket.populate('assignedTo', 'firstName lastName email');
    await ticket.populate('createdBy', 'firstName lastName email');

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single ticket
router.get('/tickets/:id', authenticateJWT, isEmployee, isTicketOwnerOrManager, async (req, res) => {
  try {
    const ticket = await HelpdeskTicket.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('comments.user', 'firstName lastName');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to ticket
router.post('/tickets/:id/comment', authenticateJWT, isEmployee, isTicketOwnerOrManager, async (req, res) => {
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

// Get available categories
router.get('/categories', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const categories = await HelpdeskCategory.find({ isActive: true });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get ticket statistics for user
router.get('/stats', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const totalTickets = await HelpdeskTicket.countDocuments({ createdBy: req.user._id });
    const openTickets = await HelpdeskTicket.countDocuments({ 
      createdBy: req.user._id, 
      status: 'Open' 
    });
    const inProgressTickets = await HelpdeskTicket.countDocuments({ 
      createdBy: req.user._id, 
      status: 'In Progress' 
    });
    const resolvedTickets = await HelpdeskTicket.countDocuments({ 
      createdBy: req.user._id, 
      status: 'Resolved' 
    });

    res.json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;