const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const { authenticateJWT, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration for maintenance attachments
const maintenanceStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../Uploads/Maintenance');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `maintenance-${uniqueSuffix}-${file.originalname}`);
  }
});

const uploadMaintenance = multer({
  storage: maintenanceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).array('attachments', 5);

// Middleware to check if user is admin/HR manager
const isAdminOrHR = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  const allowedRoles = ['Admin', 'HR Manager'];
  if (!allowedRoles.includes(req.user.role.accessLevel)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  
  next();
};

// Create new asset
router.post('/assets', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const assetData = {
      ...req.body,
      createdBy: req.user._id
    };

    const asset = new Asset(assetData);
    await asset.save();

    // Populate the created asset with user details
    await asset.populate('createdBy', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Asset created successfully',
      asset
    });
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating asset',
      error: error.message
    });
  }
});

// Get all assets with filtering and pagination
router.get('/assets', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      assetType = '',
      status = '',
      allocatedTo = ''
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { assetName: { $regex: search, $options: 'i' } },
        { assetId: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (assetType) query.assetType = assetType;
    if (status) query.currentStatus = status;
    if (allocatedTo) query.allocatedTo = allocatedTo;

    const assets = await Asset.find(query)
      .populate('allocatedTo', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Asset.countDocuments(query);

    res.json({
      success: true,
      assets,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assets',
      error: error.message
    });
  }
});

// Get asset by ID
router.get('/assets/:id', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('allocatedTo', 'firstName lastName email department')
      .populate('createdBy', 'firstName lastName');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      asset
    });
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching asset',
      error: error.message
    });
  }
});

// Update asset
router.put('/assets/:id', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('allocatedTo', 'firstName lastName email');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.json({
      success: true,
      message: 'Asset updated successfully',
      asset
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating asset',
      error: error.message
    });
  }
});

// Allocate asset to employee
router.post('/assets/:id/allocate', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const { allocatedTo, expectedReturnDate, notes } = req.body;
    
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.currentStatus !== 'Available') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not available for allocation'
      });
    }

    const employee = await User.findById(allocatedTo);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    asset.allocatedTo = allocatedTo;
    asset.allocationDate = new Date();
    asset.expectedReturnDate = expectedReturnDate;
    asset.currentStatus = 'Allocated';
    asset.notes = notes || asset.notes;

    await asset.save();
    await asset.populate('allocatedTo', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Asset allocated successfully',
      asset
    });
  } catch (error) {
    console.error('Error allocating asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error allocating asset',
      error: error.message
    });
  }
});

// Return asset
router.post('/assets/:id/return', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const { condition, notes } = req.body;
    
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (asset.currentStatus !== 'Allocated') {
      return res.status(400).json({
        success: false,
        message: 'Asset is not allocated'
      });
    }

    asset.allocatedTo = null;
    asset.allocationDate = null;
    asset.expectedReturnDate = null;
    asset.actualReturnDate = new Date();
    asset.currentStatus = 'Available';
    if (condition) asset.condition = condition;
    asset.notes = notes || asset.notes;

    await asset.save();

    res.json({
      success: true,
      message: 'Asset returned successfully',
      asset
    });
  } catch (error) {
    console.error('Error returning asset:', error);
    res.status(500).json({
      success: false,
      message: 'Error returning asset',
      error: error.message
    });
  }
});

// Maintenance routes
router.post('/maintenance', authenticateJWT, isAdminOrHR, uploadMaintenance, async (req, res) => {
  try {
    const maintenanceData = {
      ...req.body,
      reportedBy: req.user._id,
      createdBy: req.user._id
    };

    if (req.files && req.files.length > 0) {
      maintenanceData.attachments = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: file.path
      }));
    }

    const maintenance = new Maintenance(maintenanceData);
    await maintenance.save();

    // Update asset status to under maintenance
    await Asset.findByIdAndUpdate(req.body.asset, {
      currentStatus: 'Under Maintenance'
    });

    await maintenance.populate('asset', 'assetName assetId');
    await maintenance.populate('reportedBy', 'firstName lastName');
    await maintenance.populate('assignedTo', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      maintenance
    });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating maintenance record',
      error: error.message
    });
  }
});

// Get all maintenance records
router.get('/maintenance', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;

    const query = {};
    if (status) query.status = status;

    const maintenance = await Maintenance.find(query)
      .populate('asset', 'assetName assetId serialNumber')
      .populate('reportedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Maintenance.countDocuments(query);

    res.json({
      success: true,
      maintenance,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching maintenance records',
      error: error.message
    });
  }
});

// Update maintenance status
router.put('/maintenance/:id', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const maintenance = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('asset', 'assetName assetId')
      .populate('reportedBy', 'firstName lastName')
      .populate('assignedTo', 'firstName lastName');

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found'
      });
    }

    // If maintenance is resolved, set asset back to available
    if (req.body.status === 'Resolved' && maintenance.asset) {
      await Asset.findByIdAndUpdate(maintenance.asset._id, {
        currentStatus: 'Available'
      });
    }

    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      maintenance
    });
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating maintenance record',
      error: error.message
    });
  }
});

// Dashboard statistics
router.get('/dashboard', authenticateJWT, isAdminOrHR, async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments({ isActive: true });
    const allocatedAssets = await Asset.countDocuments({ 
      isActive: true, 
      currentStatus: 'Allocated' 
    });
    const availableAssets = await Asset.countDocuments({ 
      isActive: true, 
      currentStatus: 'Available' 
    });
    const underMaintenance = await Asset.countDocuments({ 
      isActive: true, 
      currentStatus: 'Under Maintenance' 
    });
    
    const pendingMaintenance = await Maintenance.countDocuments({ 
      status: { $in: ['Reported', 'In Progress'] } 
    });

    res.json({
      success: true,
      statistics: {
        totalAssets,
        allocatedAssets,
        availableAssets,
        underMaintenance,
        pendingMaintenance
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;