const express = require('express');
const User = require('../models/User');
const { authenticateJWT, authorize } = require('../middleware/auth');
const router = express.Router();

router.post('/setup', async (req, res) => {
  try {
    const existingAdmin = await User.findOne({ email: 'admin@hrms.com' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Setup already completed' });
    }

    const Role = require('../models/Role');
    let adminRole = await Role.findOne({ name: 'Admin' });
    
    if (!adminRole) {
      adminRole = new Role({
        name: 'Admin',
        description: 'Full access to all modules',
        accessLevel: 'Admin',
        permissions: [
          {
            module: 'User',
            permissions: { manage: true, create: true, edit: true, delete: true }
          },
          {
            module: 'Role',
            permissions: { manage: true, create: true, edit: true, delete: true }
          }
        ],
        isActive: true
      });
      await adminRole.save();
    }

    const adminUser = new User({
      name: 'Administrator',
      email: 'admin@hrms.com',
      password: 'admin123',
      role: adminRole._id,
      isActive: true
    });

    await adminUser.save();

    res.status(201).json({ 
      message: 'Setup completed successfully',
      user: { email: 'admin@hrms.com', password: 'admin123' }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Setup failed' });
  }
});

// Get all users
router.get('/', authenticateJWT, authorize([{ module: 'User', permission: 'manage' }]), async (req, res) => {
  try {
    const users = await User.find().populate('role').select('-password');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/:id', authenticateJWT, authorize([{ module: 'User', permission: 'manage' }]), async (req, res) => {
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

// Create new user
router.post('/', authenticateJWT, authorize([{ module: 'User', permission: 'create' }]), async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    const newUser = new User({
      name,
      email,
      password,
      role,
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
router.put('/:id', authenticateJWT, authorize([{ module: 'User', permission: 'edit' }]), async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    
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
    
    if (name) user.name = name;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    const updatedUser = await User.findById(user._id).populate('role').select('-password');
    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', authenticateJWT, authorize([{ module: 'User', permission: 'delete' }]), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (req.user._id.toString() === user._id.toString()) {
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