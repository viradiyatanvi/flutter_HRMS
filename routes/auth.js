
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require("bcryptjs");
const { authenticateJWT } = require('../middleware/auth');
const router = express.Router();

// Login route
// router.post('/login', async (req, res) => {
//   try {
//     const { email, password } = req.body;
    
//     const user = await User.findOne({ email }).populate({
//       path: 'role',
//       select: 'name permissions accessLevel'
//     });
    
//     if (!user || !user.isActive) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }
    
//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }
    
//     user.lastLogin = new Date();
//     await user.save();
    
//     const token = jwt.sign(
//       { id: user._id, email: user.email },
//       process.env.JWT_SECRET || 'HRMS',
//       { expiresIn: '24h' }
//     );
    
//     res.json({
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });


// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate({
      path: 'role',
      select: 'name permissions accessLevel'
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    user.lastLogin = new Date();
    await user.save();
    
    const token = jwt.sign(
      { id: user._id, email: user.email },
      'HRMS' || 'HRMS',
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'role',
        select: 'name permissions accessLevel'
      })
      .select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;