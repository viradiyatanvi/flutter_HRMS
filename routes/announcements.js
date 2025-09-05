const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const router = express.Router();

// get all announcements (with filtering and pagination)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, priority, targetAudience, isActive } = req.query;
    
    let query = {};
    
    if (priority) {
      query.priority = priority;
    }
    
    if (targetAudience) {
      query.targetAudience = targetAudience;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1, priority: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Announcement.countDocuments(query);
    
    res.json({
      announcements,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get active announcements for dashboard (with date filtering)
router.get('/active', async (req, res) => {
  try {
    const announcements = await Announcement.find({
      isActive: true,
      publishDate: { $lte: new Date() },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    })
    .sort({ priority: -1, publishDate: -1 })
    .limit(10);
    
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get specific announcement
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// create new announcement (admin/HR only)
router.post('/create', authenticateJWT,async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }
    
    const { title, content, priority, targetAudience, isActive, publishDate, expiryDate } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const announcement = new Announcement({
      title,
      content,
      priority: priority || 'Medium',
      targetAudience: targetAudience || ['All'],
      isActive: isActive !== undefined ? isActive : true,
      publishDate: publishDate || new Date(),
      expiryDate
    });
    
    await announcement.save();
    res.status(201).json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// update announcement (admin/HR only)
router.put('/:id', async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }
    
    const { title, content, priority, targetAudience, isActive, publishDate, expiryDate } = req.body;
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (priority) announcement.priority = priority;
    if (targetAudience) announcement.targetAudience = targetAudience;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (publishDate) announcement.publishDate = publishDate;
    if (expiryDate !== undefined) announcement.expiryDate = expiryDate;
    
    await announcement.save();
    res.json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// delete announcement (admin/HR only)
router.delete('/:id', async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;