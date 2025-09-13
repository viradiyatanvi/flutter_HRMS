const express = require('express');
const TrainingCourse = require('../models/TrainingCourse');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee } = require('../middleware/employeeAuth');
const router = express.Router();

// Get available courses for user
router.get('/courses', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    
    let query = { 
      isActive: true,
      $or: [
        { isPublic: true },
        { targetRoles: { $in: [req.user.role.accessLevel] } }
      ]
    };
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await TrainingCourse.find(query)
      .select('-modules.content') // Don't include full content in listing
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TrainingCourse.countDocuments(query);

    // Check enrollment status for each course
    const coursesWithEnrollment = await Promise.all(
      courses.map(async (course) => {
        const enrollment = await Enrollment.findOne({
          user: req.user._id,
          course: course._id
        });
        
        return {
          ...course.toObject(),
          enrollmentStatus: enrollment ? enrollment.status : 'not-enrolled',
          progress: enrollment ? enrollment.progress : 0
        };
      })
    );

    res.json({
      courses: coursesWithEnrollment,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single course details
router.get('/courses/:id', authenticateJWT, isEmployee, async (req, res) => {
  try {
      const course = await TrainingCourse.findById(req.params.id)
      .populate('prerequisites', 'title');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isPublic && !course.targetRoles.includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.id
    });

    const courseData = course.toObject();
    courseData.enrollmentStatus = enrollment ? enrollment.status : 'not-enrolled';
    courseData.progress = enrollment ? enrollment.progress : 0;

    res.json(courseData);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Enroll in a course
router.post('/courses/:id/enroll', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const course = await TrainingCourse.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isActive) {
      return res.status(400).json({ message: 'Course is not active' });
    }

    // Check if user has access to this course
    if (!course.isPublic && !course.targetRoles.includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied to this course' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.id
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Check prerequisites
    if (course.prerequisites && course.prerequisites.length > 0) {
      const completedPrerequisites = await Enrollment.find({
        user: req.user._id,
        course: { $in: course.prerequisites },
        status: 'completed'
      });

      if (completedPrerequisites.length !== course.prerequisites.length) {
        return res.status(400).json({ 
          message: 'You must complete all prerequisites before enrolling in this course' 
        });
      }
    }

    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user._id,
      course: req.params.id,
      status: 'enrolled'
    });

    await enrollment.save();
    await enrollment.populate('course', 'title category');

    res.status(201).json(enrollment);
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's enrollments
router.get('/enrollments', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = { user: req.user._id };
    if (status && status !== 'All') {
      query.status = status;
    }

    const enrollments = await Enrollment.find(query)
      .populate('course', 'title category duration thumbnail')
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

// Get course content for enrolled user
router.get('/enrollments/:id/content', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course')
      .populate('user');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (enrollment.status === 'dropped') {
      return res.status(400).json({ message: 'You have dropped this course' });
    }

    res.json({
      course: enrollment.course,
      progress: enrollment.progress,
      completedModules: enrollment.completedModules
    });
  } catch (err) {
    console.error('Get course content error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark module as completed
router.post('/enrollments/:id/complete-module', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { moduleId } = req.body;

    const enrollment = await Enrollment.findById(req.params.id)
      .populate('course');

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    if (enrollment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (enrollment.status === 'dropped') {
      return res.status(400).json({ message: 'You have dropped this course' });
    }

    // Check if module exists in course
    const module = enrollment.course.modules.id(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Check if module is already completed
    const alreadyCompleted = enrollment.completedModules.some(
      m => m.moduleId.toString() === moduleId
    );

    if (alreadyCompleted) {
      return res.status(400).json({ message: 'Module already completed' });
    }

    // Add to completed modules
    enrollment.completedModules.push({
      moduleId: moduleId,
      completedAt: new Date()
    });

    // Calculate progress
    const totalModules = enrollment.course.modules.length;
    const completedModules = enrollment.completedModules.length;
    enrollment.progress = Math.round((completedModules / totalModules) * 100);

    // Update status if course is completed
    if (enrollment.progress === 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
    } else if (enrollment.status === 'enrolled') {
      enrollment.status = 'in-progress';
    }

    await enrollment.save();

    res.json(enrollment);
  } catch (err) {
    console.error('Complete module error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get user certificates
router.get('/certificates', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const certificates = await Certificate.find({ user: req.user._id })
      .populate('course', 'title category duration')
      .sort({ issuedAt: -1 });

    res.json(certificates);
  } catch (err) {
    console.error('Get certificates error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download certificate
router.get('/certificates/:id/download', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('user')
      .populate('course');

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    if (certificate.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // In a real application, you would generate a PDF here
    // For now, we'll return the certificate data
    res.json({
      certificateId: certificate.certificateId,
      userName: `${certificate.user.firstName} ${certificate.user.lastName}`,
      courseName: certificate.course.title,
      issuedAt: certificate.issuedAt,
      expirationDate: certificate.expirationDate,
      message: 'PDF certificate would be generated here in production'
    });
  } catch (err) {
    console.error('Download certificate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify certificate
router.get('/certificates/verify/:certificateId', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      certificateId: req.params.certificateId 
    })
    .populate('user', 'firstName lastName email')
    .populate('course', 'title category duration');

    if (!certificate) {
      return res.status(404).json({ 
        valid: false,
        message: 'Certificate not found' 
      });
    }

    if (!certificate.verified) {
      return res.json({
        valid: false,
        message: 'Certificate is not verified'
      });
    }

    if (certificate.expirationDate && certificate.expirationDate < new Date()) {
      return res.json({
        valid: false,
        message: 'Certificate has expired'
      });
    }

    res.json({
      valid: true,
      certificate: {
        certificateId: certificate.certificateId,
        userName: `${certificate.user.firstName} ${certificate.user.lastName}`,
        courseName: certificate.course.title,
        issuedAt: certificate.issuedAt,
        expirationDate: certificate.expirationDate
      }
    });
  } catch (err) {
    console.error('Verify certificate error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;