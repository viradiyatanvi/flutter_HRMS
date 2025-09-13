const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const Document = require('../models/Document');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/documents/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only document files are allowed (PDF, Word, Excel, PowerPoint, Text)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Get all documents (with filtering)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, targetAudience, isActive, search } = req.query;
    
    let query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (targetAudience) {
      query.targetAudience = targetAudience;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Check if user has access to view all documents
    const userAccessLevel = req.user.role.accessLevel;
    if (userAccessLevel !== 'Admin' && userAccessLevel !== 'HR Manager') {
      query.$or = [
        { targetAudience: 'All' },
        { targetAudience: userAccessLevel }
      ];
    }
    
    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Document.countDocuments(query);
    
    res.json({
      documents,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active documents for current user
router.get('/active', authenticateJWT, async (req, res) => {
  try {
    const currentDate = new Date();
    const userAccessLevel = req.user.role.accessLevel;
    
    const query = {
      isActive: true,
      publishDate: { $lte: currentDate },
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: currentDate } }
      ],
      $or: [
        { targetAudience: 'All' },
        { targetAudience: userAccessLevel }
      ]
    };
    
    const documents = await Document.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ 
        category: 1,
        title: 1
      });
    
    res.json(documents);
  } catch (err) {
    console.error('Error fetching active documents:', err);
    res.status(500).json({ message: 'Server error while fetching documents' });
  }
});

// Get specific document
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has access to this document
    const userAccessLevel = req.user.role.accessLevel;
    if (!document.targetAudience.includes('All') && 
        !document.targetAudience.includes(userAccessLevel) &&
        userAccessLevel !== 'Admin' && 
        userAccessLevel !== 'HR Manager') {
      return res.status(403).json({ message: 'Access denied to this document' });
    }
    
    res.json(document);
  } catch (err) {
    console.error('Error fetching document:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid document ID' });
    }
    
    res.status(500).json({ message: 'Server error while fetching document' });
  }
});

// Download document file
router.get('/:id/download', authenticateJWT, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user has access to this document
    const userAccessLevel = req.user.role.accessLevel;
    if (!document.targetAudience.includes('All') && 
        !document.targetAudience.includes(userAccessLevel) &&
        userAccessLevel !== 'Admin' && 
        userAccessLevel !== 'HR Manager') {
      return res.status(403).json({ message: 'Access denied to this document' });
    }
    
    const filePath = path.join(__dirname, '..', document.fileUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (err) {
    console.error('Error downloading document:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid document ID' });
    }
    
    res.status(500).json({ message: 'Server error while downloading document' });
  }
});

// Create new document (admin/HR only)
router.post('/create', authenticateJWT, upload.single('documentFile'), async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'Document file is required' });
    }
    
    const { title, description, category, targetAudience, isActive, publishDate, expiryDate, version } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    const document = new Document({
      title,
      description: description || '',
      category: category || 'Other',
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).substring(1),
      targetAudience: targetAudience ? (Array.isArray(targetAudience) ? targetAudience : [targetAudience]) : ['All'],
      isActive: isActive !== undefined ? isActive : true,
      publishDate: publishDate || new Date(),
      expiryDate: expiryDate || null,
      version: version || '1.0',
      uploadedBy: req.user._id
    });
    
    await document.save();
    
    await document.populate('uploadedBy', 'firstName lastName email');
    
    res.status(201).json(document);
  } catch (err) {
    console.error(err);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Update document (admin/HR only)
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }
    
    const { title, description, category, targetAudience, isActive, publishDate, expiryDate, version } = req.body;
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (targetAudience) document.targetAudience = Array.isArray(targetAudience) ? targetAudience : [targetAudience];
    if (isActive !== undefined) document.isActive = isActive;
    if (publishDate) document.publishDate = publishDate;
    if (expiryDate !== undefined) document.expiryDate = expiryDate;
    if (version) document.version = version;
    
    await document.save();
    
    // Populate uploadedBy field for response
    await document.populate('uploadedBy', 'firstName lastName email');
    
    res.json(document);
  } catch (err) {
    console.error('Error updating document:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid document ID' });
    }
    
    res.status(500).json({ message: 'Server error while updating document' });
  }
});

// Delete document (admin/HR only)
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }
    
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Delete the file from storage
    if (fs.existsSync(document.fileUrl)) {
      fs.unlinkSync(document.fileUrl);
    }
    
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    console.error('Error deleting document:', err);
    
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid document ID' });
    }
    
    res.status(500).json({ message: 'Server error while deleting document' });
  }
});

module.exports = router;