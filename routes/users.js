// const express = require('express');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const router = express.Router();

// // Get all users
// router.get('/', async (req, res) => {
//   try {
//     const users = await User.find().populate('role').select('-password');
//     res.json(users);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get single user
// router.get('/:id', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).populate('role').select('-password');

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Create first user
// router.post('/create-first-user', async (req, res) => {
//   try {
//     const { name, email, password, mobileNum, companyName } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists with this email' });
//     }

//     const newUser = new User({
//       name,
//       email,
//       password,
//       mobileNum: mobileNum || '',
//       companyName: companyName || '',
//       isActive: true
//     });

//     await newUser.save();

//     const user = await User.findById(newUser._id).select('-password');
//     res.status(201).json(user);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update user
// router.put('/:id', async (req, res) => {
//   try {
//     const { name, email, role, isActive, mobileNum, companyName } = req.body;

//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (email && email !== user.email) {
//       const existingUser = await User.findOne({ email });
//       if (existingUser) {
//         return res.status(400).json({ message: 'Email already taken' });
//       }
//       user.email = email;
//     }

//     if (name) user.name = name;
//     if (role) user.role = role;
//     if (isActive !== undefined) user.isActive = isActive;
//     if (mobileNum !== undefined) user.mobileNum = mobileNum;
//     if (companyName !== undefined) user.companyName = companyName;

//     await user.save();

//     const updatedUser = await User.findById(user._id).populate('role').select('-password');
//     res.json(updatedUser);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete user
// router.delete('/:id', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (req.user && req.user._id && req.user._id.toString() === user._id.toString()) {
//       return res.status(400).json({ message: 'Cannot delete your own account' });
//     }

//     await User.findByIdAndDelete(req.params.id);
//     res.json({ message: 'User deleted successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;


const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().populate('role').select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role').select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create first user
router.post('/create-first-user', async (req, res) => {
  try {
    const { firstName, lastName, email, password, mobileNum, companyName } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      mobileNum: mobileNum || '',
      companyName: companyName || '',
      isActive: true
    });
    
    await newUser.save();
    
    const user = await User.findById(newUser._id).select('-password');
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (new endpoint)
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, password, mobileNum, companyName, role, isActive } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: password || 'defaultPassword', // You should handle this better
      mobileNum: mobileNum || '',
      companyName: companyName || '',
      role: role || null,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await newUser.save();
    
    const user = await User.findById(newUser._id).populate('role').select('-password');
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, role, isActive, mobileNum, companyName } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already taken' });
      }
      user.email = email;
    }
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (mobileNum !== undefined) user.mobileNum = mobileNum;
    if (companyName !== undefined) user.companyName = companyName;
    
    await user.save();
    
    const updatedUser = await User.findById(user._id).populate('role').select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (req.user && req.user._id && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;