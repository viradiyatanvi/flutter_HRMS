const express = require('express');
const { authenticateJWT } = require('../middleware/auth');
const { isEmployee, isOwnData } = require('../middleware/employeeAuth');
const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const router = express.Router();

// Get own profile (Employee)
router.get('/', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ user: req.user._id })
      .populate('user', 'firstName lastName email mobileNum')
      .populate('reportingManager', 'firstName lastName email');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile by user ID (Admin/HR)
router.get('/user/:userId', authenticateJWT, isEmployee, isOwnData, async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await UserProfile.findOne({ user: userId })
      .populate('user', 'firstName lastName email mobileNum')
      .populate('reportingManager', 'firstName lastName email');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const {
      dateOfBirth,
      gender,
      address,
      emergencyContacts
    } = req.body;

    let profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      profile = new UserProfile({ user: req.user._id });
    }

    if (dateOfBirth !== undefined) profile.dateOfBirth = dateOfBirth;
    if (gender !== undefined) profile.gender = gender;
    if (address !== undefined) profile.address = address;
    if (emergencyContacts !== undefined) profile.emergencyContacts = emergencyContacts;

    profile.isProfileComplete = checkProfileCompletion(profile);

    await profile.save();

    await User.findByIdAndUpdate(req.user._id, { profile: profile._id });

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get profile by user ID for Admin
router.get('/admin/user/:userId', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { userId } = req.params;

    const profile = await UserProfile.findOne({ user: userId })
      .populate('user', 'firstName lastName email mobileNum')
      .populate('reportingManager', 'firstName lastName email');

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload document (Employee)
// router.post('/documents', authenticateJWT, isEmployee, async (req, res) => {
//   try {
//     const { name, type, fileUrl } = req.body;

//     if (!name || !type || !fileUrl) {
//       return res.status(400).json({ message: 'Name, type, and fileUrl are required' });
//     }

//     let profile = await UserProfile.findOne({ user: req.user._id });

//     if (!profile) {
//       profile = new UserProfile({ user: req.user._id });
//     }

//     profile.documents.push({
//       name,
//       type,
//       fileUrl
//     });

//     await profile.save();
    
//     // Update user reference to profile if it's a new profile
//     if (!req.user.profile) {
//       await User.findByIdAndUpdate(req.user._id, { profile: profile._id });
//     }
    
//     res.status(201).json(profile);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// Upload document (Employee)
router.post('/documents', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const { name, type, fileUrl } = req.body;

    if (!name || !type || !fileUrl) {
      return res.status(400).json({ message: 'Name, type, and fileUrl are required' });
    }

    let profile = await UserProfile.findOne({ user: req.user._id });

    if (!profile) {
      // Create a basic profile if none exists
      profile = new UserProfile({ user: req.user._id });
      await profile.save();
      
      // Update user reference to profile
      await User.findByIdAndUpdate(req.user._id, { profile: profile._id });
    }

    profile.documents.push({
      name,
      type,
      fileUrl,
      uploadedAt: new Date()
    });

    await profile.save();
    
    res.status(201).json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add this route for creating profile
router.post('/create', authenticateJWT, isEmployee, async (req, res) => {
  try {
    const {
      designation,
      department,
      workLocation,
      employmentType,
      dateOfBirth,
      dateOfJoining,
      gender,
      address,
      bankDetails,
      emergencyContacts
    } = req.body;

    // Check if profile already exists
    let profile = await UserProfile.findOne({ user: req.user._id });

    if (profile) {
      return res.status(400).json({ message: 'Profile already exists' });
    }

    // Create new profile
    profile = new UserProfile({
      user: req.user._id,
      designation,
      department,
      workLocation,
      employmentType,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
      gender,
      address,
      bankDetails,
      emergencyContacts
    });

    profile.isProfileComplete = checkProfileCompletion(profile);

    await profile.save();

    // Update user reference to profile
    await User.findByIdAndUpdate(req.user._id, { profile: profile._id });

    // Populate the response
    const populatedProfile = await UserProfile.findById(profile._id)
      .populate('user', 'firstName lastName email mobileNum')
      .populate('reportingManager', 'firstName lastName email');

    res.status(201).json(populatedProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all profiles (Admin/HR)
router.get('/admin/all', authenticateJWT, async (req, res) => {
  try {
    if (!['Admin', 'HR Manager'].includes(req.user.role.accessLevel)) {
      return res.status(403).json({ message: 'Access denied. Admin/HR privileges required.' });
    }

    const { page = 1, limit = 20, search, department } = req.query;
    
    let filter = {};
    
    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filter.user = { $in: users.map(u => u._id) };
    }
    
    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    const profiles = await UserProfile.find(filter)
      .populate('user', 'firstName lastName email mobileNum')
      .populate('reportingManager', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await UserProfile.countDocuments(filter);

    res.json({
      profiles: profiles,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    total: total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to check profile completion
function checkProfileCompletion(profile) {
  const requiredFields = [
    profile.dateOfBirth,
    profile.gender,
    profile.address && profile.address.street,
    profile.address && profile.address.city,
    profile.address && profile.address.state,
    profile.address && profile.address.pincode,
    profile.bankDetails && profile.bankDetails.accountNumber,
    profile.bankDetails && profile.bankDetails.ifscCode,
    profile.emergencyContacts && profile.emergencyContacts.length > 0
  ];

  return requiredFields.every(field => field !== undefined && field !== null && field !== '');
}

module.exports = router;