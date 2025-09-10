

const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const router = express.Router();

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

router.get('/active', async (req, res) => {
  try {
    const currentDate = new Date();
    
    const announcements = await Announcement.find({
      isActive: true,
      publishDate: { $lte: currentDate },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: currentDate } }
      ]
    })
    .sort({ 
      priority: -1, // High priority first
      publishDate: -1 // Newest first
    })
    .limit(10);
    
    res.json(announcements);
  } catch (err) {
    console.error('Error fetching active announcements:', err);
    res.status(500).json({ message: 'Server error while fetching active announcements' });
  }
});

// Get specific announcement
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    res.json(announcement);
  } catch (err) {
    console.error('Error fetching announcement:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }
    
    res.status(500).json({ message: 'Server error while fetching announcement' });
  }
});

// Create new announcement (admin/HR only)
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
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    if (!req.user || !req.user.role || !['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
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
    console.error('Error updating announcement:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }
    
    res.status(500).json({ message: 'Server error while updating announcement' });
  }
});

// delete announcement (admin/HR only)
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    if (!req.user || !req.user.role || !['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }
    
    res.status(500).json({ message: 'Server error while deleting announcement' });
  }
});


module.exports = router;