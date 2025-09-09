// const express = require('express');
// const { authenticateJWT } = require('../middleware/auth');
// const Announcement = require('../models/Announcement');
// const router = express.Router();

// // get all announcements (with filtering and pagination)
// router.get('/', async (req, res) => {
//   try {
//     const { page = 1, limit = 10, priority, targetAudience, isActive } = req.query;
    
//     let query = {};
    
//     if (priority) {
//       query.priority = priority;
//     }
    
//     if (targetAudience) {
//       query.targetAudience = targetAudience;
//     }
    
//     if (isActive !== undefined) {
//       query.isActive = isActive === 'true';
//     }
    
//     const announcements = await Announcement.find(query)
//       .sort({ createdAt: -1, priority: 1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);
    
//     const total = await Announcement.countDocuments(query);
    
//     res.json({
//       announcements,
//       totalPages: Math.ceil(total / limit),
//       currentPage: page,
//       total
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // get active announcements for dashboard (with date filtering)
// router.get('/active', async (req, res) => {
//   try {
//     const announcements = await Announcement.find({
//       isActive: true,
//       publishDate: { $lte: new Date() },
//       $or: [
//         { expiryDate: { $exists: false } },
//         { expiryDate: null },
//         { expiryDate: { $gte: new Date() } }
//       ]
//     })
//     .sort({ priority: -1, publishDate: -1 })
//     .limit(10);
    
//     res.json(announcements);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // get specific announcement
// router.get('/:id', async (req, res) => {
//   try {
//     const announcement = await Announcement.findById(req.params.id);
    
//     if (!announcement) {
//       return res.status(404).json({ message: 'Announcement not found' });
//     }
    
//     res.json(announcement);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // create new announcement (admin/HR only)
// router.post('/create', authenticateJWT,async (req, res) => {
//   try {
//     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
//     }
    
//     const { title, content, priority, targetAudience, isActive, publishDate, expiryDate } = req.body;
    
//     if (!title || !content) {
//       return res.status(400).json({ message: 'Title and content are required' });
//     }
    
//     const announcement = new Announcement({
//       title,
//       content,
//       priority: priority || 'Medium',
//       targetAudience: targetAudience || ['All'],
//       isActive: isActive !== undefined ? isActive : true,
//       publishDate: publishDate || new Date(),
//       expiryDate
//     });
    
//     await announcement.save();
//     res.status(201).json(announcement);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // update announcement (admin/HR only)
// router.put('/:id', async (req, res) => {
//   try {
//     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
//     }
    
//     const { title, content, priority, targetAudience, isActive, publishDate, expiryDate } = req.body;
    
//     const announcement = await Announcement.findById(req.params.id);
    
//     if (!announcement) {
//       return res.status(404).json({ message: 'Announcement not found' });
//     }
    
//     if (title) announcement.title = title;
//     if (content) announcement.content = content;
//     if (priority) announcement.priority = priority;
//     if (targetAudience) announcement.targetAudience = targetAudience;
//     if (isActive !== undefined) announcement.isActive = isActive;
//     if (publishDate) announcement.publishDate = publishDate;
//     if (expiryDate !== undefined) announcement.expiryDate = expiryDate;
    
//     await announcement.save();
//     res.json(announcement);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // delete announcement (admin/HR only)
// router.delete('/:id', async (req, res) => {
//   try {
//     if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
//       return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
//     }
    
//     const announcement = await Announcement.findById(req.params.id);
    
//     if (!announcement) {
//       return res.status(404).json({ message: 'Announcement not found' });
//     }
    
//     await Announcement.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Announcement deleted successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;


const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const Announcement = require('../models/Announcement');
const router = express.Router();

// Get all announcements (with filtering, sorting and pagination)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      priority, 
      targetAudience, 
      isActive,
      search 
    } = req.query;
    
    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Priority filter
    if (priority && priority !== 'All') {
      query.priority = priority;
    }
    
    // Target audience filter
    if (targetAudience && targetAudience !== 'All') {
      query.targetAudience = targetAudience;
    }
    
    // Status filter
    if (isActive !== undefined && isActive !== 'All') {
      query.isActive = isActive === 'true' || isActive === 'Active';
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { 
        priority: -1, // High priority first
        publishDate: -1 // Newest first
      }
    };
    
    // Using mongoose-paginate-v2 for better pagination
    const announcements = await Announcement.paginate(query, options);
    
    res.json({
      announcements: announcements.docs,
      totalPages: announcements.totalPages,
      currentPage: announcements.page,
      total: announcements.totalDocs
    });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ message: 'Server error while fetching announcements' });
  }
});

// Get active announcements for dashboard (with date filtering)
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
router.post('/', authenticateJWT, async (req, res) => {
  try {
    // Check if user has admin/HR privileges
    if (!['Admin', 'HR Manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin/HR privileges required.' 
      });
    }
    
    const { 
      title, 
      content, 
      priority, 
      targetAudience, 
      isActive, 
      publishDate, 
      expiryDate 
    } = req.body;
    
    // Validation
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    if (title.length > 200) {
      return res.status(400).json({ message: 'Title cannot exceed 200 characters' });
    }
    
    if (content.length > 5000) {
      return res.status(400).json({ message: 'Content cannot exceed 5000 characters' });
    }
    
    // Create announcement
    const announcement = new Announcement({
      title: title.trim(),
      content: content.trim(),
      priority: priority || 'Medium',
      targetAudience: targetAudience && targetAudience.length > 0 ? targetAudience : ['All'],
      isActive: isActive !== undefined ? isActive : true,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });
    
    // Validate the document
    const validationError = announcement.validateSync();
    if (validationError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationError.errors 
      });
    }
    
    await announcement.save();
    
    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (err) {
    console.error('Error creating announcement:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: err.errors 
      });
    }
    
    res.status(500).json({ message: 'Server error while creating announcement' });
  }
});

// Update announcement (admin/HR only)
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    // Check if user has admin/HR privileges
    if (!['Admin', 'HR Manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin/HR privileges required.' 
      });
    }
    
    const { 
      title, 
      content, 
      priority, 
      targetAudience, 
      isActive, 
      publishDate, 
      expiryDate 
    } = req.body;
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    // Update fields if provided
    if (title !== undefined) announcement.title = title.trim();
    if (content !== undefined) announcement.content = content.trim();
    if (priority !== undefined) announcement.priority = priority;
    if (targetAudience !== undefined) {
      announcement.targetAudience = targetAudience.length > 0 ? targetAudience : ['All'];
    }
    if (isActive !== undefined) announcement.isActive = isActive;
    if (publishDate !== undefined) announcement.publishDate = new Date(publishDate);
    if (expiryDate !== undefined) {
      announcement.expiryDate = expiryDate ? new Date(expiryDate) : null;
    }
    
    // Validate the document
    const validationError = announcement.validateSync();
    if (validationError) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationError.errors 
      });
    }
    
    await announcement.save();
    
    res.json({
      message: 'Announcement updated successfully',
      announcement
    });
  } catch (err) {
    console.error('Error updating announcement:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: err.errors 
      });
    }
    
    res.status(500).json({ message: 'Server error while updating announcement' });
  }
});

// Delete announcement (admin/HR only)
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    // Check if user has admin/HR privileges
    if (!['Admin', 'HR Manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Admin/HR privileges required.' 
      });
    }
    
    const announcement = await Announcement.findById(req.params.id);
    
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    
    await Announcement.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Announcement deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid announcement ID' });
    }
    
    res.status(500).json({ message: 'Server error while deleting announcement' });
  }
});

module.exports = router;