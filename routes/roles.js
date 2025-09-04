// const express = require('express');
// const Role = require('../models/Role');
// const { authenticateJWT, authorize } = require('../middleware/auth');
// const router = express.Router();

// // Get all roles
// router.get('/', authenticateJWT, authorize([{ module: 'Role', permission: 'manage' }]), async (req, res) => {
//   try {
//     const roles = await Role.find();
//     res.json(roles);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get role by ID
// router.get('/:id', authenticateJWT, authorize([{ module: 'Role', permission: 'manage' }]), async (req, res) => {
//   try {
//     const role = await Role.findById(req.params.id);
    
//     if (!role) {
//       return res.status(404).json({ message: 'Role not found' });
//     }
    
//     res.json(role);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Create new role
// router.post('/', authenticateJWT, authorize([{ module: 'Role', permission: 'create' }]), async (req, res) => {
//   try {
//     const { name, description, permissions, accessLevel, isActive } = req.body;
    
//     const existingRole = await Role.findOne({ name });
//     if (existingRole) {
//       return res.status(400).json({ message: 'Role already exists with this name' });
//     }
    
//     const newRole = new Role({
//       name,
//       description,
//       permissions,
//       accessLevel,
//       isActive: isActive !== undefined ? isActive : true
//     });
    
//     await newRole.save();
//     res.status(201).json(newRole);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update role
// router.put('/:id', authenticateJWT, authorize([{ module: 'Role', permission: 'edit' }]), async (req, res) => {
//   try {
//     const { name, description, permissions, accessLevel, isActive } = req.body;
    
//     const role = await Role.findById(req.params.id);
//     if (!role) {
//       return res.status(404).json({ message: 'Role not found' });
//     }
    
//     if (name && name !== role.name) {
//       const existingRole = await Role.findOne({ name });
//       if (existingRole) {
//         return res.status(400).json({ message: 'Role name already taken' });
//       }
//       role.name = name;
//     }
    
//     if (description) role.description = description;
//     if (permissions) role.permissions = permissions;
//     if (accessLevel) role.accessLevel = accessLevel;
//     if (isActive !== undefined) role.isActive = isActive;
    
//     await role.save();
//     res.json(role);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete role
// router.delete('/:id', authenticateJWT, authorize([{ module: 'Role', permission: 'delete' }]), async (req, res) => {
//   try {
//     const role = await Role.findById(req.params.id);
    
//     if (!role) {
//       return res.status(404).json({ message: 'Role not found' });
//     }
    
//     // Check if any user is using this role
//     const User = require('../models/User');
//     const usersWithRole = await User.countDocuments({ role: req.params.id });
    
//     if (usersWithRole > 0) {
//       return res.status(400).json({ 
//         message: 'Cannot delete role. There are users assigned to this role.' 
//       });
//     }
    
//     await Role.findByIdAndDelete(req.params.id);
//     res.json({ message: 'Role deleted successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;


const express = require('express');
const Role = require('../models/Role');
const { authenticateJWT, authorize } = require('../middleware/auth');
const router = express.Router();

// Get all roles
router.get('/',async (req, res) => {
  try {
    const roles = await Role.find();
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(200).json({ message: 'Server error' });
  }
});

// Get role by ID
router.get('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new role
router.post('/create', async (req, res) => {
  try {
    const { name, description, permissions, accessLevel, isActive } = req.body;
    
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ message: 'Role already exists with this name' });
    }
    
    const newRole = new Role({
      name,
      description,
      permissions,
      accessLevel,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await newRole.save();
    res.status(201).json(newRole);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update role
router.put('/:id', async (req, res) => {
  try {
    const { name, description, permissions, accessLevel, isActive } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({ message: 'Role name already taken' });
      }
      role.name = name;
    }
    
    if (description) role.description = description;
    if (permissions) role.permissions = permissions;
    if (accessLevel) role.accessLevel = accessLevel;
    if (isActive !== undefined) role.isActive = isActive;
    
    await role.save();
    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete role
router.delete('/:id', async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    
    const User = require('../models/User');
    const usersWithRole = await User.countDocuments({ role: req.params.id });
    
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete role. There are users assigned to this role.' 
      });
    }
    
    await Role.findByIdAndDelete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;