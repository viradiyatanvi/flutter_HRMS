const express = require('express');
const TrainingCourse = require('../models/TrainingCourse');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const { authenticateJWT } = require('../middleware/auth');
const router = express.Router();

// Get all courses (admin)
router.get('/admin/courses', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, category, status } = req.query;
    
    let query = {};
    if (category && category !== 'All') {
      query.category = category;
    }
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const courses = await TrainingCourse.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TrainingCourse.countDocuments(query);

    res.json({
      courses,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single course (admin)
router.get('/admin/courses/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = await TrainingCourse.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('prerequisites', 'title');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new course (admin)
router.post('/admin/courses', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const courseData = {
      ...req.body,
      createdBy: req.user._id
    };

    const course = new TrainingCourse(courseData);
    await course.save();

    await course.populate('createdBy', 'firstName lastName');
    res.status(201).json(course);
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course (admin)
router.put('/admin/courses/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const course = await TrainingCourse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete course (admin)
router.delete('/admin/courses/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollmentsCount = await Enrollment.countDocuments({ course: req.params.id });
    if (enrollmentsCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete course. There are users enrolled in this course.' 
      });
    }

    const course = await TrainingCourse.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({ message: 'Course deleted successfully' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all enrollments (admin)
router.get('/admin/enrollments', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { page = 1, limit = 10, userId, courseId, status } = req.query;
    
    let query = {};
    if (userId) {
      query.user = userId;
    }
    if (courseId) {
      query.course = courseId;
    }
    if (status && status !== 'All') {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate('user', 'firstName lastName email')
      .populate('course', 'title category')
      .sort({ enrolledAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Enrollment.countDocuments(query);

    res.json({
      enrollments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get enrollments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update enrollment (admin)
router.put('/admin/enrollments/:id', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('user', 'firstName lastName email')
    .populate('course', 'title category');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    res.json(enrollment);
  } catch (err) {
    console.error('Update enrollment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate certificate (admin)
router.post('/admin/enrollments/:id/certificate', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('course', 'title duration');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.status !== 'completed') {
      return res.status(400).json({ message: 'Course must be completed to generate certificate' });
    }

    if (enrollment.certificateIssued) {
      return res.status(400).json({ message: 'Certificate already issued' });
    }

    // Generate unique certificate ID
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const certificate = new Certificate({
      certificateId,
      user: enrollment.user._id,
      course: enrollment.course._id,
      enrollment: enrollment._id,
      issuedAt: new Date(),
      expirationDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000),
      downloadUrl: `/api/training/certificates/${certificateId}/download`,
      verified: true
    });

    await certificate.save();

    // Update enrollment
    enrollment.certificateIssued = true;
    enrollment.certificateId = certificateId;
    await enrollment.save();

    res.status(201).json(certificate);
  } catch (err) {
    console.error('Generate certificate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;